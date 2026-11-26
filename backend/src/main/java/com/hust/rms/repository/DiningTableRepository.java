package com.hust.rms.repository;

import com.hust.rms.domain.entity.DiningTable;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DiningTableRepository extends JpaRepository<DiningTable, Long> {

    @Query("""
            SELECT t FROM DiningTable t
            JOIN FETCH t.area a
            WHERE (:areaId IS NULL OR a.id = :areaId)
            ORDER BY a.displayOrder ASC, t.name ASC, t.id ASC
            """)
    List<DiningTable> findAllWithArea(@Param("areaId") Long areaId);

    @Query("SELECT t FROM DiningTable t JOIN FETCH t.area WHERE t.id = :id")
    Optional<DiningTable> findByIdWithArea(@Param("id") Long id);

    Optional<DiningTable> findByName(String name);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    boolean existsByAreaId(Long areaId);
}
