package com.robert.mindorbit.checkin;
import com.robert.mindorbit.user.User;
import com.robert.mindorbit.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class CheckInService {

    @Autowired
    private CheckInRepository checkInRepository;

    @Autowired
    private UserRepository userRepository;

    public CheckIn createCheckIn(CheckIn checkIn, Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        checkIn.setUser(user);
        return checkInRepository.save(checkIn);
    }

    public List<CheckIn> getAllCheckIns() {
        return checkInRepository.findAll();
    }

    public List<CheckIn> getCheckInsByUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return checkInRepository.findByUser(user);
    }

    public List<CheckIn> getCheckInsByUserAndDateRange(Integer userId, LocalDate startDate, LocalDate endDate) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return checkInRepository.findByUserAndDateBetween(user, startDate, endDate);
    }

    public CheckIn getCheckInById(Integer id) {
        return checkInRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Check-in not found"));
    }

    public CheckIn updateCheckIn(Integer id, CheckIn updatedCheckIn) {
        CheckIn existingCheckIn = checkInRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Check-in not found"));

        existingCheckIn.setMood(updatedCheckIn.getMood());
        existingCheckIn.setEnergyLevel(updatedCheckIn.getEnergyLevel());
        existingCheckIn.setActivity(updatedCheckIn.getActivity());
        existingCheckIn.setNotes(updatedCheckIn.getNotes());
        existingCheckIn.setDate(updatedCheckIn.getDate());

        return checkInRepository.save(existingCheckIn);
    }

    public void deleteCheckIn(Integer id) {
        CheckIn existingCheckIn = checkInRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Check-in not found"));

        checkInRepository.delete(existingCheckIn);
    }
}