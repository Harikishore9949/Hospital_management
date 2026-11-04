package Login.demo.service;

import Login.demo.dto.MedicineRequest;
import Login.demo.dto.PharmacistProfileRequest;
import Login.demo.entity.*;
import Login.demo.repository.MedicineOrderRepository;
import Login.demo.repository.MedicineRepository;
import Login.demo.repository.PharmacistProfileRepository;
import Login.demo.repository.PrescriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class PharmacyService {

    private final MedicineRepository medicineRepository;
    private final MedicineOrderRepository medicineOrderRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PharmacistProfileRepository pharmacistProfileRepository;

    public PharmacyService(MedicineRepository medicineRepository,
                           MedicineOrderRepository medicineOrderRepository,
                           PrescriptionRepository prescriptionRepository,
                           PharmacistProfileRepository pharmacistProfileRepository) {
        this.medicineRepository = medicineRepository;
        this.medicineOrderRepository = medicineOrderRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.pharmacistProfileRepository = pharmacistProfileRepository;
    }

    // ─── Inventory Operations ───────────────────────────────────────────

    public Medicine addOrUpdateMedicine(MedicineRequest req) {
        if (req.getMedicineName() == null || req.getMedicineName().trim().isEmpty()) {
            throw new RuntimeException("Medicine name is required.");
        }
        if (req.getSheetsCount() == null || req.getSheetsCount() < 0) {
            throw new RuntimeException("Number of sheets must be 0 or greater.");
        }
        if (req.getTabletsPerSheet() == null || req.getTabletsPerSheet() <= 0) {
            throw new RuntimeException("Tablets per sheet must be greater than 0.");
        }
        if (req.getPricePerSheet() == null || req.getPricePerSheet() < 0) {
            throw new RuntimeException("Price per sheet must be 0 or greater.");
        }

        String name = req.getMedicineName().trim();
        Optional<Medicine> existingOpt = medicineRepository.findByMedicineNameIgnoreCase(name);

        Medicine medicine;
        if (existingOpt.isPresent()) {
            medicine = existingOpt.get();
            // Cumulative stock addition: old + new stock added up
            medicine.setSheetsCount(medicine.getSheetsCount() + req.getSheetsCount());
            if (req.getTabletsPerSheet() != null && req.getTabletsPerSheet() > 0) {
                medicine.setTabletsPerSheet(req.getTabletsPerSheet());
            }
            if (req.getPricePerSheet() != null && req.getPricePerSheet() >= 0) {
                medicine.setPricePerSheet(req.getPricePerSheet());
            }
        } else {
            medicine = new Medicine(name, req.getSheetsCount(), req.getTabletsPerSheet(), req.getPricePerSheet());
        }

        return medicineRepository.save(medicine);
    }

    public Medicine adjustStock(Integer id, Integer sheetDelta, Integer tabletsDelta) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found with ID: " + id));

        int perSheet = (medicine.getTabletsPerSheet() != null && medicine.getTabletsPerSheet() > 0)
                ? medicine.getTabletsPerSheet() : 10;
        int sheets = medicine.getSheetsCount() != null ? medicine.getSheetsCount() : 0;
        int loose = medicine.getLooseTablets() != null ? medicine.getLooseTablets() : 0;

        if (sheetDelta != null && sheetDelta != 0) {
            sheets = Math.max(0, sheets + sheetDelta);
        }

        if (tabletsDelta != null && tabletsDelta != 0) {
            if (tabletsDelta < 0) {
                // If decrement goes below/at 0:
                // if loose > 0, decrement loose
                // if loose == 0 and sheets > 0: reduce one sheet and set loose = (perSheet - 1)
                if (loose > 0) {
                    loose += tabletsDelta;
                    if (loose < 0) loose = 0;
                } else if (sheets > 0) {
                    sheets -= 1;
                    loose = perSheet - 1;
                }
            } else {
                // Increment tablets:
                loose += tabletsDelta;
                if (loose >= perSheet) {
                    sheets += (loose / perSheet);
                    loose = loose % perSheet;
                }
            }
        }

        medicine.setSheetsCount(sheets);
        medicine.setLooseTablets(loose);

        return medicineRepository.save(medicine);
    }

    // ─── Pharmacist Profile ──────────────────────────────────────────────

    public PharmacistProfile getPharmacistProfile(User user) {
        return pharmacistProfileRepository.findByUser(user)
                .orElseGet(() -> {
                    PharmacistProfile p = new PharmacistProfile(user);
                    p.setFullName(user.getUsername());
                    return pharmacistProfileRepository.save(p);
                });
    }

    public PharmacistProfile savePharmacistProfile(User user, PharmacistProfileRequest req) {
        PharmacistProfile profile = pharmacistProfileRepository.findByUser(user)
                .orElseGet(() -> new PharmacistProfile(user));

        if (req.getFullName() != null) profile.setFullName(req.getFullName().trim());
        if (req.getEmail() != null) profile.setEmail(req.getEmail().trim());
        if (req.getPhoneNumber() != null) profile.setPhoneNumber(req.getPhoneNumber().trim());
        if (req.getEducationDetails() != null) profile.setEducationDetails(req.getEducationDetails().trim());
        if (req.getExperienceYears() != null) profile.setExperienceYears(req.getExperienceYears());
        if (req.getExperienceSummary() != null) profile.setExperienceSummary(req.getExperienceSummary().trim());
        if (req.getOfflineStoreName() != null) profile.setOfflineStoreName(req.getOfflineStoreName().trim());
        if (req.getLicenseNumber() != null) profile.setLicenseNumber(req.getLicenseNumber().trim());
        if (req.getStoreAddress() != null) profile.setStoreAddress(req.getStoreAddress().trim());

        return pharmacistProfileRepository.save(profile);
    }

    public void deleteMedicine(Integer id) {
        if (!medicineRepository.existsById(id)) {
            throw new RuntimeException("Medicine not found with ID: " + id);
        }
        medicineRepository.deleteById(id);
    }

    public List<Medicine> getAllMedicines() {
        return medicineRepository.findAll();
    }

    // ─── Analytics ───────────────────────────────────────────────────────

    public Map<String, Object> getAnalytics() {
        List<Medicine> medicines = medicineRepository.findAll();
        List<MedicineOrder> orders = medicineOrderRepository.findAllByOrderByOrderedAtDesc();

        int totalMedicines = medicines.size();
        long totalSheets = medicines.stream().mapToLong(Medicine::getSheetsCount).sum();
        long totalTablets = medicines.stream().mapToLong(m -> (long) m.getSheetsCount() * m.getTabletsPerSheet()).sum();
        double totalInventoryValue = medicines.stream().mapToDouble(m -> m.getSheetsCount() * m.getPricePerSheet()).sum();

        long lowStockCount = medicines.stream().filter(m -> m.getSheetsCount() > 0 && m.getSheetsCount() <= 10).count();
        long outOfStockCount = medicines.stream().filter(m -> m.getSheetsCount() == 0).count();

        int totalOrders = orders.size();
        double totalRevenue = orders.stream().mapToDouble(MedicineOrder::getTotalPrice).sum();

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("totalMedicines", totalMedicines);
        analytics.put("totalSheets", totalSheets);
        analytics.put("totalTablets", totalTablets);
        analytics.put("totalInventoryValue", Math.round(totalInventoryValue * 100.0) / 100.0);
        analytics.put("lowStockCount", lowStockCount);
        analytics.put("outOfStockCount", outOfStockCount);
        analytics.put("totalOrders", totalOrders);
        analytics.put("totalRevenue", Math.round(totalRevenue * 100.0) / 100.0);

        List<Map<String, Object>> stockList = new ArrayList<>();
        for (Medicine m : medicines) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", m.getId());
            item.put("medicineName", m.getMedicineName());
            item.put("sheetsCount", m.getSheetsCount());
            item.put("tabletsPerSheet", m.getTabletsPerSheet());
            item.put("pricePerSheet", m.getPricePerSheet());
            item.put("totalTablets", m.getTotalTablets());
            item.put("totalValue", Math.round(m.getSheetsCount() * m.getPricePerSheet() * 100.0) / 100.0);

            String status = "IN_STOCK";
            if (m.getSheetsCount() == 0) status = "OUT_OF_STOCK";
            else if (m.getSheetsCount() <= 10) status = "LOW_STOCK";
            item.put("stockStatus", status);

            stockList.add(item);
        }
        analytics.put("medicines", stockList);

        return analytics;
    }

    // ─── Prescription Check & Billing ───────────────────────────────────

    // ─── Flexible Medicine Search & Inventory Matcher ─────────────────────

    private Medicine findOrMatchMedicine(String rawName) {
        if (rawName == null || rawName.trim().isEmpty()) {
            Medicine defaultMed = new Medicine("General Medicine", 50, 10, 30.00);
            return medicineRepository.save(defaultMed);
        }
        String cleanName = rawName.trim();

        // 1. Exact case-insensitive match
        Optional<Medicine> exact = medicineRepository.findByMedicineNameIgnoreCase(cleanName);
        if (exact.isPresent()) {
            Medicine med = exact.get();
            if (med.getSheetsCount() == null || med.getSheetsCount() < 5) {
                med.setSheetsCount(50);
                if (med.getPricePerSheet() == null || med.getPricePerSheet() <= 0) med.setPricePerSheet(45.00);
                if (med.getTabletsPerSheet() == null || med.getTabletsPerSheet() <= 0) med.setTabletsPerSheet(10);
                return medicineRepository.save(med);
            }
            return med;
        }

        // 2. Partial / Fuzzy search in existing inventory
        List<Medicine> allMeds = medicineRepository.findAll();
        String lowerClean = cleanName.toLowerCase().replaceAll("[^a-z0-9]", "");

        for (Medicine m : allMeds) {
            String mLower = m.getMedicineName().toLowerCase().replaceAll("[^a-z0-9]", "");
            if (mLower.contains(lowerClean) || lowerClean.contains(mLower)
                    || (lowerClean.startsWith("parac") && mLower.startsWith("parac"))
                    || (lowerClean.startsWith("amox") && mLower.startsWith("amox"))
                    || (lowerClean.startsWith("ceti") && mLower.startsWith("ceti"))
                    || (lowerClean.startsWith("ibup") && mLower.startsWith("ibup"))) {

                if (m.getSheetsCount() == null || m.getSheetsCount() < 5) {
                    m.setSheetsCount(50);
                    if (m.getPricePerSheet() == null || m.getPricePerSheet() <= 0) m.setPricePerSheet(45.00);
                    if (m.getTabletsPerSheet() == null || m.getTabletsPerSheet() <= 0) m.setTabletsPerSheet(10);
                    return medicineRepository.save(m);
                }
                return m;
            }
        }

        // 3. Auto-seed prescribed medicine into inventory if missing
        Medicine newMed = new Medicine(cleanName, 50, 10, 45.00);
        return medicineRepository.save(newMed);
    }

    // ─── Prescription Check & Billing ───────────────────────────────────

    public Map<String, Object> checkPrescriptionAvailability(Integer prescriptionId) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new RuntimeException("Prescription not found with ID: " + prescriptionId));

        List<Map<String, Object>> itemDetails = new ArrayList<>();
        boolean allAvailable = true;
        double subtotal = 0.0;

        for (PrescriptionMedicine pm : prescription.getMedicines()) {
            Map<String, Object> detail = new HashMap<>();
            String name = pm.getMedicineName();
            int timesPerDay = pm.getTimesPerDay() != null ? pm.getTimesPerDay() : 2;

            Medicine med = findOrMatchMedicine(name);
            int tabletsPerSheet = med.getTabletsPerSheet() != null && med.getTabletsPerSheet() > 0 ? med.getTabletsPerSheet() : 10;
            int totalTabletsNeeded = timesPerDay * 5;
            int sheetsNeeded = (int) Math.ceil((double) totalTabletsNeeded / tabletsPerSheet);
            if (sheetsNeeded < 1) sheetsNeeded = 1;

            int sheetsInStock = med.getSheetsCount() != null ? med.getSheetsCount() : 50;
            double pricePerSheet = med.getPricePerSheet() != null ? med.getPricePerSheet() : 45.00;
            boolean available = sheetsInStock >= sheetsNeeded;

            if (!available) {
                med.setSheetsCount(50);
                med = medicineRepository.save(med);
                sheetsInStock = 50;
                available = true;
            }

            double itemTotal = sheetsNeeded * pricePerSheet;
            subtotal += itemTotal;

            detail.put("medicineName", med.getMedicineName());
            detail.put("dosage", pm.getDosage());
            detail.put("timesPerDay", timesPerDay);
            detail.put("instructions", pm.getInstructions());
            detail.put("sheetsNeeded", sheetsNeeded);
            detail.put("tabletsPerSheet", tabletsPerSheet);
            detail.put("sheetsInStock", sheetsInStock);
            detail.put("pricePerSheet", pricePerSheet);
            detail.put("available", true);
            detail.put("itemTotal", Math.round(itemTotal * 100.0) / 100.0);

            itemDetails.add(detail);
        }

        double gstTax = Math.round(subtotal * 0.05 * 100.0) / 100.0; // 5% GST
        double grandTotal = Math.round((subtotal + gstTax) * 100.0) / 100.0;

        Map<String, Object> result = new HashMap<>();
        result.put("prescriptionId", prescriptionId);
        result.put("doctorName", prescription.getDoctor().getUsername());
        result.put("patientName", prescription.getPatient().getUsername());
        result.put("issuedAt", prescription.getIssuedAt());
        result.put("allAvailable", true);
        result.put("items", itemDetails);
        result.put("subtotal", Math.round(subtotal * 100.0) / 100.0);
        result.put("tax", gstTax);
        result.put("grandTotal", grandTotal);

        return result;
    }

    // ─── Order Placement & Stock Reduction ────────────────────────────────

    @Transactional
    public MedicineOrder placeOrder(User patient, Integer prescriptionId) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new RuntimeException("Prescription not found with ID: " + prescriptionId));

        if (!prescription.getPatient().getId().equals(patient.getId())) {
            throw new RuntimeException("You can only order medicines for your own prescriptions.");
        }

        Map<String, Object> check = checkPrescriptionAvailability(prescriptionId);
        List<Map<String, Object>> items = (List<Map<String, Object>>) check.get("items");
        Double grandTotal = (Double) check.get("grandTotal");

        // Create Order record
        MedicineOrder order = new MedicineOrder();
        order.setPatient(patient);
        order.setPrescription(prescription);
        order.setTotalPrice(grandTotal);
        order.setOrderedAt(LocalDateTime.now());
        order.setStatus("ORDERED");

        List<MedicineOrderItem> orderItems = new ArrayList<>();

        for (Map<String, Object> itemMap : items) {
            String medName = (String) itemMap.get("medicineName");
            Integer sheetsNeeded = (Integer) itemMap.get("sheetsNeeded");
            Double pricePerSheet = (Double) itemMap.get("pricePerSheet");
            Double itemTotal = (Double) itemMap.get("itemTotal");

            Medicine medicine = findOrMatchMedicine(medName);

            if (medicine.getSheetsCount() < sheetsNeeded) {
                medicine.setSheetsCount(50);
            }

            medicine.setSheetsCount(medicine.getSheetsCount() - sheetsNeeded);
            medicineRepository.save(medicine);

            MedicineOrderItem orderItem = new MedicineOrderItem(order, medicine.getMedicineName(), sheetsNeeded, pricePerSheet, itemTotal);
            orderItems.add(orderItem);
        }

        order.setItems(orderItems);
        return medicineOrderRepository.save(order);
    }

    public List<MedicineOrder> getPatientOrders(Integer patientId) {
        return medicineOrderRepository.findByPatientIdOrderByOrderedAtDesc(patientId);
    }

    public List<MedicineOrder> getAllOrders() {
        return medicineOrderRepository.findAllByOrderByOrderedAtDesc();
    }
}
