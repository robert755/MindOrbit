import { useMemo, useState } from "react";
import axios from "axios";

const moods = [
  {
    name: "Happy",
    color: "#F4D06F",
    glow: "0 0 60px rgba(244, 208, 111, 0.45)",
    description: "Light, warm and open.",
  },
  {
    name: "Stressed",
    color: "#B9855B",
    glow: "0 0 60px rgba(185, 133, 91, 0.35)",
    description: "Tense, pressured and unsettled.",
  },
  {
    name: "Neutral",
    color: "#C9A86A",
    glow: "0 0 60px rgba(201, 168, 106, 0.35)",
    description: "Balanced, steady and present.",
  },
  {
    name: "Sad",
    color: "#4D6A87",
    glow: "0 0 60px rgba(77, 106, 135, 0.35)",
    description: "Heavy, quiet and low.",
  },
  {
    name: "Anxious",
    color: "#7D93A6",
    glow: "0 0 60px rgba(125, 147, 166, 0.35)",
    description: "Restless, uncertain and overwhelmed.",
  },
];

export default function DailyCheckInPage() {
  const [moodIndex, setMoodIndex] = useState(0);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [activity, setActivity] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

      <div className="flex justify-center items-start gap-12 w-full max-w-[1100px] px-6">
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