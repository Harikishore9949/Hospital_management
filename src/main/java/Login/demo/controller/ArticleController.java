package Login.demo.controller;

import Login.demo.dto.ArticleRequest;
import Login.demo.entity.Article;
import Login.demo.entity.Role;
import Login.demo.entity.User;
import Login.demo.repository.ArticleRepository;
import Login.demo.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/articles")
public class ArticleController {

    private final ArticleRepository articleRepository;
    private final UserRepository userRepository;

    public ArticleController(ArticleRepository articleRepository,
                              UserRepository userRepository) {
        this.articleRepository = articleRepository;
        this.userRepository = userRepository;
    }

    // ── Doctor publishes article ──────────────────────────────────────────

    @PostMapping
    public Article createArticle(
            @RequestBody ArticleRequest request,
            Authentication authentication) {

        User doctor = findUser(authentication.getName());
        if (doctor.getRole() != Role.DOCTOR) {
            throw new RuntimeException("Only doctors can publish articles.");
        }

        Article article = new Article();
        article.setDoctor(doctor);
        article.setTitle(request.getTitle() != null ? request.getTitle().trim() : "");
        article.setCategory(request.getCategory() != null ? request.getCategory() : "GENERAL_HEALTH");
        article.setContent(request.getContent() != null ? request.getContent().trim() : "");
        article.setCoverImageBase64(request.getCoverImageBase64());
        article.setPublishedAt(LocalDateTime.now());
        article.setPublished(true);
        article.setLikesCount(0);

        return articleRepository.save(article);
    }

    // ── Doctor edits own article ──────────────────────────────────────────

    @PutMapping("/{id}")
    public Article updateArticle(
            @PathVariable Integer id,
            @RequestBody ArticleRequest request,
            Authentication authentication) {

        User doctor = findUser(authentication.getName());
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article not found."));

        if (!article.getDoctor().getUsername().equals(doctor.getUsername())) {
            throw new RuntimeException("You can only edit your own articles.");
        }

        if (request.getTitle() != null)          article.setTitle(request.getTitle().trim());
        if (request.getCategory() != null)       article.setCategory(request.getCategory());
        if (request.getContent() != null)        article.setContent(request.getContent().trim());
        if (request.getCoverImageBase64() != null) article.setCoverImageBase64(request.getCoverImageBase64());

        return articleRepository.save(article);
    }

    // ── Doctor deletes own article ────────────────────────────────────────

    @DeleteMapping("/{id}")
    public void deleteArticle(
            @PathVariable Integer id,
            Authentication authentication) {

        User doctor = findUser(authentication.getName());
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article not found."));

        if (!article.getDoctor().getUsername().equals(doctor.getUsername())) {
            throw new RuntimeException("You can only delete your own articles.");
        }

        articleRepository.delete(article);
    }

    // ── Like an article ───────────────────────────────────────────────────

    @PostMapping("/{id}/like")
    public Article likeArticle(@PathVariable Integer id, Authentication authentication) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article not found."));
        article.setLikesCount((article.getLikesCount() != null ? article.getLikesCount() : 0) + 1);
        return articleRepository.save(article);
    }

    // ── Get all published articles (feed) ────────────────────────────────

    @GetMapping
    public List<Article> getAllArticles(
            @RequestParam(required = false) String category,
            Authentication authentication) {

        if (category != null && !category.isBlank()) {
            return articleRepository.findByPublishedTrueAndCategoryOrderByPublishedAtDesc(category);
        }
        return articleRepository.findByPublishedTrueOrderByPublishedAtDesc();
    }

    // ── Get single article ────────────────────────────────────────────────

    @GetMapping("/{id}")
    public Article getArticle(@PathVariable Integer id, Authentication authentication) {
        return articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article not found."));
    }

    // ── Doctor gets own articles ──────────────────────────────────────────

    @GetMapping("/mine")
    public List<Article> getMyArticles(Authentication authentication) {
        User doctor = findUser(authentication.getName());
        return articleRepository.findByDoctorOrderByPublishedAtDesc(doctor);
    }

    // ── Helper ────────────────────────────────────────────────────────────

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }
}
