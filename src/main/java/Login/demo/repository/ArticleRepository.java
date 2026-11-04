package Login.demo.repository;

import Login.demo.entity.Article;
import Login.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ArticleRepository extends JpaRepository<Article, Integer> {
    List<Article> findByPublishedTrueOrderByPublishedAtDesc();
    List<Article> findByPublishedTrueAndCategoryOrderByPublishedAtDesc(String category);
    List<Article> findByDoctorOrderByPublishedAtDesc(User doctor);
}
