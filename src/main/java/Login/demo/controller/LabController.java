package Login.demo.controller;

import Login.demo.entity.LabTestOrder;
import Login.demo.entity.Role;
import Login.demo.entity.User;
import Login.demo.repository.UserRepository;
import Login.demo.service.LabService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lab")
public class LabController {

    private final LabService labService;
    private final UserRepository userRepository;

    public LabController(LabService labService, UserRepository userRepository) {
        this.labService = labService;
        this.userRepository = userRepository;
    }

    private User verifyLabAccess(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("Unauthorized: Authentication required.");
        }
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found: " + auth.getName()));
        if (user.getRole() != Role.LAB && user.getRole() != Role.ADMIN) {
            throw new RuntimeException("Access denied: LAB or ADMIN authority required.");
        }
        return user;
    }

    @GetMapping("/orders")
    public ResponseEntity<List<LabTestOrder>> getOrders(
            @RequestParam(required = false) String status,
            Authentication auth) {
        verifyLabAccess(auth);
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            return ResponseEntity.ok(labService.getOrdersByStatus(status));
        }
        return ResponseEntity.ok(labService.getAllOrders());
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<LabTestOrder> getOrderById(@PathVariable Integer id, Authentication auth) {
        verifyLabAccess(auth);
        return ResponseEntity.ok(labService.getOrderById(id));
    }

    @PostMapping("/orders/{id}/schedule-slot")
    public ResponseEntity<LabTestOrder> scheduleSlot(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        verifyLabAccess(auth);
        java.time.LocalDate date = null;
        if (body != null && body.containsKey("scheduledDate") && !body.get("scheduledDate").isBlank()) {
            date = java.time.LocalDate.parse(body.get("scheduledDate").trim());
        }
        String time = (body != null) ? body.get("scheduledTime") : null;
        String notes = (body != null) ? body.get("slotNotes") : null;
        return ResponseEntity.ok(labService.scheduleSampleSlot(id, date, time, notes));
    }

    @PostMapping("/orders/{id}/collect-sample")
    public ResponseEntity<LabTestOrder> collectSample(
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth) {
        User caller = verifyLabAccess(auth);
        String labCenter = (body != null && body.containsKey("labCenterName")) ? body.get("labCenterName") : caller.getUsername();
        String notes = (body != null) ? body.get("notes") : "";
        String barcode = (body != null) ? body.get("barcode") : null;
        String estimatedResultTime = (body != null) ? body.get("estimatedResultTime") : null;
        return ResponseEntity.ok(labService.collectSample(id, labCenter, notes, barcode, estimatedResultTime));
    }

    @PostMapping("/orders/{id}/start-testing")
    public ResponseEntity<LabTestOrder> startTesting(
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth) {
        User caller = verifyLabAccess(auth);
        String technician = (body != null && body.containsKey("technicianName")) ? body.get("technicianName") : caller.getUsername();
        String equipment = (body != null) ? body.get("equipmentUsed") : null;
        String estimatedResultTime = (body != null) ? body.get("estimatedResultTime") : null;
        return ResponseEntity.ok(labService.startTesting(id, technician, equipment, estimatedResultTime));
    }

    @PostMapping("/orders/{id}/upload-results")
    public ResponseEntity<LabTestOrder> uploadResults(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        verifyLabAccess(auth);
        String resultsJson = body.get("resultsJson");
        String pathologist = body.get("pathologistName");
        String labCenter = body.get("labCenterName");
        String equipment = body.get("equipmentUsed");
        String notes = body.get("notes");
        return ResponseEntity.ok(labService.uploadResults(id, resultsJson, pathologist, labCenter, notes, equipment));
    }

    @PostMapping("/orders/{id}/upload-hardcopy")
    public ResponseEntity<LabTestOrder> uploadHardcopy(
            @PathVariable Integer id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            Authentication auth) throws java.io.IOException {
        verifyLabAccess(auth);
        return ResponseEntity.ok(labService.uploadHardcopy(id, file));
    }

    @GetMapping("/orders/{id}/hardcopy")
    public ResponseEntity<org.springframework.core.io.Resource> downloadHardcopy(
            @PathVariable Integer id,
            Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("Unauthorized: Authentication required.");
        }
        org.springframework.core.io.Resource resource = labService.getHardcopyResource(id);
        LabTestOrder order = labService.getOrderById(id);
        String filename = order.getHardcopyOriginalName() != null ? order.getHardcopyOriginalName() : "lab_report.pdf";
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(resource);
    }

    @PostMapping("/orders/{id}/auto-analyze")
    public ResponseEntity<LabTestOrder> autoAnalyze(
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth) {
        verifyLabAccess(auth);
        String pathologist = (body != null) ? body.get("pathologistName") : null;
        return ResponseEntity.ok(labService.autoGenerateResults(id, pathologist));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(Authentication auth) {
        verifyLabAccess(auth);
        return ResponseEntity.ok(labService.getLabStats());
    }

    @GetMapping("/catalog")
    public ResponseEntity<List<Map<String, Object>>> getCatalog() {
        return ResponseEntity.ok(labService.getLabCatalog());
    }
}
