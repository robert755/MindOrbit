package com.robert.mindorbit.reports;
import com.robert.mindorbit.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface WeeklyReportRepository extends JpaRepository<WeeklyReport, Integer> {
    Optional<WeeklyReport> findByUserAndWeekStart(User user, LocalDate weekStart);
}