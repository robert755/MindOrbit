package com.robert.mindorbit.checkin;
import com.robert.mindorbit.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface CheckInRepository extends JpaRepository<CheckIn, Integer> {

    List<CheckIn> findByUser(User user);

    List<CheckIn> findByUserAndDateBetween(User user, LocalDate startDate, LocalDate endDate);
}