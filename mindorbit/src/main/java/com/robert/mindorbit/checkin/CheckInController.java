package com.robert.mindorbit.checkin;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.util.Set;
import java.util.List;

@RestController
@RequestMapping("/checkins")
public class CheckInController {
    private static final Set<String> SUPPORTED_AUDIO_TYPES = Set.of(
            "audio/webm",
            "audio/mp4",
            "audio/mpeg",
            "audio/wav",
            "audio/x-wav",
            "audio/m4a",
            "audio/aac"
    );

    /**
     * React Native multipart uploads often send {@code application/octet-stream} even for .m4a;
     * Spring then rejects the part. Map by filename / common mobile types before validation.
     */
    private static String resolveAudioMimeType(String contentType, String originalFilename) {
        String raw = contentType == null ? "" : contentType.trim();
        String lower = raw.toLowerCase();
        if ("audio/x-m4a".equals(lower)) {
            return "audio/mp4";
        }
        if (!lower.isEmpty() && SUPPORTED_AUDIO_TYPES.contains(lower)) {
            return lower;
        }
        String name = originalFilename == null ? "" : originalFilename.toLowerCase();
        if (lower.equals("application/octet-stream")
                || lower.equals("binary/octet-stream")
                || lower.isEmpty()) {
            if (name.endsWith(".m4a") || name.endsWith(".mp4") || name.endsWith(".caf")) {
                return "audio/mp4";
            }
            if (name.endsWith(".webm")) {
                return "audio/webm";
            }
            if (name.endsWith(".wav")) {
                return "audio/wav";
            }
            if (name.endsWith(".aac")) {
                return "audio/aac";
            }
            if (name.endsWith(".mp3")) {
                return "audio/mpeg";
            }
            if (lower.isEmpty()) {
                return "audio/webm";
            }
            return "audio/mp4";
        }
        return lower;
    }

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
            if (audioFile == null || audioFile.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Audio file is required.");
            }

            byte[] audioData = audioFile.getBytes();
            String mimeType = resolveAudioMimeType(audioFile.getContentType(), audioFile.getOriginalFilename());

            if (!SUPPORTED_AUDIO_TYPES.contains(mimeType)) {
                throw new ResponseStatusException(
                        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                        "Unsupported audio format. Use webm/mp4/mpeg/wav/m4a/aac."
                );
            }

            return checkInService.createVoiceCheckIn(audioData, mimeType, userId, date, activity);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            Throwable cause = e.getCause() != null ? e.getCause() : e;
            String detail = cause.getMessage();
            if (detail == null || detail.isBlank()) {
                detail = e.getMessage();
            }
            if (detail != null && detail.length() > 600) {
                detail = detail.substring(0, 600) + "…";
            }
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    detail != null && !detail.isBlank()
                            ? detail
                            : "Failed to process voice check-in.",
                    e
            );
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