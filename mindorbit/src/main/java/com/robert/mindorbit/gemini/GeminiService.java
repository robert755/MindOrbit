package com.robert.mindorbit.gemini;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    @Value("${gemini.model}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();

    public String generateText(String prompt) {

        String url = apiUrl + "/" + model + ":generateContent";

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of(
                                "parts", List.of(
                                        Map.of("text", prompt)
                                )
                        )
                )
        );

        return callGeminiApi(url, requestBody);
    }

    /**
     * Sends audio data along with a text prompt to Gemini for multimodal analysis.
     * Gemini will analyze both the speech content and the vocal tone/emotion.
     */
    public String analyzeAudio(String prompt, byte[] audioData, String mimeType) {

        String url = apiUrl + "/" + model + ":generateContent";

        String base64Audio = Base64.getEncoder().encodeToString(audioData);

        Map<String, Object> inlineData = new LinkedHashMap<>();
        inlineData.put("mime_type", mimeType);
        inlineData.put("data", base64Audio);

        Map<String, Object> audioPart = Map.of("inline_data", inlineData);
        Map<String, Object> textPart = Map.of("text", prompt);

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(audioPart, textPart))
                )
        );

        return callGeminiApi(url, requestBody);
    }

    private String callGeminiApi(String url, Map<String, Object> requestBody) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                Map.class
        );

        Map body = response.getBody();
        List candidates = (List) body.get("candidates");
        Map firstCandidate = (Map) candidates.get(0);
        Map content = (Map) firstCandidate.get("content");
        List parts = (List) content.get("parts");
        Map firstPart = (Map) parts.get(0);

        return (String) firstPart.get("text");
    }
}