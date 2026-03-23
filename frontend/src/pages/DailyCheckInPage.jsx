import { useMemo, useState, useRef, useCallback } from "react";
import axios from "axios";

const moods = [
  {
    name: "Excited",
    color: "#FFD166",
    glow: "0 0 60px rgba(255, 209, 102, 0.45)",
    description: "Energetic, inspired and full of momentum.",
  },
  {
    name: "Happy",
    color: "#F4D06F",
    glow: "0 0 60px rgba(244, 208, 111, 0.45)",
    description: "Light, warm and open.",
  },
  {
    name: "Grateful",
    color: "#E7C76B",
    glow: "0 0 60px rgba(231, 199, 107, 0.40)",
    description: "Appreciative, fulfilled and grounded.",
  },
  {
    name: "Calm",
    color: "#A8C3B8",
    glow: "0 0 60px rgba(168, 195, 184, 0.35)",
    description: "Peaceful, steady and at ease.",
  },
  {
    name: "Neutral",
    color: "#bab3a6",
    glow: "0 0 60px rgba(194, 185, 170, 0.35)",
    description: "Balanced, steady and present.",
  },
  {
    name: "Tired",
    color: "#94A3A8",
    glow: "0 0 60px rgba(148, 163, 168, 0.30)",
    description: "Low energy, slow and drained.",
  },
  {
    name: "Stressed",
    color: "#8a7767",
    glow: "0 0 60px rgba(185, 133, 91, 0.35)",
    description: "Tense, pressured and unsettled.",
  },
  {
    name: "Overwhelmed",
    color: "#7E6A8A",
    glow: "0 0 60px rgba(126, 106, 138, 0.35)",
    description: "Heavy, overloaded and emotionally crowded.",
  },
  {
    name: "Anxious",
    color: "#6F88A3",
    glow: "0 0 60px rgba(111, 136, 163, 0.35)",
    description: "Restless, uncertain and uneasy.",
  },
  {
    name: "Sad",
    color: "#4D6A87",
    glow: "0 0 60px rgba(77, 106, 135, 0.35)",
    description: "Heavy, quiet and low.",
  },
];

const moodColorMap = Object.fromEntries(moods.map((m) => [m.name, m]));

export default function DailyCheckInPage() {
  const [moodIndex, setMoodIndex] = useState(0);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [activity, setActivity] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceResult, setVoiceResult] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  // Voice submit runs from MediaRecorder.onstop, which was registered in the first startRecording
  // closure. Without refs, date/activity would stay stuck at initial "" (stale closure).
  const dateRef = useRef(date);
  const activityRef = useRef(activity);
  dateRef.current = date;
  activityRef.current = activity;

  const currentMood = moods[moodIndex];

  const energyDots = useMemo(() => {
    const total = 10;
    const radius = 125;
    const center = 150;

    return Array.from({ length: total }, (_, index) => {
      const angle = (-90 + index * 36) * (Math.PI / 180);
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);

      return {
        id: index + 1,
        x,
        y,
        active: index < energyLevel,
      };
    });
  }, [energyLevel]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timerRef.current);

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await submitVoiceCheckIn(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setVoiceResult(null);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch {
      setMessage("Microphone access denied. Please allow microphone permissions.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const submitVoiceCheckIn = async (audioBlob) => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setMessage("User ID not found. Please log in again.");
      return;
    }

    setVoiceLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("date", dateRef.current);
      formData.append("activity", (activityRef.current ?? "").trim());

      // Do NOT set Content-Type manually — axios must add multipart boundary.
      // Manual "multipart/form-data" without boundary breaks parsing; activity/date were dropped.
      const response = await axios.post(
        `http://localhost:8081/checkins/user/${userId}/voice`,
        formData
      );

      const checkIn = response.data;
      setVoiceResult(checkIn);

      const detectedIdx = moods.findIndex((m) => m.name === checkIn.mood);
      if (detectedIdx >= 0) setMoodIndex(detectedIdx);
      if (checkIn.energyLevel) setEnergyLevel(checkIn.energyLevel);

      setMessage("Voice check-in saved! Your real mood has been detected.");
    } catch (error) {
      console.error("Voice check-in error:", error);
      if (error.response?.data?.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage("Could not analyze voice. Please try again.");
      }
    } finally {
      setVoiceLoading(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const handlePrevMood = () => {
    setMoodIndex((prev) => (prev === 0 ? moods.length - 1 : prev - 1));
  };

  const handleNextMood = () => {
    setMoodIndex((prev) => (prev === moods.length - 1 ? 0 : prev + 1));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage("");

    const userId = localStorage.getItem("userId");

    if (!userId) {
      setMessage("User ID not found. Please log in again.");
      return;
    }

    if (!activity.trim()) {
      setMessage("Please complete the activity field.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        mood: currentMood.name,
        energyLevel,
        date,
        activity,
        notes,
      };

      await axios.post(
        `http://localhost:8081/checkins/user/${userId}`,
        payload
      );

      setMessage("Check-in saved successfully.");
      setActivity("");
      setNotes("");
      setEnergyLevel(5);
      setMoodIndex(0);
      setDate(new Date().toISOString().split("T")[0]);
    } catch (error) {
      console.error("Save check-in error:", error);

      if (error.response?.data?.message) {
        setMessage(error.response.data.message);
      } else if (typeof error.response?.data === "string") {
        setMessage(error.response.data);
      } else {
        setMessage("Could not save check-in.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f3ee] flex flex-col items-center">
      <div className="text-center max-w-3xl mt-16 mb-14 px-6">
        <p className="uppercase tracking-[0.25em] text-sm text-[#7c857d] mb-4">
          Daily Check-In
        </p>

        <h1 className="text-4xl md:text-5xl font-semibold text-[#2f3b33] leading-tight">
          Choose the orbit that feels closest to you today.
        </h1>

        <p className="mt-6 text-lg text-[#667067] leading-8">
          Move through your moods, choose your energy level, and leave a short
          reflection about your day.
        </p>
      </div>

      {/* Voice Check-In Section */}
      <div className="w-full max-w-[700px] px-6 mb-10">
        <div className="bg-white/70 backdrop-blur rounded-[34px] p-8 shadow-lg">
          <div className="text-center mb-6">
            <p className="uppercase text-sm tracking-[0.2em] text-[#7b857d]">
              Voice Check-In
            </p>

            <h2 className="text-2xl font-semibold mt-2 text-[#2f3b33]">
              Tell us how your day was
            </h2>

            <p className="text-[#6b746d] mt-2 text-sm">
              Speak freely — we analyze your voice tone to detect your real mood,
              so you don't have to pretend you're okay.
            </p>
          </div>

          <div className="flex flex-col items-center gap-5">
            <div className="flex items-center gap-4">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border px-4 py-2 text-sm"
              />
              <input
                type="text"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder="What were you doing today?"
                className="rounded-xl border px-4 py-2 text-sm w-64"
              />
            </div>

            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={voiceLoading}
              className={`
                w-24 h-24 rounded-full flex items-center justify-center
                transition-all duration-300 shadow-lg
                ${isRecording
                  ? "bg-red-500 shadow-red-300/50 scale-110 animate-pulse"
                  : "bg-[#2f3b33] shadow-[#2f3b33]/30 hover:scale-105"
                }
                ${voiceLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {voiceLoading ? (
                <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  {isRecording ? (
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  ) : (
                    <path d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4zm7 11a7 7 0 0 1-14 0H3a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12h-2z" />
                  )}
                </svg>
              )}
            </button>

            <p className="text-sm text-[#6b746d]">
              {voiceLoading
                ? "Analyzing your voice..."
                : isRecording
                  ? `Recording... ${formatTime(recordingTime)} — tap to stop`
                  : "Tap the microphone and describe your day"
              }
            </p>
          </div>

          {voiceResult && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-center gap-3">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{
                    background: moodColorMap[voiceResult.mood]
                      ? `radial-gradient(circle at 30% 30%, #fff 0%, ${moodColorMap[voiceResult.mood].color} 70%)`
                      : "#bab3a6",
                    boxShadow: moodColorMap[voiceResult.mood]?.glow || "none",
                  }}
                />
                <div>
                  <p className="text-xl font-semibold text-[#2f3b33]">
                    {voiceResult.mood}
                  </p>
                  <p className="text-xs text-[#7b857d]">
                    Detected mood — {Math.round((voiceResult.moodConfidence || 0) * 100)}% confidence
                    — Energy {voiceResult.energyLevel}/10
                  </p>
                </div>
              </div>

              {voiceResult.voiceTranscription && (
                <div className="bg-[#f0ebe4] rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wider text-[#7b857d] mb-1">
                    What you said
                  </p>
                  <p className="text-sm text-[#2f3b33] italic">
                    "{voiceResult.voiceTranscription}"
                  </p>
                </div>
              )}

              {voiceResult.voiceAnalysis && (
                <div className="bg-[#e8ede9] rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wider text-[#7b857d] mb-1">
                    Voice Tone Analysis
                  </p>
                  <p className="text-sm text-[#2f3b33]">
                    {voiceResult.voiceAnalysis}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="h-px w-16 bg-[#c5c0b8]" />
          <p className="uppercase text-xs tracking-[0.25em] text-[#9a958d]">
            or check in manually
          </p>
          <div className="h-px w-16 bg-[#c5c0b8]" />
        </div>
      </div>

      <div className="flex justify-center items-start gap-12 w-full max-w-[1100px] px-6 pb-16">
        <div className="w-[480px] bg-white/60 backdrop-blur rounded-[34px] p-8 shadow-lg">
          <div className="text-center mb-6">
            <p className="uppercase text-sm tracking-[0.2em] text-[#7b857d]">
              Mood Orbit
            </p>

            <h2 className="text-3xl font-semibold mt-2">
              {currentMood.name}
            </h2>

            <p className="text-[#6b746d] mt-2">
              {currentMood.description}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={handlePrevMood}
              className="w-12 h-12 rounded-full border bg-white/70"
            >
              ‹
            </button>

            <div className="relative w-[300px] h-[300px]">
              <svg viewBox="0 0 300 300" className="absolute w-full h-full">
                {energyDots.map((dot) => (
                  <circle
                    key={dot.id}
                    cx={dot.x}
                    cy={dot.y}
                    r={dot.active ? 10 : 8}
                    onClick={() => setEnergyLevel(dot.id)}
                    fill={dot.active ? currentMood.color : "#d7ddd7"}
                    className="cursor-pointer"
                  />
                ))}
              </svg>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="w-[180px] h-[180px] rounded-full flex flex-col items-center justify-center"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, #fff 0%, ${currentMood.color} 70%)`,
                    boxShadow: currentMood.glow,
                  }}
                >
                  <p className="uppercase text-sm tracking-[0.15em] text-[#2f3b33]">
                    Mood
                  </p>

                  <h3 className="text-3xl font-semibold mt-1">
                    {currentMood.name}
                  </h3>

                  <p className="text-sm mt-1">
                    Energy {energyLevel}/10
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextMood}
              className="w-12 h-12 rounded-full border bg-white/70"
            >
              ›
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSave}
          className="w-[480px] bg-white/70 backdrop-blur rounded-[34px] p-8 shadow-lg"
        >
          <div className="text-center mb-8">
            <p className="uppercase tracking-[0.2em] text-sm text-[#7b857d]">
              Reflection Details
            </p>

            <h2 className="text-3xl font-semibold mt-2">
              Complete your entry
            </h2>
          </div>

          <div className="space-y-6">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              type="text"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="What were you doing today?"
              className="w-full rounded-xl border px-4 py-3"
            />

            <textarea
              rows={6}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write a few words about your day..."
              className="w-full rounded-xl border px-4 py-3"
            />

            {message && (
              <p className="text-sm text-[#556157]">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2f3b33] text-white py-3 rounded-xl disabled:opacity-70"
            >
              {loading ? "Saving..." : "SAVE CHECK-IN"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}