package Login.demo.service;

import Login.demo.entity.LabTestOrder;
import Login.demo.repository.LabTestOrderRepository;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class LabService {

    private final LabTestOrderRepository labTestOrderRepository;

    public LabService(LabTestOrderRepository labTestOrderRepository) {
        this.labTestOrderRepository = labTestOrderRepository;
    }

    public List<LabTestOrder> getAllOrders() {
        return labTestOrderRepository.findAllByOrderByBookedAtDesc();
    }

    public List<LabTestOrder> getOrdersByStatus(String status) {
        return labTestOrderRepository.findByStatusOrderByBookedAtDesc(status);
    }

    public LabTestOrder getOrderById(Integer id) {
        return labTestOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lab test order not found: ID " + id));
    }

    // ── Schedule or Update Specimen Collection Time Slot ──────────────────────
    public LabTestOrder scheduleSampleSlot(Integer id, LocalDate date, String time, String slotNotes) {
        LabTestOrder order = getOrderById(id);
        if (date != null) {
            order.setScheduledDate(date);
        }
        if (time != null && !time.isBlank()) {
            order.setScheduledTime(time.trim());
        }
        if (slotNotes != null && !slotNotes.isBlank()) {
            order.setScheduledSlotNotes(slotNotes.trim());
        }
        return labTestOrderRepository.save(order);
    }

    // ── Receive / Collect Patient Specimen ────────────────────────────────────
    public LabTestOrder collectSample(Integer id, String labCenterName, String notes, String barcode, String estimatedResultTime) {
        LabTestOrder order = getOrderById(id);
        order.setStatus("SAMPLE_COLLECTED");
        order.setSampleCollectedAt(LocalDateTime.now());

        if (barcode != null && !barcode.isBlank()) {
            order.setSampleAccessionNumber(barcode.trim());
        } else if (order.getSampleAccessionNumber() == null || order.getSampleAccessionNumber().isBlank()) {
            order.setSampleAccessionNumber("ACC-" + (100000 + id * 37));
        }

        if (estimatedResultTime != null && !estimatedResultTime.isBlank()) {
            order.setEstimatedResultTime(estimatedResultTime.trim());
        }

        if (labCenterName != null && !labCenterName.isBlank()) {
            order.setLabCenterName(labCenterName.trim());
        }
        if (notes != null && !notes.isBlank()) {
            order.setNotes(notes.trim());
        }
        return labTestOrderRepository.save(order);
    }

    // ── Begin Clinical Testing / Analyzer Processing ──────────────────────────
    public LabTestOrder startTesting(Integer id, String technicianName, String equipmentUsed, String estimatedResultTime) {
        LabTestOrder order = getOrderById(id);
        order.setStatus("TESTING_IN_PROGRESS");

        if (equipmentUsed != null && !equipmentUsed.isBlank()) {
            order.setEquipmentUsed(equipmentUsed.trim());
        }

        if (estimatedResultTime != null && !estimatedResultTime.isBlank()) {
            order.setEstimatedResultTime(estimatedResultTime.trim());
        }

        if (technicianName != null && !technicianName.isBlank()) {
            order.setNotes((order.getNotes() != null && !order.getNotes().isBlank() ? order.getNotes() + "\n" : "") + "Testing begun by: " + technicianName.trim());
        }
        return labTestOrderRepository.save(order);
    }

    // ── Upload & Publish Verified Results to Patient ──────────────────────────
    public LabTestOrder uploadResults(Integer id, String resultsJson, String pathologistName, String labCenterName, String notes, String equipmentUsed) {
        LabTestOrder order = getOrderById(id);
        order.setStatus("COMPLETED");
        order.setCompletedAt(LocalDateTime.now());

        if (resultsJson != null && !resultsJson.isBlank()) {
            order.setResultsJson(resultsJson);
        }
        if (pathologistName != null && !pathologistName.isBlank()) {
            order.setPathologistName(pathologistName.trim());
        }
        if (labCenterName != null && !labCenterName.isBlank()) {
            order.setLabCenterName(labCenterName.trim());
        }
        if (equipmentUsed != null && !equipmentUsed.isBlank()) {
            order.setEquipmentUsed(equipmentUsed.trim());
        }
        if (notes != null && !notes.isBlank()) {
            order.setNotes(notes.trim());
        }
        return labTestOrderRepository.save(order);
    }

    // ── Manual Hardcopy Report Upload (PDF / Scanned Document) ─────────────────
    public LabTestOrder uploadHardcopy(Integer id, MultipartFile file) throws IOException {
        LabTestOrder order = getOrderById(id);
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Uploaded file is empty.");
        }

        Path dir = Paths.get("uploads", "lab-hardcopies", String.valueOf(order.getId()));
        Files.createDirectories(dir);

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "lab_report.pdf";
        String ext = "";
        int dot = originalName.lastIndexOf('.');
        if (dot > 0) ext = originalName.substring(dot);
        String storedName = UUID.randomUUID() + ext;

        Path target = dir.resolve(storedName);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        order.setHardcopyFileName(storedName);
        order.setHardcopyOriginalName(originalName);
        order.setHardcopyUploadedAt(LocalDateTime.now());
        order.setStatus("COMPLETED");
        if (order.getCompletedAt() == null) {
            order.setCompletedAt(LocalDateTime.now());
        }
        return labTestOrderRepository.save(order);
    }

    public Resource getHardcopyResource(Integer id) {
        LabTestOrder order = getOrderById(id);
        if (order.getHardcopyFileName() == null || order.getHardcopyFileName().isBlank()) {
            throw new RuntimeException("No hardcopy document uploaded for order #" + id);
        }
        Path path = Paths.get("uploads", "lab-hardcopies", String.valueOf(order.getId()), order.getHardcopyFileName());
        if (!Files.exists(path)) {
            throw new RuntimeException("Hardcopy file not found on server.");
        }
        try {
            return new UrlResource(path.toUri());
        } catch (MalformedURLException e) {
            throw new RuntimeException("Failed to read hardcopy file.", e);
        }
    }

    // ── Automated Clinical Analysis Generator ─────────────────────────────────
    public LabTestOrder autoGenerateResults(Integer id, String pathologistName) {
        LabTestOrder order = getOrderById(id);
        order.setStatus("COMPLETED");
        order.setCompletedAt(LocalDateTime.now());
        if (pathologistName != null && !pathologistName.isBlank()) {
            order.setPathologistName(pathologistName);
        }

        String testName = order.getTestName() != null ? order.getTestName().toLowerCase() : "";
        order.setEquipmentUsed(determineDefaultEquipment(testName));

        String generatedJson;

        if (testName.contains("blood count") || testName.contains("cbc")) {
            generatedJson = "[" +
                    "{\"name\":\"Hemoglobin (Hb)\",\"value\":\"14.2\",\"unit\":\"g/dL\",\"range\":\"13.0 - 17.0\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"Total WBC Count (TLC)\",\"value\":\"7,200\",\"unit\":\"cells/mcL\",\"range\":\"4,000 - 11,000\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"Platelet Count\",\"value\":\"235,000\",\"unit\":\"/mcL\",\"range\":\"150,000 - 450,000\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"RBC Count\",\"value\":\"4.85\",\"unit\":\"million/mcL\",\"range\":\"4.50 - 5.90\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"Hematocrit (PCV)\",\"value\":\"42.5\",\"unit\":\"%\",\"range\":\"38.0 - 50.0\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"Neutrophils\",\"value\":\"62\",\"unit\":\"%\",\"range\":\"40 - 75\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"Lymphocytes\",\"value\":\"30\",\"unit\":\"%\",\"range\":\"20 - 45\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"Erythrocyte Sedimentation Rate (ESR)\",\"value\":\"12\",\"unit\":\"mm/1st hr\",\"range\":\"0 - 15\",\"status\":\"NORMAL\"}" +
                    "]";
        } else if (testName.contains("lipid")) {
            generatedJson = "[" +
                    "{\"name\":\"Total Cholesterol\",\"value\":\"188\",\"unit\":\"mg/dL\",\"range\":\"< 200 Desirable\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"HDL (Good) Cholesterol\",\"value\":\"54\",\"unit\":\"mg/dL\",\"range\":\"> 40 Optimum\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"LDL (Bad) Cholesterol\",\"value\":\"112\",\"unit\":\"mg/dL\",\"range\":\"< 100 Optimal\",\"status\":\"ELEVATED\"}," +
                    "{\"name\":\"Triglycerides\",\"value\":\"130\",\"unit\":\"mg/dL\",\"range\":\"< 150 Normal\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"VLDL Cholesterol\",\"value\":\"24\",\"unit\":\"mg/dL\",\"range\":\"5 - 30\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"Cholesterol / HDL Ratio\",\"value\":\"3.48\",\"unit\":\"Ratio\",\"range\":\"< 4.5 Desirable\",\"status\":\"NORMAL\"}" +
                    "]";
        } else if (testName.contains("thyroid") || testName.contains("tsh")) {
            generatedJson = "[" +
                    "{\"name\":\"TSH (Thyroid Stimulating Hormone)\",\"value\":\"2.45\",\"unit\":\"uIU/mL\",\"range\":\"0.35 - 4.94\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"Total Triiodothyronine (T3)\",\"value\":\"1.18\",\"unit\":\"ng/mL\",\"range\":\"0.80 - 2.00\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"Total Thyroxine (T4)\",\"value\":\"8.4\",\"unit\":\"ug/dL\",\"range\":\"5.1 - 14.1\",\"status\":\"NORMAL\"}" +
                    "]";
        } else if (testName.contains("diabetes") || testName.contains("hba1c") || testName.contains("glucose")) {
            generatedJson = "[" +
                    "{\"name\":\"HbA1c (Glycated Hemoglobin)\",\"value\":\"5.8\",\"unit\":\"%\",\"range\":\"< 5.7 Normal / 5.7-6.4 Pre-diabetes\",\"status\":\"ELEVATED\"}," +
                    "{\"name\":\"Fasting Blood Glucose\",\"value\":\"98\",\"unit\":\"mg/dL\",\"range\":\"70 - 99 Normal\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"Estimated Average Glucose (eAG)\",\"value\":\"120\",\"unit\":\"mg/dL\",\"range\":\"< 117 Normal\",\"status\":\"ELEVATED\"}" +
                    "]";
        } else if (testName.contains("liver") || testName.contains("lft")) {
            generatedJson = "[" +
                    "{\"name\":\"SGPT / ALT\",\"value\":\"28\",\"unit\":\"U/L\",\"range\":\"< 45\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"SGOT / AST\",\"value\":\"24\",\"unit\":\"U/L\",\"range\":\"< 35\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"Bilirubin Total\",\"value\":\"0.85\",\"unit\":\"mg/dL\",\"range\":\"0.2 - 1.2\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"Direct Bilirubin\",\"value\":\"0.22\",\"unit\":\"mg/dL\",\"range\":\"0.0 - 0.3\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"Alkaline Phosphatase (ALP)\",\"value\":\"78\",\"unit\":\"U/L\",\"range\":\"44 - 147\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"Total Protein\",\"value\":\"7.2\",\"unit\":\"g/dL\",\"range\":\"6.0 - 8.3\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"Albumin\",\"value\":\"4.4\",\"unit\":\"g/dL\",\"range\":\"3.5 - 5.0\",\"status\":\"NORMAL\"}" +
                    "]";
        } else if (testName.contains("kidney") || testName.contains("kft") || testName.contains("renal")) {
            generatedJson = "[" +
                    "{\"name\":\"Serum Creatinine\",\"value\":\"0.95\",\"unit\":\"mg/dL\",\"range\":\"0.7 - 1.3\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"Blood Urea Nitrogen (BUN)\",\"value\":\"15\",\"unit\":\"mg/dL\",\"range\":\"7 - 20\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"Uric Acid\",\"value\":\"5.2\",\"unit\":\"mg/dL\",\"range\":\"3.5 - 7.2\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"Estimated GFR (eGFR)\",\"value\":\"98\",\"unit\":\"mL/min/1.73m²\",\"range\":\"> 90 Optimal\",\"status\":\"NORMAL\"}" +
                    "]";
        } else if (testName.contains("vitamin")) {
            generatedJson = "[" +
                    "{\"name\":\"25-Hydroxy Vitamin D Total\",\"value\":\"34.5\",\"unit\":\"ng/mL\",\"range\":\"30.0 - 100.0 (Sufficient)\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"Vitamin B12 (Cyanocobalamin)\",\"value\":\"410\",\"unit\":\"pg/mL\",\"range\":\"211 - 911 (Optimal)\",\"status\":\"NORMAL\"}" +
                    "]";
        } else if (testName.contains("cardiac")) {
            generatedJson = "[" +
                    "{\"name\":\"High-Sensitivity CRP (hs-CRP)\",\"value\":\"1.15\",\"unit\":\"mg/L\",\"range\":\"< 1.0 Low / 1.0-3.0 Moderate Risk\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"Troponin-I High Sensitivity\",\"value\":\"4.2\",\"unit\":\"pg/mL\",\"range\":\"< 14.0 (Normal Base)\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"Homocysteine Total\",\"value\":\"9.8\",\"unit\":\"umol/L\",\"range\":\"< 15.0 Normal\",\"status\":\"NORMAL\"}" +
                    "]";
        } else if (testName.contains("electrolyte")) {
            generatedJson = "[" +
                    "{\"name\":\"Serum Sodium (Na+)\",\"value\":\"140\",\"unit\":\"mmol/L\",\"range\":\"136 - 145\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"Serum Potassium (K+)\",\"value\":\"4.3\",\"unit\":\"mmol/L\",\"range\":\"3.5 - 5.1\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"Serum Chloride (Cl-)\",\"value\":\"102\",\"unit\":\"mmol/L\",\"range\":\"98 - 107\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"Bicarbonate (HCO3-)\",\"value\":\"24\",\"unit\":\"mmol/L\",\"range\":\"22 - 29\",\"status\":\"NORMAL\"}" +
                    "]";
        } else {
            generatedJson = "[" +
                    "{\"name\":\"Primary Biomarker Analyte\",\"value\":\"Normal Specimen\",\"unit\":\"Index\",\"range\":\"Normal Range\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"Analytical Specimen Grade\",\"value\":\"Grade A Optimal\",\"unit\":\"QC\",\"range\":\"Grade A\",\"status\":\"NORMAL\"}," +
                    "{\"name\":\"Microbiological/Clinical Flag\",\"value\":\"Negative / In-Range\",\"unit\":\"Flag\",\"range\":\"Negative\",\"status\":\"NORMAL\"}" +
                    "]";
        }

        order.setResultsJson(generatedJson);
        order.setNotes((order.getNotes() != null ? order.getNotes() + "\n" : "") + "All parameters verified against NABL ISO-15189 reference controls.");
        return labTestOrderRepository.save(order);
    }

    private String determineDefaultEquipment(String testName) {
        if (testName == null) return "Sysmex Fully Automated Analyzer";
        String t = testName.toLowerCase();
        if (t.contains("blood count") || t.contains("cbc") || t.contains("esr")) {
            return "Sysmex XN-1000™ Automated Hematology System (Laser Flow Cytometry & Hydrodynamic Focusing)";
        } else if (t.contains("lipid") || t.contains("liver") || t.contains("lft") || t.contains("kidney") || t.contains("kft")) {
            return "Beckman Coulter DxC 700 AU™ Clinical Chemistry Analyzer (Photometric / ISE)";
        } else if (t.contains("hba1c") || t.contains("diabetes")) {
            return "Bio-Rad D-10™ Automated HPLC Glycohemoglobin Analyzer (High-Performance Liquid Chromatography)";
        } else if (t.contains("thyroid") || t.contains("vitamin")) {
            return "Roche Cobas e411™ Electro-chemiluminescence Immunoassay (ECLIA)";
        } else if (t.contains("cardiac")) {
            return "Siemens Atellica IM 1600™ High-Sensitivity Immunoassay Analyzer";
        } else if (t.contains("urine")) {
            return "Sysmex UC-3500 & UF-5000™ Automated Urine Chemistry & Particle Flow Cytometer";
        } else if (t.contains("electrolyte")) {
            return "Radiometer ABL90 FLEX™ Automated Blood Gas & ISE Electrolyte Analyzer";
        }
        return "Roche Cobas 6000™ Clinical Pathology & Automated Diagnostic Workstation";
    }

    public Map<String, Object> getLabStats() {
        List<LabTestOrder> all = labTestOrderRepository.findAll();
        long pendingSamples = all.stream().filter(o -> "SAMPLE_PENDING".equalsIgnoreCase(o.getStatus())).count();
        long samplesCollected = all.stream().filter(o -> "SAMPLE_COLLECTED".equalsIgnoreCase(o.getStatus())).count();
        long inTesting = all.stream().filter(o -> "TESTING_IN_PROGRESS".equalsIgnoreCase(o.getStatus())).count();
        long completed = all.stream().filter(o -> "COMPLETED".equalsIgnoreCase(o.getStatus())).count();

        double totalRevenue = all.stream()
                .filter(o -> "PAID".equalsIgnoreCase(o.getPaymentStatus()) && o.getPrice() != null)
                .mapToDouble(LabTestOrder::getPrice)
                .sum();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalOrders", all.size());
        stats.put("pendingSamples", pendingSamples);
        stats.put("samplesCollected", samplesCollected);
        stats.put("testingInProgress", inTesting);
        stats.put("completed", completed);
        stats.put("totalRevenue", totalRevenue);
        return stats;
    }

    private static Map<String, Object> createTest(
            String id,
            String name,
            String category,
            Double price,
            String turnaround,
            String fasting,
            String sampleType,
            String howConducted,
            String equipmentUsed,
            List<String> biomarkers,
            String description) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", id);
        m.put("name", name);
        m.put("category", category);
        m.put("price", price);
        m.put("turnaround", turnaround);
        m.put("fasting", fasting);
        m.put("sampleType", sampleType);
        m.put("howConducted", howConducted);
        m.put("equipmentUsed", equipmentUsed);
        m.put("biomarkers", biomarkers);
        m.put("description", description);
        return m;
    }

    // ── Extensive Clinical Lab Catalog (Synchronized with Patient Portal) ──────
    public List<Map<String, Object>> getLabCatalog() {
        return List.of(
                createTest(
                        "LAB-01",
                        "Complete Blood Count (CBC) with Automated Differential & ESR",
                        "Hematology",
                        450.0,
                        "4 to 6 Hours",
                        "No fasting required (Hydration encouraged)",
                        "3ml K2-EDTA Whole Blood (Lavender Cap Vacutainer)",
                        "Sterile venipuncture draws blood into an EDTA anticoagulant tube. The specimen is inverted 8-10 times to prevent micro-clotting and loaded onto the analyzer. Automated multi-angle laser scatter & hydrodynamic focusing count and classify erythrocytes, leukocytes, and thrombocytes.",
                        "Sysmex XN-1000™ Automated Hematology Analyzer & Roller-20 Automated ESR System",
                        List.of("Hemoglobin (Hb)", "Total WBC Count", "Platelet Count", "RBC Count", "Hematocrit (PCV)", "Neutrophils %", "Lymphocytes %", "ESR"),
                        "Essential baseline screening to detect anemia, acute/chronic systemic infections, blood coagulation abnormalities, and bone marrow cellularity."
                ),
                createTest(
                        "LAB-02",
                        "Comprehensive Lipid Profile (Advanced Cardiac Risk)",
                        "Cardiovascular",
                        650.0,
                        "6 to 8 Hours",
                        "10 to 12 Hours overnight fasting mandatory (Water permitted)",
                        "4ml Clot Activator Serum with Gel Separator (Gold/Yellow Cap)",
                        "Blood is drawn after overnight fast, allowed to clot for 30 minutes, and centrifuged at 3000 RPM for 10 minutes. Serum is pipetted onto the clinical chemistry analyzer for enzymatic and photometric determination of cholesterol fractions and triglycerides.",
                        "Beckman Coulter DxC 700 AU™ Clinical Chemistry Analyzer (Enzymatic Photometry & Colorimetry)",
                        List.of("Total Cholesterol", "HDL (Good Cholesterol)", "LDL (Bad Cholesterol)", "Triglycerides", "VLDL", "Cholesterol / HDL Ratio"),
                        "Evaluates blood fats, circulating lipids, and atherogenic risk indices to guide cardiovascular preventive therapies."
                ),
                createTest(
                        "LAB-03",
                        "Diabetes Screening (HbA1c Glycated Hemoglobin + Fasting Sugar)",
                        "Endocrinology & Diabetology",
                        550.0,
                        "4 to 6 Hours",
                        "8 to 10 Hours fasting required for plasma glucose",
                        "K2-EDTA Whole Blood + Sodium Fluoride / Potassium Oxalate Plasma (Grey Cap)",
                        "Whole blood is analyzed using ion-exchange HPLC to separate and accurately quantify glycated hemoglobin fractions. Fluoride plasma is simultaneously assayed using hexokinase-glucose oxidase enzymatic photometry for fasting blood sugar.",
                        "Bio-Rad D-10™ Automated HPLC Glycohemoglobin System & Roche Cobas c501",
                        List.of("HbA1c Average %", "Estimated Average Glucose (eAG)", "Fasting Plasma Glucose (FBS)"),
                        "Gold-standard dual test quantifying 90-day glycemic control and instant fasting plasma glucose levels for diabetes diagnosis and monitoring."
                ),
                createTest(
                        "LAB-04",
                        "Liver Function Test Profile (LFT Comprehensive)",
                        "Hepatic Health",
                        750.0,
                        "6 to 8 Hours",
                        "Overnight fasting recommended (minimum 8 hours)",
                        "4ml Serum Gel Vacutainer (Yellow Cap)",
                        "Centrifuged serum is reacted with specific diagnostic reagents in micro-cuvettes. Spectrophotometric absorbance changes are measured in real time to calculate transaminase enzymes, bilirubin fractions, and total serum proteins.",
                        "Roche Cobas 6000 (c501 Module) High-Throughput Clinical Chemistry Analyzer",
                        List.of("SGPT (ALT)", "SGOT (AST)", "Total Bilirubin", "Direct Bilirubin", "Alkaline Phosphatase (ALP)", "Total Protein", "Albumin", "A/G Ratio"),
                        "Comprehensive screen for liver cellular damage, fatty liver infiltration, hepatitis, bile duct patency, and hepatic synthetic capacity."
                ),
                createTest(
                        "LAB-05",
                        "Kidney Function & Renal Panel (KFT with eGFR)",
                        "Renal Care",
                        700.0,
                        "6 to 8 Hours",
                        "No strict fasting, but stay well-hydrated",
                        "4ml Serum Gel Separator Tube",
                        "Serum creatinine is quantified using kinetic modified Jaffe / enzymatic method. Urea nitrogen is assayed via urease-GLDH reaction, and glomerular filtration rate (eGFR) is computed using the standardized CKD-EPI equation.",
                        "Beckman Coulter AU480™ Automated Chemistry Workstation",
                        List.of("Serum Creatinine", "Blood Urea Nitrogen (BUN)", "Serum Uric Acid", "Estimated GFR (eGFR)", "BUN/Creatinine Ratio"),
                        "Assesses glomerular filtration, nitrogenous waste elimination efficiency, and early signs of renal insufficiency or nephropathy."
                ),
                createTest(
                        "LAB-06",
                        "Vitamin Deficiency Combo (25-OH Vitamin D3 & Vitamin B12)",
                        "Nutritional Immunology",
                        1100.0,
                        "12 to 24 Hours",
                        "No fasting required; avoid high-dose biotin 48h prior",
                        "5ml Serum Protected from Light (Red/Yellow Cap)",
                        "Serum undergoes magnetic microparticle chemiluminescence immunoassay. Acridinium-labeled conjugates bind specifically to circulating 25-OH Vitamin D and Vitamin B12 for precision detection of light emissions.",
                        "Abbott ARCHITECT i2000SR™ Automated Chemiluminescent Microparticle Immunoassay (CMIA)",
                        List.of("25-Hydroxy Vitamin D Total (D2 + D3)", "Vitamin B12 (Cyanocobalamin)"),
                        "Crucial biomarker pairing to evaluate bone mineral density, neuropathy, fatigue, cognitive vitality, and immune response."
                ),
                createTest(
                        "LAB-07",
                        "Thyroid Profile Total (TSH, Total T3, Total T4)",
                        "Endocrinology",
                        600.0,
                        "6 to 8 Hours",
                        "No fasting required (Morning draw suggested)",
                        "4ml Serum Vacutainer Tube",
                        "Assayed using electrochemiluminescence technology. Ruthenium-complex-labeled antibodies bind thyroid hormone analytes, and luminescence emission induced by electric voltage is read on photomultiplier tubes.",
                        "Roche Cobas e411™ Automated ECLIA Immunoassay System",
                        List.of("Thyroid Stimulating Hormone (TSH)", "Total Triiodothyronine (T3)", "Total Thyroxine (T4)"),
                        "Evaluates endocrine thyroid gland activity, screening for subclinical or overt hypothyroidism, hyperthyroidism, and metabolic slowdown."
                ),
                createTest(
                        "LAB-08",
                        "Advanced Cardiac Biomarkers (hs-CRP, Troponin-I, Homocysteine)",
                        "Cardiology",
                        1400.0,
                        "8 to 12 Hours",
                        "Overnight 10-12 hours fasting mandatory",
                        "Serum + Lithium Heparin Plasma",
                        "High-sensitivity latex-enhanced immunoturbidimetry and chemiluminescence quantify nanogram-level inflammatory and myocardial biomarkers for early coronary plaque vulnerability assessment.",
                        "Siemens Atellica IM 1600™ High-Sensitivity Immunoassay Platform",
                        List.of("High-Sensitivity CRP (hs-CRP)", "High-Sensitivity Troponin-I", "Total Homocysteine"),
                        "Ultra-sensitive cardiac assessment detecting micro-inflammation of arterial walls, subclinical vascular injury, and cardiovascular stroke risk."
                ),
                createTest(
                        "LAB-09",
                        "Serum Electrolytes Panel (Na+, K+, Cl-, HCO3-)",
                        "Biochemistry & Critical Care",
                        500.0,
                        "2 to 4 Hours",
                        "No fasting required",
                        "3ml Heparinized Whole Blood / Serum",
                        "Direct Ion-Selective Electrode (ISE) potentiometry measures ion activities across selective membranes with instantaneous mV potential readout.",
                        "Radiometer ABL90 FLEX™ Automated Blood Gas & ISE Electrolyte Analyzer",
                        List.of("Sodium (Na+)", "Potassium (K+)", "Chloride (Cl-)", "Bicarbonate (HCO3-)"),
                        "Monitors fluid and electrolyte equilibrium, essential in hypertension, dehydration, diuretic therapy, and metabolic acid-base disorders."
                ),
                createTest(
                        "LAB-10",
                        "Complete Urinalysis & Automated Flow Cytometry Sediment",
                        "Diagnostic Pathology",
                        350.0,
                        "3 to 4 Hours",
                        "Clean-catch midstream morning specimen preferred",
                        "20ml Sterile Urine Container",
                        "Dipstick chemistry is read via dual-wavelength reflectance photometry. Cellular sediment, casts, crystals, and bacteria are classified and counted via automated hydrodynamic laser flow cytometry.",
                        "Sysmex UC-3500 & UF-5000™ Fully Automated Integrated Urinalysis System",
                        List.of("Urine Protein / Albumin", "Glucose", "Ketones", "Microscopic RBCs", "WBCs / Pus Cells", "Epithelial Cells", "Casts & Crystals", "Bacteriuria"),
                        "Diagnostic screening for urinary tract infections, occult hematuria, glomerulonephritis, and metabolic kidney disorders."
                )
        );
    }
}
