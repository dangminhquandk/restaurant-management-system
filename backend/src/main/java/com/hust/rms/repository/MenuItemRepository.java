package com.hust.rms.repository;

import com.hust.rms.domain.entity.MenuItem;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    @Query("""
            SELECT m FROM MenuItem m
            JOIN FETCH m.category c
            WHERE m.deletedAt IS NULL
              AND (:categoryId IS NULL OR c.id = :categoryId)
              AND (:availableOnly = FALSE OR m.isAvailable = TRUE)
            ORDER BY c.displayOrder ASC, m.name ASC, m.id ASC
            """)
    List<MenuItem> findActiveItems(
            @Param("categoryId") Long categoryId,
            @Param("availableOnly") boolean availableOnly
    );

    @Query("SELECT m FROM MenuItem m JOIN FETCH m.category WHERE m.id = :id AND m.deletedAt IS NULL")
    Optional<MenuItem> findActiveByIdWithCategory(@Param("id") Long id);

    Optional<MenuItem> findByNameAndDeletedAtIsNull(String name);

    boolean existsByCategoryId(Long categoryId);
}
