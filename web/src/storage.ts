import type { AppSettings, DailyRecord, MedicationTime } from './types';

const KEYS = {
  SETTINGS: 'medication_settings',
  RECORDS: 'medication_records',
} as const;

const DEFAULT_MEDICATIONS: MedicationTime[] = [
  { id: 'morning', label: '朝', time: '08:00', enabled: true },
  { id: 'noon', label: '昼', time: '12:00', enabled: true },
  { id: 'evening', label: '夜', time: '20:00', enabled: true },
];

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (raw) return JSON.parse(raw) as AppSettings;
  } catch {
    // fall through to default
  }
  return { medications: DEFAULT_MEDICATIONS };
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

function loadAllRecords(): DailyRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.RECORDS);
    if (raw) return JSON.parse(raw) as DailyRecord[];
  } catch {
    // fall through
  }
  return [];
}

function saveAllRecords(records: DailyRecord[]): void {
  localStorage.setItem(KEYS.RECORDS, JSON.stringify(records));
}

export function loadDailyRecord(date: string): DailyRecord {
  const all = loadAllRecords();
  return all.find(r => r.date === date) ?? { date, records: [] };
}

export function saveDailyRecord(record: DailyRecord): void {
  const all = loadAllRecords();
  const idx = all.findIndex(r => r.date === record.date);
  if (idx >= 0) {
    all[idx] = record;
  } else {
    all.push(record);
  }
  saveAllRecords(all);
}

export function loadMonthRecords(year: number, month: number): DailyRecord[] {
  const all = loadAllRecords();
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return all.filter(r => r.date.startsWith(prefix));
}

export function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
