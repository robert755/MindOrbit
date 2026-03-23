package com.robert.mindorbit.checkin;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/checkins")
public class CheckInController {

    @Autowired
    private CheckInService checkInService;

    @PostMapping("/user/{userId}")
    @ResponseStatus(HttpStatus.CREATED)
    public CheckIn createCheckIn(@RequestBody CheckIn checkIn, @PathVariable Integer userId) {
        return checkInService.createCheckIn(checkIn, userId);
    }

    @PostMapping("/user/{userId}/voice")
    @ResponseStatus(HttpStatus.CREATED)
    public CheckIn createVoiceCheckIn(
            @PathVariable Integer userId,
            @RequestParam("audio") MultipartFile audioFile,
            @RequestParam(value = "date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(value = "activity", required = false) String activity
    ) {
        try {
            byte[] audioData = audioFile.getBytes();
            String mimeType = audioFile.getContentType();
            if (mimeType == null || mimeType.isBlank()) {
                mimeType = "audio/webm";
            }
            return checkInService.createVoiceCheckIn(audioData, mimeType, userId, date, activity);
        } catch (Exception e) {
            throw new RuntimeException("Failed to process voice check-in: " + e.getMessage(), e);
        }
    }

    @GetMapping
    public List<CheckIn> getAllCheckIns() {
        return checkInService.getAllCheckIns();
    }

    @GetMapping("/user/{userId}")
    public List<CheckIn> getCheckInsByUser(@PathVariable Integer userId) {
        return checkInService.getCheckInsByUser(userId);
    }

    @GetMapping("/user/{userId}/range")
    public List<CheckIn> getCheckInsByUserAndDateRange(
            @PathVariable Integer userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return checkInService.getCheckInsByUserAndDateRange(userId, startDate, endDate);
    }

    @GetMapping("/{id}")
    public CheckIn getCheckInById(@PathVariable Integer id) {
        return checkInService.getCheckInById(id);
    }

    @PutMapping("/{id}")
    public CheckIn updateCheckIn(@RequestBody CheckIn checkIn, @PathVariable Integer id) {
        return checkInService.updateCheckIn(id, checkIn);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCheckIn(@PathVariable Integer id) {
        checkInService.deleteCheckIn(id);
    }
}