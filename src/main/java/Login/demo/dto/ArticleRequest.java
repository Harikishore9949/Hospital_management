package Login.demo.dto;

public class ArticleRequest {
    private String title;
    private String category;
    private String content;
    private String coverImageBase64;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getCoverImageBase64() { return coverImageBase64; }
    public void setCoverImageBase64(String coverImageBase64) { this.coverImageBase64 = coverImageBase64; }
}
