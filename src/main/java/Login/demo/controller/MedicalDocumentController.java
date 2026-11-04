package Login.demo.controller;

import Login.demo.entity.MedicalDocument;
import Login.demo.service.MedicalDocumentService;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/docs")
public class MedicalDocumentController {

    private final MedicalDocumentService docService;

    public MedicalDocumentController(MedicalDocumentService docService) {
        this.docService = docService;
    }

    /**
     * Patient uploads a medical document.
     * Optional appointmentId links it to a specific appointment.
     */
    @PostMapping("/upload")
    public ResponseEntity<?> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "appointmentId", required = false) Integer appointmentId,
            Authentication auth) {
        try {
            MedicalDocument doc = docService.uploadDocument(auth.getName(), appointmentId, file);
            return ResponseEntity.ok(Map.of(
                    "id", doc.getId(),
                    "originalName", doc.getOriginalName(),
                    "mimeType", doc.getMimeType() != null ? doc.getMimeType() : "",
                    "fileSize", doc.getFileSize(),
                    "uploadedAt", doc.getUploadedAt().toString()
            ));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", "File save failed: " + e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Patient lists their own documents */
    @GetMapping("/my")
    public ResponseEntity<List<MedicalDocument>> getMyDocuments(Authentication auth) {
        return ResponseEntity.ok(docService.getPatientDocuments(auth.getName()));
    }

    /**
     * Doctor lists documents for an active session.
     * Returns 403 if session has ended.
     */
    @GetMapping("/session/{roomId}")
    public ResponseEntity<?> getSessionDocuments(
            @PathVariable String roomId,
            Authentication auth) {
        try {
            List<MedicalDocument> docs = docService.getSessionDocuments(roomId, auth.getName());
            return ResponseEntity.ok(docs);
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    /** Patient soft-deletes their document */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteDocument(
            @PathVariable Long id,
            Authentication auth) {
        try {
            docService.deleteDocument(id, auth.getName());
            return ResponseEntity.ok(Map.of("deleted", true, "id", id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Serve file bytes — access-controlled.
     * Patient: always accessible (their own docs).
     * Doctor: only during active session.
     */
    @GetMapping("/file/{id}")
    public ResponseEntity<Resource> serveFile(
            @PathVariable Long id,
            Authentication auth) {
        try {
            Resource resource = docService.serveFile(id, auth.getName());
            MedicalDocument meta = docService.getDocumentMeta(id);

            String contentType = meta.getMimeType() != null ? meta.getMimeType() : "application/octet-stream";
            String disposition = "inline; filename=\"" + meta.getOriginalName().replace("\"", "") + "\"";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                    .body(resource);
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).build();
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}
