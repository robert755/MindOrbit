package com.robert.mindorbit.reports;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
public class WeeklyReportController {

    @Autowired
    private WeeklyReportService weeklyReportService;

    @PostMapping("/weekly")
    @ResponseStatus(HttpStatus.CREATED)
    public WeeklyReport generateWeeklyReport(
            @RequestParam Integer userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart
    ) {
        return weeklyReportService.generateWeeklyReport(userId, weekStart);
    }

    @GetMapping("/weekly")
    public WeeklyReport getWeeklyReport(
            @RequestParam Integer userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart
    ) {
        return weeklyReportService.getWeeklyReport(userId, weekStart);
    }
}