package Login.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "articles")
public class Article {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "doctor_id", nullable = false)
    @JsonIgnoreProperties({"password"})
    private User doctor;

    @Column(nullable = false, length = 300)
    private String title;

    /**
     * e.g. GENERAL_HEALTH, NUTRITION, MENTAL_HEALTH,
     *      CARDIOLOGY, DIABETES, FITNESS, COVID, OTHER
     */
    @Column(nullable = false, length = 60)
    private String category;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /** Base64 encoded cover image (optional) */
    @Column(name = "cover_image_base64", columnDefinition = "MEDIUMTEXT")
    private String coverImageBase64;

    @Column(name = "published_at", nullable = false)
    private LocalDateTime publishedAt;

    @Column(name = "is_published", nullable = false)
    private boolean published = true;

    @Column(name = "likes_count")
    private Integer likesCount = 0;

    public Article() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public User getDoctor() { return doctor; }
    public void setDoctor(User doctor) { this.doctor = doctor; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getCoverImageBase64() { return coverImageBase64; }
    public void setCoverImageBase64(String coverImageBase64) { this.coverImageBase64 = coverImageBase64; }

    public LocalDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }

    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }

    public Integer getLikesCount() { return likesCount; }
    public void setLikesCount(Integer likesCount) { this.likesCount = likesCount; }
}
