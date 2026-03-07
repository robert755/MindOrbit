package com.robert.mindorbit.reports;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.robert.mindorbit.checkin.CheckIn;
import com.robert.mindorbit.gemini.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Iterator;
import java.util.List;

@Service
public class AiReportService {

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private ObjectMapper objectMapper;

    public WeeklyReport generateReportFromCheckIns(List<CheckIn> checkIns) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("""
                You are a supportive wellbeing assistant.
                Based only on the weekly check-ins below, generate a valid JSON object with exactly these fields:
                summary,
                patterns,
                suggestions,
                musicSuggestions

                Rules:
                - output valid JSON only
                - do not use markdown
                - do not add any explanation outside JSON
                - patterns must be an array of short strings
                - suggestions must be an array of short strings
                - musicSuggestions must be an array of 3 short strings
                - do not give medical advice
                - keep the tone supportive and practical

                Weekly check-ins:
                """);

        for (CheckIn checkIn : checkIns) {
            prompt.append("- Date: ").append(checkIn.getDate()).append("\n");
            prompt.append("  Mood: ").append(checkIn.getMood()).append("\n");
            prompt.append("  EnergyLevel: ").append(checkIn.getEnergyLevel()).append("\n");
            prompt.append("  Activity: ").append(checkIn.getActivity()).append("\n");
            prompt.append("  Notes: ").append(checkIn.getNotes()).append("\n\n");
        }

        try {
            String aiResponse = geminiService.generateText(prompt.toString());

            JsonNode root = objectMapper.readTree(aiResponse);

            WeeklyReport report = new WeeklyReport();
            report.setSummary(root.get("summary").asText());
            report.setPatterns(joinArray(root.get("patterns")));
            report.setSuggestions(joinArray(root.get("suggestions")));
            report.setMusicSuggestions(joinArray(root.get("musicSuggestions")));

            return report;

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate AI report: " + e.getMessage(), e);
        }
    }

    private String joinArray(JsonNode arrayNode) {
        StringBuilder sb = new StringBuilder();
        Iterator<JsonNode> iterator = arrayNode.iterator();

        while (iterator.hasNext()) {
            sb.append(iterator.next().asText());
            if (iterator.hasNext()) {
                sb.append(" | ");
            }
        }

        return sb.toString();
    }
}