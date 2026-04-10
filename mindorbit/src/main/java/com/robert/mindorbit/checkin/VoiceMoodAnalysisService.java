package com.robert.mindorbit.checkin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.robert.mindorbit.gemini.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class VoiceMoodAnalysisService {

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String VOICE_ANALYSIS_PROMPT = """
            You are an expert emotional tone analyzer. You will receive an audio recording of a person
            describing how their day went.

            Your task is to analyze BOTH:
            1. The CONTENT of what they say (words, phrases, topics)
            2. The VOCAL TONE (pitch, speech pace, energy level, voice trembling, sighs, hesitations,
               vocal warmth, monotone vs expressive, breath patterns)

            IMPORTANT: People often say "I'm fine" or "it was okay" while their voice reveals
            sadness, stress, or exhaustion. Trust the vocal indicators MORE than the literal words
            when they contradict each other. This is the core purpose — detecting the REAL mood
            that the person might not admit verbally.

            Respond with a valid JSON object with exactly these fields:
            - detectedMood: one of [Happy, Stressed, Neutral, Sad, Anxious, Calm, Excited, Tired, Grateful, Overwhelmed]
            - transcription: what the person said (transcribed text)
            - voiceAnalysis: a brief explanation of the vocal indicators you detected and why they
              point to the chosen mood (2-3 sentences, supportive tone)
            - confidence: a number between 0.0 and 1.0 indicating how confident you are
            - estimatedEnergyLevel: a number from 1 to 10 based on vocal energy

            Rules:
            - Output valid JSON only
            - Do not use markdown formatting
            - Do not add any explanation outside the JSON
            - The transcription should be in the same language the person spoke
            - The voiceAnalysis should be in English
            - Be supportive and non-judgmental in the analysis
            - If the voice sounds forced-happy or masking emotions, note that in the analysis
            """;

    public VoiceMoodResult analyzeVoice(byte[] audioData, String mimeType) {
        try {
            String aiResponse = geminiService.analyzeAudio(VOICE_ANALYSIS_PROMPT, audioData, mimeType);

            String cleaned = aiResponse.strip();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.replaceFirst("```(?:json)?\\s*", "");
                cleaned = cleaned.replaceFirst("\\s*```$", "");
            }

            JsonNode root = objectMapper.readTree(cleaned);

            VoiceMoodResult result = new VoiceMoodResult();
            result.setDetectedMood(parseMood(root.get("detectedMood")));
            result.setTranscription(requireText(root, "transcription"));
            result.setVoiceAnalysis(requireText(root, "voiceAnalysis"));
            result.setConfidence(root.path("confidence").asDouble(0.5));
            JsonNode energyNode = root.get("estimatedEnergyLevel");
            int energy = energyNode == null || energyNode.isNull()
                    ? 5
                    : (int) Math.round(energyNode.asDouble());
            energy = Math.max(1, Math.min(10, energy));
            result.setEstimatedEnergyLevel(energy);

            return result;

        } catch (Exception e) {
            throw new RuntimeException("Failed to analyze voice mood: " + e.getMessage(), e);
        }
    }

    private static String requireText(JsonNode root, String field) {
        JsonNode n = root.get(field);
        if (n == null || n.isNull() || n.asText().isBlank()) {
            return "";
        }
        return n.asText();
    }

    /** Gemini often returns mood names with different casing; {@link Mood#valueOf} is strict. */
    private static Mood parseMood(JsonNode node) {
        if (node == null || node.isNull()) {
            throw new IllegalArgumentException("detectedMood is missing");
        }
        String raw = node.asText().trim();
        if (raw.isEmpty()) {
            throw new IllegalArgumentException("detectedMood is empty");
        }
        for (Mood m : Mood.values()) {
            if (m.name().equalsIgnoreCase(raw)) {
                return m;
            }
        }
        String normalized = raw.substring(0, 1).toUpperCase(Locale.ROOT) + raw.substring(1).toLowerCase(Locale.ROOT);
        try {
            return Mood.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid detectedMood: " + raw);
        }
    }
}
