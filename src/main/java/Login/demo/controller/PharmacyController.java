package Login.demo.controller;

import Login.demo.dto.MedicineRequest;
import Login.demo.entity.Medicine;
import Login.demo.entity.MedicineOrder;
import Login.demo.entity.Role;
import Login.demo.entity.User;
import Login.demo.repository.UserRepository;
import Login.demo.service.PharmacyService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pharmacy")
public class PharmacyController {

    private final PharmacyService pharmacyService;
    private final UserRepository userRepository;

    public PharmacyController(PharmacyService pharmacyService, UserRepository userRepository) {
        this.pharmacyService = pharmacyService;
        this.userRepository = userRepository;
    }

    private User getCallerUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("Unauthorized: Authentication required.");
        }
        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found: " + auth.getName()));
    }

    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint() {
        return ResponseEntity.ok("Pharmacy API connection operational.");
    }

    // ─── Inventory Management (Pharmacy Role) ────────────────────────────

    @PostMapping("/medicines")
    public ResponseEntity<Medicine> addOrUpdateMedicine(@RequestBody MedicineRequest req, Authentication auth) {
        User caller = getCallerUser(auth);
        if (caller.getRole() != Role.PHARMACY && caller.getRole() != Role.ADMIN) {
            throw new RuntimeException("Access denied: Pharmacy or Admin authority required.");
        }
        Medicine medicine = pharmacyService.addOrUpdateMedicine(req);
        return ResponseEntity.ok(medicine);
    }

    @PostMapping("/medicines/{id}/adjust")
    public ResponseEntity<Medicine> adjustStock(
            @PathVariable Integer id,
            @RequestBody Map<String, Integer> delta,
            Authentication auth) {
        User caller = getCallerUser(auth);
        if (caller.getRole() != Role.PHARMACY && caller.getRole() != Role.ADMIN) {
            throw new RuntimeException("Access denied: Pharmacy or Admin authority required.");
        }
        Integer sheetDelta = delta.get("sheetDelta");
        Integer tabletsDelta = delta.get("tabletsDelta") != null ? delta.get("tabletsDelta") : delta.get("tabletsPerSheetDelta");
        Medicine updated = pharmacyService.adjustStock(id, sheetDelta, tabletsDelta);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/profile")
    public ResponseEntity<Login.demo.entity.PharmacistProfile> getMyProfile(Authentication auth) {
        User caller = getCallerUser(auth);
        return ResponseEntity.ok(pharmacyService.getPharmacistProfile(caller));
    }

    @PutMapping("/profile")
    public ResponseEntity<Login.demo.entity.PharmacistProfile> saveMyProfile(
            @RequestBody Login.demo.dto.PharmacistProfileRequest req,
            Authentication auth) {
        User caller = getCallerUser(auth);
        return ResponseEntity.ok(pharmacyService.savePharmacistProfile(caller, req));
    }

    @DeleteMapping("/medicines/{id}")
    public ResponseEntity<Map<String, String>> deleteMedicine(@PathVariable Integer id, Authentication auth) {
        User caller = getCallerUser(auth);
        if (caller.getRole() != Role.PHARMACY && caller.getRole() != Role.ADMIN) {
            throw new RuntimeException("Access denied: Pharmacy or Admin authority required.");
        }
        pharmacyService.deleteMedicine(id);
        return ResponseEntity.ok(Map.of("message", "Medicine deleted successfully."));
    }

    @GetMapping("/medicines")
    public ResponseEntity<List<Medicine>> getAllMedicines() {
        return ResponseEntity.ok(pharmacyService.getAllMedicines());
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics(Authentication auth) {
        User caller = getCallerUser(auth);
        if (caller.getRole() != Role.PHARMACY && caller.getRole() != Role.ADMIN) {
            throw new RuntimeException("Access denied: Pharmacy or Admin authority required.");
        }
        return ResponseEntity.ok(pharmacyService.getAnalytics());
    }

    // ─── Prescription Check & Customer Orders ────────────────────────────

    @GetMapping("/prescriptions/{prescriptionId}/check")
    public ResponseEntity<Map<String, Object>> checkAvailability(@PathVariable Integer prescriptionId) {
        return ResponseEntity.ok(pharmacyService.checkPrescriptionAvailability(prescriptionId));
    }

    @PostMapping("/orders")
    public ResponseEntity<MedicineOrder> placeOrder(@RequestBody Map<String, Integer> req, Authentication auth) {
        User caller = getCallerUser(auth);
        if (caller.getRole() != Role.PATIENT) {
            throw new RuntimeException("Only patients can place prescription medicine orders.");
        }
        Integer prescriptionId = req.get("prescriptionId");
        if (prescriptionId == null) {
            throw new RuntimeException("prescriptionId is required.");
        }
        MedicineOrder order = pharmacyService.placeOrder(caller, prescriptionId);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/orders/my")
    public ResponseEntity<List<MedicineOrder>> getMyOrders(Authentication auth) {
        User caller = getCallerUser(auth);
        return ResponseEntity.ok(pharmacyService.getPatientOrders(caller.getId()));
    }

    @GetMapping("/orders")
    public ResponseEntity<List<MedicineOrder>> getAllOrders(Authentication auth) {
        User caller = getCallerUser(auth);
        if (caller.getRole() != Role.PHARMACY && caller.getRole() != Role.ADMIN) {
            throw new RuntimeException("Access denied: Pharmacy or Admin authority required.");
        }
        return ResponseEntity.ok(pharmacyService.getAllOrders());
    }
}
