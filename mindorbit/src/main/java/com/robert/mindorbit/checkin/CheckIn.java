package com.robert.mindorbit.checkin;
import com.robert.mindorbit.user.User;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
public class CheckIn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    private Mood mood;

    private Integer energyLevel;

    private String activity;

    private String notes;

    private LocalDate date;

    private LocalDateTime createdAt;

    @Column(columnDefinition = "TEXT")
    private String voiceTranscription;

    @Column(columnDefinition = "TEXT")
    private String voiceAnalysis;

    private String moodSource;

    private Double moodConfidence;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    public CheckIn() {}

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Mood getMood() {
        return mood;
    }

    public void setMood(Mood mood) {
        this.mood = mood;
    }

    public Integer getEnergyLevel() {
        return energyLevel;
    }

    public void setEnergyLevel(Integer energyLevel) {
        this.energyLevel = energyLevel;
    }

    public String getActivity() {
        return activity;
    }

    public void setActivity(String activity) {
        this.activity = activity;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getVoiceTranscription() {
        return voiceTranscription;
    }

    public void setVoiceTranscription(String voiceTranscription) {
        this.voiceTranscription = voiceTranscription;
    }

    public String getVoiceAnalysis() {
        return voiceAnalysis;
    }

    public void setVoiceAnalysis(String voiceAnalysis) {
        this.voiceAnalysis = voiceAnalysis;
    }

    public String getMoodSource() {
        return moodSource;
    }

    public void setMoodSource(String moodSource) {
        this.moodSource = moodSource;
    }

    public Double getMoodConfidence() {
        return moodConfidence;
    }

    public void setMoodConfidence(Double moodConfidence) {
        this.moodConfidence = moodConfidence;
    }
}