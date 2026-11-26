package com.hust.rms.repository;

import com.hust.rms.domain.entity.User;
import com.hust.rms.domain.enums.Role;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByUsernameIgnoreCaseAndIdNot(String username, Long id);

    long countByRoleAndIsActiveTrue(Role role);

    List<User> findAllByOrderByIdAsc();
}
