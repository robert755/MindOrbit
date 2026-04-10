import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL } from '@/lib/api';
import { getSession } from '@/lib/session';

const moods = [
  'Excited',
  'Happy',
  'Grateful',
  'Calm',
  'Neutral',
  'Tired',
  'Stressed',
  'Overwhelmed',
  'Anxious',
  'Sad',
];

function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getEndOfWeek(date: Date) {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

type Entry = {
  id: number;
  mood: string;
  energyLevel: number;
  activity: string;
  notes: string;
  date: string;
};

export default function ReflectionScreen() {
  const { userId } = getSession();
  const [currentWeekDate, setCurrentWeekDate] = useState(new Date());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportText, setReportText] = useState('');
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [editMood, setEditMood] = useState('Calm');
  const [editEnergy, setEditEnergy] = useState('5');
  const [editActivity, setEditActivity] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editDate, setEditDate] = useState('');

  const startDate = useMemo(() => formatDate(getStartOfWeek(currentWeekDate)), [currentWeekDate]);
  const endDate = useMemo(() => formatDate(getEndOfWeek(currentWeekDate)), [currentWeekDate]);

  const weekLabel = useMemo(() => {
    const start = getStartOfWeek(currentWeekDate);
    const end = getEndOfWeek(currentWeekDate);
    return `${start.toLocaleDateString('en-GB')} - ${end.toLocaleDateString('en-GB')}`;
  }, [currentWeekDate]);

  const fetchEntries = async () => {
    if (!userId) {
      setMessage('User not found. Please log in again.');
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/checkins/user/${userId}/range`, {
        params: { startDate, endDate },
      });
      setEntries(response.data || []);
    } catch {
      setMessage('Could not load reflection journal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [startDate, endDate]);

  const startEdit = (entry: Entry) => {
    setEditingEntryId(entry.id);
    setEditMood(entry.mood || 'Calm');
    setEditEnergy(String(entry.energyLevel || 5));
    setEditActivity(entry.activity || '');
    setEditNotes(entry.notes || '');
    setEditDate(entry.date || '');
  };

  const saveEdit = async (entryId: number) => {
    try {
      await axios.put(`${API_BASE_URL}/checkins/${entryId}`, {
        mood: editMood,
        energyLevel: Number(editEnergy),
        activity: editActivity,
        notes: editNotes,
        date: editDate,
      });
      setEditingEntryId(null);
      setMessage('Check-in updated successfully.');
      fetchEntries();
    } catch {
      setMessage('Could not update check-in.');
    }
  };

  const deleteEntry = async (entryId: number) => {
    try {
      await axios.delete(`${API_BASE_URL}/checkins/${entryId}`);
      setMessage('Check-in deleted successfully.');
      fetchEntries();
    } catch {
      setMessage('Could not delete check-in.');
    }
  };

  const loadReport = async () => {
    if (!userId) return;
    try {
      setReportLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/reports/weekly`, {
        params: { userId, weekStart: startDate, weekEnd: endDate },
      });
      const data = response.data || {};
      setReportText(
        `Summary: ${data.summary || '-'}\n\nPatterns: ${data.patterns || '-'}\n\nSuggestions: ${
          data.suggestions || '-'
        }\n\nMusic: ${data.musicSuggestions || '-'}`
      );
    } catch {
      setReportText('Report not found. Please analyze your week first.');
    } finally {
      setReportLoading(false);
    }
  };

  const createReport = async () => {
    if (!userId) return;
    try {
      setReportLoading(true);
      await axios.post(`${API_BASE_URL}/api/reports/weekly`, null, {
        params: { userId, weekStart: startDate },
      });
      await loadReport();
    } catch {
      setMessage('Could not analyze week.');
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.kicker}>Reflection Journal</Text>
        <Text style={styles.title}>Revisit the rhythm of your week</Text>
        <Text style={styles.weekLabel}>{weekLabel}</Text>

        <View style={styles.row}>
          <Pressable style={styles.lightButton} onPress={() => setCurrentWeekDate(new Date(currentWeekDate.getTime() - 7 * 86400000))}>
            <Text style={styles.lightButtonText}>Previous week</Text>
          </Pressable>
          <Pressable style={styles.lightButton} onPress={() => setCurrentWeekDate(new Date(currentWeekDate.getTime() + 7 * 86400000))}>
            <Text style={styles.lightButtonText}>Next week</Text>
          </Pressable>
        </View>

        <View style={styles.row}>
          <Pressable style={styles.darkButton} onPress={createReport} disabled={reportLoading}>
            <Text style={styles.darkButtonText}>{reportLoading ? 'ANALYZING...' : "LET'S ANALYZE WEEK"}</Text>
          </Pressable>
          <Pressable style={styles.darkButton} onPress={loadReport} disabled={reportLoading}>
            <Text style={styles.darkButtonText}>{reportLoading ? 'LOADING...' : 'SEE MY RITUAL'}</Text>
          </Pressable>
        </View>

        {!!message && <Text style={styles.message}>{message}</Text>}
        {!!reportText && <Text style={styles.report}>{reportText}</Text>}

        {loading ? (
          <Text style={styles.message}>Loading entries...</Text>
        ) : entries.length === 0 ? (
          <Text style={styles.message}>No check-ins found for this week.</Text>
        ) : (
          entries.map((entry) => {
            const isEditing = editingEntryId === entry.id;
            return (
              <View key={entry.id} style={styles.card}>
                {!isEditing ? (
                  <>
                    <Text style={styles.entryTitle}>
                      {entry.date} - {entry.mood} - Energy {entry.energyLevel}/10
                    </Text>
                    <Text style={styles.entryText}>Activity: {entry.activity || '-'}</Text>
                    <Text style={styles.entryText}>Notes: {entry.notes || '-'}</Text>
                    <View style={styles.row}>
                      <Pressable style={styles.darkButton} onPress={() => startEdit(entry)}>
                        <Text style={styles.darkButtonText}>Edit</Text>
                      </Pressable>
                      <Pressable style={styles.lightButton} onPress={() => deleteEntry(entry.id)}>
                        <Text style={styles.lightButtonText}>Delete</Text>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.entryTitle}>Editing entry</Text>
                    <TextInput style={styles.input} value={editDate} onChangeText={setEditDate} placeholder="Date YYYY-MM-DD" />
                    <TextInput style={styles.input} value={editMood} onChangeText={setEditMood} placeholder={`Mood (${moods.join(', ')})`} />
                    <TextInput style={styles.input} value={editEnergy} onChangeText={setEditEnergy} placeholder="Energy 1-10" keyboardType="numeric" />
                    <TextInput style={styles.input} value={editActivity} onChangeText={setEditActivity} placeholder="Activity" />
                    <TextInput style={[styles.input, styles.notes]} value={editNotes} onChangeText={setEditNotes} placeholder="Notes" multiline />
                    <View style={styles.row}>
                      <Pressable style={styles.darkButton} onPress={() => saveEdit(entry.id)}>
                        <Text style={styles.darkButtonText}>Save changes</Text>
                      </Pressable>
                      <Pressable style={styles.lightButton} onPress={() => setEditingEntryId(null)}>
                        <Text style={styles.lightButtonText}>Cancel</Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f3ee' },
  container: { padding: 20, gap: 12 },
  kicker: { textAlign: 'center', textTransform: 'uppercase', letterSpacing: 2, color: '#7c857d' },
  title: { textAlign: 'center', fontSize: 30, color: '#2f3b33', fontWeight: '600' },
  weekLabel: { textAlign: 'center', color: '#556157' },
  row: { flexDirection: 'row', gap: 10, justifyContent: 'center', flexWrap: 'wrap' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ece6dc',
    gap: 6,
  },
  entryTitle: { color: '#2f3b33', fontWeight: '700' },
  entryText: { color: '#556157' },
  input: {
    borderWidth: 1,
    borderColor: '#dbe3da',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  notes: { minHeight: 90, textAlignVertical: 'top' },
  darkButton: {
    backgroundColor: '#2f3b33',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  darkButtonText: { color: '#fff', fontWeight: '600' },
  lightButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7ddd7',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  lightButtonText: { color: '#2f3b33', fontWeight: '600' },
  message: { textAlign: 'center', color: '#556157' },
  report: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e8ece8',
    borderRadius: 12,
    padding: 12,
    color: '#2f3b33',
    lineHeight: 20,
  },
});
