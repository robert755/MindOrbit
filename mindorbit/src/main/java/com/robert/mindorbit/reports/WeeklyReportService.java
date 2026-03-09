package com.robert.mindorbit.reports;
import com.robert.mindorbit.checkin.CheckIn;
import com.robert.mindorbit.checkin.CheckInRepository;
import com.robert.mindorbit.user.User;
import com.robert.mindorbit.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class WeeklyReportService {

    @Autowired
    private WeeklyReportRepository weeklyReportRepository;

    @Autowired
    private CheckInRepository checkInRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AiReportService aiReportService;

    public WeeklyReport generateWeeklyReport(Integer userId, LocalDate weekStart) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDate endDate = weekStart.plusDays(7);

        List<CheckIn> checkIns = checkInRepository.findByUserAndDateBetween(user, weekStart, endDate);

        if (checkIns.isEmpty()) {
            throw new RuntimeException("No check-ins found for this week");
        }

        WeeklyReport report = aiReportService.generateReportFromCheckIns(checkIns);
        report.setWeekStart(weekStart);
        report.setUser(user);

        return weeklyReportRepository.save(report);
    }

    public WeeklyReport getWeeklyReport(Integer userId, LocalDate weekStart) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return weeklyReportRepository.findByUserAndWeekStart(user, weekStart)
                .orElse(null);
    }
}