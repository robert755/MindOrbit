package com.robert.mindorbit.checkin;

public class VoiceMoodResult {

    private Mood detectedMood;
    private String transcription;
    private String voiceAnalysis;
    private double confidence;
    private int estimatedEnergyLevel;

    public VoiceMoodResult() {}

    public VoiceMoodResult(Mood detectedMood, String transcription, String voiceAnalysis,
                           double confidence, int estimatedEnergyLevel) {
        this.detectedMood = detectedMood;
        this.transcription = transcription;
        this.voiceAnalysis = voiceAnalysis;
        this.confidence = confidence;
        this.estimatedEnergyLevel = estimatedEnergyLevel;
    }

    public Mood getDetectedMood() {
        return detectedMood;
    }

    public void setDetectedMood(Mood detectedMood) {
        this.detectedMood = detectedMood;
    }

    public String getTranscription() {
        return transcription;
    }

    public void setTranscription(String transcription) {
        this.transcription = transcription;
    }

    public String getVoiceAnalysis() {
        return voiceAnalysis;
    }

    public void setVoiceAnalysis(String voiceAnalysis) {
        this.voiceAnalysis = voiceAnalysis;
    }

    public double getConfidence() {
        return confidence;
    }

    public void setConfidence(double confidence) {
        this.confidence = confidence;
    }

    public int getEstimatedEnergyLevel() {
        return estimatedEnergyLevel;
    }

    public void setEstimatedEnergyLevel(int estimatedEnergyLevel) {
        this.estimatedEnergyLevel = estimatedEnergyLevel;
    }
}
