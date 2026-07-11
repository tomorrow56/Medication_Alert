export type MedicationStatus = 'pending' | 'taken' | 'missed';

export interface MedicationTime {
  id: string;
  label: string;
  time: string;
  enabled: boolean;
}

export interface DailyRecord {
  date: string;
  records: {
    medicationId: string;
    status: MedicationStatus;
    takenAt?: string;
  }[];
}

export interface AppSettings {
  medications: MedicationTime[];
}

export type TabId = 'home' | 'calendar' | 'settings';
