import { useEffect, useMemo, useState } from "react";
import axios from "axios";

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);

  const start = new Date(d);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  return start;
}

function getEndOfWeek(date) {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(0, 0, 0, 0);

  return end;
}

function prettyDate(dateString) {
  const [year, month, day] = dateString.split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const moodColors = {
  Happy: "#F4D06F",
  Stressed: "#B9855B",
  Neutral: "#C9A86A",
  Sad: "#4D6A87",
  Anxious: "#7D93A6",
};

const moods = ["Happy", "Stressed", "Neutral", "Sad", "Anxious"];

export default function ReflectionJournalPage() {
  const [currentWeekDate, setCurrentWeekDate] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editingEntryId, setEditingEntryId] = useState(null);

  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportData, setReportData] = useState(null);
  const [hasWeeklyReport, setHasWeeklyReport] = useState(false);

  const [editForm, setEditForm] = useState({
    mood: "",
    energyLevel: 5,
    activity: "",
    notes: "",
    date: "",
  });

  const userId = localStorage.getItem("userId");

  const startDate = useMemo(() => {
    return formatDate(getStartOfWeek(currentWeekDate));
  }, [currentWeekDate]);

  const endDate = useMemo(() => {
    return formatDate(getEndOfWeek(currentWeekDate));
  }, [currentWeekDate]);

  const weekLabel = useMemo(() => {
    const start = getStartOfWeek(currentWeekDate);
    const end = getEndOfWeek(currentWeekDate);

    return `${start.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
    })} - ${end.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`;
  }, [currentWeekDate]);

  const fetchEntries = async () => {
    if (!userId) {
      setMessage("User not found. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await axios.get(
        `http://localhost:8081/checkins/user/${userId}/range`,
        {
          params: {
            startDate,
            endDate,
          },
        }
      );

      setEntries(response.data);
    } catch (error) {
      console.error("Fetch entries error:", error);
      setMessage("Could not load reflection journal.");
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyReport = async () => {
    if (!userId) {
      return;
    }

    try {
      setReportError("");
      setReportData(null);
      setHasWeeklyReport(false);

      const response = await axios.get(
        "http://localhost:8081/api/reports/weekly",
        {
          params: {
            userId,
            weekStart: startDate,
            weekEnd: endDate,
          },
        }
      );

      if (response.data) {
        setReportData(response.data);
        setHasWeeklyReport(true);
      }
    } catch (error) {
      setHasWeeklyReport(false);
      setReportData(null);
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchWeeklyReport();
  }, [startDate, endDate]);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [entries]);

  const handlePreviousWeek = () => {
    const previous = new Date(currentWeekDate);
    previous.setDate(previous.getDate() - 7);
    setCurrentWeekDate(previous);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekDate);
    next.setDate(next.getDate() + 7);
    setCurrentWeekDate(next);
  };

  const handleEditClick = (entry) => {
    setEditingEntryId(entry.id);
    setEditForm({
      mood: entry.mood || "",
      energyLevel: entry.energyLevel || 5,
      activity: entry.activity || "",
      notes: entry.notes || "",
      date: entry.date || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
    setEditForm({
      mood: "",
      energyLevel: 5,
      activity: "",
      notes: "",
      date: "",
    });
  };

  const handleUpdate = async (entryId) => {
    try {
      await axios.put(`http://localhost:8081/checkins/${entryId}`, editForm);
      setMessage("Check-in updated successfully.");
      setEditingEntryId(null);
      fetchEntries();
    } catch (error) {
      console.error("Update error:", error);
      setMessage("Could not update check-in.");
    }
  };

  const handleDelete = async (entryId) => {
    try {
      await axios.delete(`http://localhost:8081/checkins/${entryId}`);
      setMessage("Check-in deleted successfully.");
      fetchEntries();
    } catch (error) {
      console.error("Delete error:", error);
      setMessage("Could not delete check-in.");
    }
  };

  const handleCreateWeeklyReport = async () => {
    if (!userId) {
      setReportError("User not found. Please log in again.");
      return;
    }

    try {
      setReportLoading(true);
      setReportError("");

      await axios.post("http://localhost:8081/api/weeklyreports", {
        userId,
        weekStart: startDate,
        weekEnd: endDate,
      });

      setMessage("Weekly report created successfully.");
      await fetchWeeklyReport();
    } catch (error) {
      console.error("Create weekly report error:", error);

      if (typeof error.response?.data === "string") {
        setReportError(error.response.data);
      } else if (error.response?.data?.message) {
        setReportError(error.response.data.message);
      } else {
        setReportError("Could not create weekly report.");
      }
    } finally {
      setReportLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!userId) {
      setReportError("User not found. Please log in again.");
      return;
    }

    try {
      setReportLoading(true);
      setReportError("");

      const response = await axios.get(
        "http://localhost:8081/api/reports/weekly",
        {
          params: {
            userId,
            weekStart: startDate,
            weekEnd: endDate,
          },
        }
      );

      setReportData(response.data);
      setHasWeeklyReport(true);
    } catch (error) {
      console.error("Generate report error:", error);

      if (typeof error.response?.data === "string") {
        setReportError(error.response.data);
      } else if (error.response?.data?.message) {
        setReportError(error.response.data.message);
      } else {
        setReportError("Could not load your ritual report.");
      }
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f3ee] px-6 py-12 text-[#2f3b33]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm uppercase tracking-[0.22em] text-[#7c857d]">
            Reflection Journal
          </p>

          <h1 className="text-4xl font-semibold md:text-5xl">
            Revisit the rhythm of your week
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-[#667067] md:text-lg">
            Explore your daily entries, notice your emotional patterns, and edit
            or remove reflections whenever you need.
          </p>
        </div>

        <div className="mb-8 flex flex-col items-center justify-between gap-4 rounded-[28px] border border-white/50 bg-white/60 p-6 shadow-[0_20px_60px_rgba(70,70,70,0.08)] backdrop-blur-sm md:flex-row">
          <button
            type="button"
            onClick={handlePreviousWeek}
            className="rounded-2xl border border-[#d9dfd8] bg-white/80 px-5 py-3 text-sm font-medium transition hover:scale-[1.02]"
          >
            ← Previous week
          </button>

          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.16em] text-[#7b857d]">
              Selected week
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{weekLabel}</h2>
          </div>

          <button
            type="button"
            onClick={handleNextWeek}
            className="rounded-2xl border border-[#d9dfd8] bg-white/80 px-5 py-3 text-sm font-medium transition hover:scale-[1.02]"
          >
            Next week →
          </button>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-[#dfe6de] bg-white/70 px-5 py-4 text-center text-sm text-[#556157]">
            {message}
          </div>
        )}

        {reportError && (
          <div className="mb-6 rounded-2xl border border-[#ead8d8] bg-white/70 px-5 py-4 text-center text-sm text-red-500">
            {reportError}
          </div>
        )}

        {reportData && (
          <div className="mb-8 rounded-[32px] border border-white/50 bg-white/70 p-8 shadow-[0_20px_60px_rgba(70,70,70,0.08)] backdrop-blur-sm">
            <p className="text-sm uppercase tracking-[0.22em] text-[#7b857d]">
              My Ritual
            </p>

            <h2 className="mt-2 text-3xl font-semibold text-[#2f3b33]">
              Weekly Reflection
            </h2>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-[#e3e8e2] bg-[#fcfbf8] p-6">
                <p className="text-xs uppercase tracking-[0.18em] text-[#7d867f]">
                  Week Summary
                </p>
                <p className="mt-3 text-base leading-7 text-[#2f3b33]">
                  {reportData.summary || "No summary available."}
                </p>
              </div>

              <div className="rounded-2xl border border-[#e3e8e2] bg-[#fcfbf8] p-6">
                <p className="text-xs uppercase tracking-[0.18em] text-[#7d867f]">
                  Emotional Patterns
                </p>
                <p className="mt-3 text-base leading-7 text-[#2f3b33]">
                  {reportData.patterns || "No patterns available."}
                </p>
              </div>

              <div className="rounded-2xl border border-[#e3e8e2] bg-[#fcfbf8] p-6">
                <p className="text-xs uppercase tracking-[0.18em] text-[#7d867f]">
                  Suggestions
                </p>
                <p className="mt-3 text-base leading-7 text-[#2f3b33]">
                  {reportData.suggestions || "No suggestions available."}
                </p>
              </div>

              <div className="rounded-2xl border border-[#e3e8e2] bg-[#fcfbf8] p-6">
                <p className="text-xs uppercase tracking-[0.18em] text-[#7d867f]">
                  Music for your mood
                </p>
                <p className="mt-3 text-base leading-7 text-[#2f3b33]">
                  {reportData.musicSuggestions || "No music suggestions available."}
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="rounded-[28px] border border-white/50 bg-white/60 p-10 text-center shadow-[0_20px_60px_rgba(70,70,70,0.08)]">
            Loading entries...
          </div>
        ) : sortedEntries.length === 0 ? (
          <div className="rounded-[28px] border border-white/50 bg-white/60 p-10 text-center shadow-[0_20px_60px_rgba(70,70,70,0.08)]">
            No check-ins found for this week.
          </div>
        ) : (
          <div className="grid gap-6 pb-32">
            {sortedEntries.map((entry) => {
              const isEditing = editingEntryId === entry.id;

              return (
                <div
                  key={entry.id}
                  className="rounded-[28px] border border-white/50 bg-white/70 p-6 shadow-[0_20px_60px_rgba(70,70,70,0.08)] backdrop-blur-sm"
                >
                  {!isEditing ? (
                    <>
                      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm uppercase tracking-[0.16em] text-[#7b857d]">
                            {prettyDate(entry.date)}
                          </p>

                          <div className="mt-3 flex items-center gap-3">
                            <span
                              className="h-5 w-5 rounded-full"
                              style={{
                                backgroundColor:
                                  moodColors[entry.mood] || "#d7ddd7",
                              }}
                            />
                            <h3 className="text-2xl font-semibold">
                              {entry.mood}
                            </h3>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-[#e3e8e2] bg-[#fcfbf8] px-4 py-3 text-sm text-[#667067]">
                          Energy level:{" "}
                          <span className="font-semibold text-[#2f3b33]">
                            {entry.energyLevel}/10
                          </span>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-[#e3e8e2] bg-[#fcfbf8] p-4">
                          <p className="text-sm uppercase tracking-[0.14em] text-[#7d867f]">
                            Activity
                          </p>
                          <p className="mt-2 text-base text-[#2f3b33]">
                            {entry.activity || "No activity added."}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-[#e3e8e2] bg-[#fcfbf8] p-4">
                          <p className="text-sm uppercase tracking-[0.14em] text-[#7d867f]">
                            Notes
                          </p>
                          <p className="mt-2 whitespace-pre-line text-base text-[#2f3b33]">
                            {entry.notes || "No notes added."}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleEditClick(entry)}
                          className="rounded-2xl bg-[#2f3b33] px-5 py-3 text-sm font-medium text-white transition hover:scale-[1.02]"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          className="rounded-2xl border border-[#d7ddd7] bg-white px-5 py-3 text-sm font-medium text-[#2f3b33] transition hover:scale-[1.02]"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  ) : (
                    <div>
                      <div className="mb-6">
                        <p className="text-sm uppercase tracking-[0.16em] text-[#7b857d]">
                          Editing entry
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold">
                          {prettyDate(entry.date)}
                        </h3>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-[#556157]">
                            Mood
                          </label>
                          <select
                            value={editForm.mood}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                mood: e.target.value,
                              })
                            }
                            className="w-full rounded-2xl border border-[#dde4dc] bg-[#fcfbf8] px-4 py-3 outline-none"
                          >
                            {moods.map((mood) => (
                              <option key={mood} value={mood}>
                                {mood}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-[#556157]">
                            Energy level
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={editForm.energyLevel}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                energyLevel: Number(e.target.value),
                              })
                            }
                            className="w-full rounded-2xl border border-[#dde4dc] bg-[#fcfbf8] px-4 py-3 outline-none"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-[#556157]">
                            Date
                          </label>
                          <input
                            type="date"
                            value={editForm.date}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                date: e.target.value,
                              })
                            }
                            className="w-full rounded-2xl border border-[#dde4dc] bg-[#fcfbf8] px-4 py-3 outline-none"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-[#556157]">
                            Activity
                          </label>
                          <input
                            type="text"
                            value={editForm.activity}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                activity: e.target.value,
                              })
                            }
                            className="w-full rounded-2xl border border-[#dde4dc] bg-[#fcfbf8] px-4 py-3 outline-none"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="mb-2 block text-sm font-medium text-[#556157]">
                          Notes
                        </label>
                        <textarea
                          rows={5}
                          value={editForm.notes}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              notes: e.target.value,
                            })
                          }
                          className="w-full resize-none rounded-2xl border border-[#dde4dc] bg-[#fcfbf8] px-4 py-3 outline-none"
                        />
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleUpdate(entry.id)}
                          className="rounded-2xl bg-[#2f3b33] px-5 py-3 text-sm font-medium text-white transition hover:scale-[1.02]"
                        >
                          Save changes
                        </button>

                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="rounded-2xl border border-[#d7ddd7] bg-white px-5 py-3 text-sm font-medium text-[#2f3b33] transition hover:scale-[1.02]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="fixed bottom-6 right-6 flex gap-3">
        <button
          type="button"
          onClick={handleCreateWeeklyReport}
          disabled={reportLoading || hasWeeklyReport}
          className="rounded-full border border-[#d7ddd7] bg-white px-6 py-4 text-sm font-semibold tracking-[0.12em] text-[#2f3b33] shadow-[0_18px_40px_rgba(47,59,51,0.12)] transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-50"
        >
          LET'S SEE WHAT CAN BE IMPROVED
        </button>

        <button
          type="button"
          onClick={handleGenerateReport}
          disabled={reportLoading}
          className="rounded-full bg-[#2f3b33] px-6 py-4 text-sm font-semibold tracking-[0.12em] text-white shadow-[0_18px_40px_rgba(47,59,51,0.25)] transition hover:scale-[1.03] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {reportLoading ? "LOADING..." : "SEE MY RITUAL"}
        </button>
      </div>
    </div>
  );
}