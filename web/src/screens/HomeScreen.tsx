import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, AlertCircle, PartyPopper } from 'lucide-react';
import {
  loadSettings,
  loadDailyRecord,
  saveDailyRecord,
  todayString,
} from '../storage';
import type { MedicationTime, DailyRecord, MedicationStatus } from '../types';

function getStatus(
  record: DailyRecord,
  med: MedicationTime,
): MedicationStatus {
  const entry = record.records.find(r => r.medicationId === med.id);
  if (entry) return entry.status;

  const now = new Date();
  const [h, m] = med.time.split(':').map(Number);
  const target = new Date();
  target.setHours(h, m, 0, 0);

  if (now > new Date(target.getTime() + 60 * 60 * 1000)) return 'missed';
  return 'pending';
}

function nextCountdown(medications: MedicationTime[]): string | null {
  const now = new Date();
  const times = medications
    .filter(m => m.enabled)
    .map(m => {
      const [h, mn] = m.time.split(':').map(Number);
      const t = new Date();
      t.setHours(h, mn, 0, 0);
      return t;
    })
    .filter(t => t > now)
    .sort((a, b) => a.getTime() - b.getTime());

  if (!times.length) return null;
  const diff = times[0].getTime() - now.getTime();
  const hh = Math.floor(diff / 3600000);
  const mm = Math.floor((diff % 3600000) / 60000);
  const ss = Math.floor((diff % 60000) / 1000);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export default function HomeScreen() {
  const [settings] = useState(() => loadSettings());
  const today = todayString();
  const [record, setRecord] = useState<DailyRecord>(() => loadDailyRecord(today));
  const [countdown, setCountdown] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setCountdown(nextCountdown(settings.medications.filter(m => m.enabled)));
  }, [now, settings.medications]);

  const enabledMeds = settings.medications.filter(m => m.enabled);
  const allDone = enabledMeds.every(
    med => record.records.find(r => r.medicationId === med.id)?.status === 'taken',
  );

  function handleTaken(med: MedicationTime) {
    const newRecords = record.records.filter(r => r.medicationId !== med.id);
    newRecords.push({
      medicationId: med.id,
      status: 'taken',
      takenAt: new Date().toISOString(),
    });
    const newRecord: DailyRecord = { ...record, records: newRecords };
    setRecord(newRecord);
    saveDailyRecord(newRecord);
  }

  function handleUndo(med: MedicationTime) {
    const newRecords = record.records.filter(r => r.medicationId !== med.id);
    const newRecord: DailyRecord = { ...record, records: newRecords };
    setRecord(newRecord);
    saveDailyRecord(newRecord);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="text-center py-2">
        <p className="text-sm text-gray-500">
          {now.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
        </p>
        {countdown && !allDone && (
          <p className="text-xs text-gray-400 mt-0.5">
            次の服薬まで <span className="font-mono font-semibold text-green-600">{countdown}</span>
          </p>
        )}
      </div>

      {allDone ? (
        <div className="card flex flex-col items-center gap-2 py-8 text-center">
          <PartyPopper className="w-12 h-12 text-green-500" />
          <p className="text-xl font-bold text-green-600">今日の服薬は完了!</p>
          <p className="text-sm text-gray-500">お疲れ様でした</p>
        </div>
      ) : (
        enabledMeds.map(med => {
          const status = getStatus(record, med);
          return (
            <MedicationCard
              key={med.id}
              med={med}
              status={status}
              onTaken={() => handleTaken(med)}
              onUndo={() => handleUndo(med)}
            />
          );
        })
      )}
    </div>
  );
}

interface CardProps {
  med: MedicationTime;
  status: MedicationStatus;
  onTaken: () => void;
  onUndo: () => void;
}

function MedicationCard({ med, status, onTaken, onUndo }: CardProps) {
  const isTaken = status === 'taken';
  const isMissed = status === 'missed';

  return (
    <div
      className={`card flex items-center gap-4 ${
        isMissed ? 'border-red-200 bg-red-50' : isTaken ? 'border-green-200 bg-green-50' : ''
      }`}
    >
      <div className="flex-shrink-0">
        {isTaken ? (
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        ) : isMissed ? (
          <AlertCircle className="w-10 h-10 text-red-400" />
        ) : (
          <Clock className="w-10 h-10 text-gray-300" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold tabular-nums">{med.time}</p>
        <p className={`text-sm font-medium ${
          isMissed ? 'text-red-500' : isTaken ? 'text-green-600' : 'text-gray-500'
        }`}>
          {med.label} ・ {isTaken ? '服薬済み' : isMissed ? '飲み忘れ' : '未服薬'}
        </p>
      </div>

      <div className="flex-shrink-0">
        {isTaken ? (
          <button
            onClick={onUndo}
            className="text-xs text-gray-400 underline py-2"
          >
            取消
          </button>
        ) : (
          <button
            onClick={onTaken}
            className={`btn-primary text-sm py-3 px-5 ${isMissed ? 'bg-red-500 active:bg-red-600' : ''}`}
          >
            服薬完了
          </button>
        )}
      </div>
    </div>
  );
}
