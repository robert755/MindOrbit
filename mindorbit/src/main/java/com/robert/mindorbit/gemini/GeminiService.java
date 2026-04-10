package com.robert.mindorbit.gemini;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClientException;
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
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "Gemini API key is missing. Set GEMINI_API_KEY or gemini.api.key in application.properties.");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        Map<String, Object> body;
        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    Map.class
            );
            body = response.getBody();
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            throw new IllegalStateException("Gemini API HTTP error: " + e.getStatusCode() + " — " + e.getResponseBodyAsString(), e);
        } catch (RestClientException e) {
            throw new IllegalStateException("Gemini API request failed: " + e.getMessage(), e);
        }

        if (body == null) {
            throw new IllegalStateException("Gemini API returned an empty response body.");
        }

        if (body.containsKey("error")) {
            Object err = body.get("error");
            throw new IllegalStateException("Gemini API error: " + err);
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            Object promptFeedback = body.get("promptFeedback");
            throw new IllegalStateException(
                    "Gemini returned no candidates (audio may be blocked or unsupported). promptFeedback=" + promptFeedback);
        }

        Map<String, Object> firstCandidate = candidates.get(0);
        if (firstCandidate == null) {
            throw new IllegalStateException("Gemini candidate list contained a null entry.");
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> content = (Map<String, Object>) firstCandidate.get("content");
        if (content == null) {
            throw new IllegalStateException("Gemini candidate has no content: " + firstCandidate);
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
        if (parts == null || parts.isEmpty()) {
            throw new IllegalStateException("Gemini content has no parts.");
        }

        Map<String, Object> firstPart = parts.get(0);
        if (firstPart == null || !firstPart.containsKey("text")) {
            throw new IllegalStateException("Gemini response part has no text: " + firstPart);
        }

        Object text = firstPart.get("text");
        if (text == null) {
            throw new IllegalStateException("Gemini returned null text.");
        }
        return text.toString();
    }
}