import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { loadSettings, loadMonthRecords, loadDailyRecord, saveDailyRecord } from '../storage';
import type { DailyRecord, MedicationStatus, MedicationTime } from '../types';

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

type RateInfo = { taken: number; total: number } | null;

function getRate(record: DailyRecord, totalEnabled: number): RateInfo {
  if (!record.records.length) return null;
  const taken = record.records.filter(r => r.status === 'taken').length;
  return { taken, total: totalEnabled };
}

function statusBadgeClass(status: MedicationStatus) {
  switch (status) {
    case 'taken':
      return 'bg-green-100 text-green-700';
    case 'missed':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-500';
  }
}

function statusText(status: MedicationStatus) {
  switch (status) {
    case 'taken':
      return '服薬済み';
    case 'missed':
      return '飲み忘れ';
    default:
      return '未服薬';
  }
}

function cellClass(rate: RateInfo, isSelected: boolean, isToday: boolean) {
  if (isSelected) return 'bg-green-600 text-white ring-2 ring-green-700 ring-offset-2';
  if (isToday) return 'bg-blue-50 text-blue-700 font-bold ring-1 ring-blue-200';
  if (!rate) return 'hover:bg-gray-50 text-gray-700';
  if (rate.taken === rate.total) return 'bg-green-100 text-green-800';
  if (rate.taken > 0) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

function barClass(rate: RateInfo, isSelected: boolean) {
  if (!rate) return '';
  if (isSelected) return 'bg-white/70';
  if (rate.taken === rate.total) return 'bg-green-500';
  if (rate.taken > 0) return 'bg-yellow-400';
  return 'bg-red-400';
}

export default function CalendarScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<string | null>(null);
  const [monthRecords, setMonthRecords] = useState<DailyRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<DailyRecord | null>(null);

  const settings = loadSettings();
  const enabledCount = settings.medications.filter(m => m.enabled).length;

  useEffect(() => {
    setMonthRecords(loadMonthRecords(year, month));
    setSelected(null);
    setSelectedRecord(null);
  }, [year, month]);

  useEffect(() => {
    if (selected) setSelectedRecord(loadDailyRecord(selected));
  }, [selected]);

  const days = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);
  const todayStr = dateStr(now.getFullYear(), now.getMonth(), now.getDate());

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelected(null);
    setSelectedRecord(null);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelected(null);
    setSelectedRecord(null);
  }

  function toggleStatus(med: MedicationTime) {
    if (!selectedRecord) return;
    const current = selectedRecord.records.find(r => r.medicationId === med.id);
    const order: MedicationStatus[] = ['taken', 'missed', 'pending'];
    const nextStatus = current ? order[(order.indexOf(current.status) + 1) % order.length] : 'taken';

    const newRecords = selectedRecord.records.filter(r => r.medicationId !== med.id);
    if (nextStatus !== 'pending') {
      newRecords.push({
        medicationId: med.id,
        status: nextStatus,
        takenAt: new Date().toISOString(),
      });
    }

    const newRecord: DailyRecord = { ...selectedRecord, records: newRecords };
    setSelectedRecord(newRecord);
    saveDailyRecord(newRecord);
    setMonthRecords(loadMonthRecords(year, month));
  }

  const recordMap = new Map(monthRecords.map(r => [r.date, r]));

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold">
          {year}年{month + 1}月
        </h2>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="card p-3">
        <div className="grid grid-cols-7 mb-1">
          {['日', '月', '火', '水', '木', '金', '土'].map(d => (
            <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1;
            const ds = dateStr(year, month, day);
            const rec = recordMap.get(ds);
            const rate = rec ? getRate(rec, enabledCount) : null;
            const isToday = ds === todayStr;
            const isSelected = ds === selected;
            const baseClass = cellClass(rate, isSelected, isToday);

            return (
              <button
                key={ds}
                onClick={() => setSelected(ds === selected ? null : ds)}
                className={`flex flex-col items-center py-1.5 rounded-xl transition-colors ${baseClass}`}
              >
                <span className="text-sm">{day}</span>
                {rate && (
                  <>
                    <span className={`text-xs ${isSelected ? 'text-white/90' : 'opacity-70'}`}>
                      {rate.taken}/{rate.total}
                    </span>
                    <span className={`w-6 h-1.5 rounded-full mt-0.5 ${barClass(rate, isSelected)}`} />
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selected && selectedRecord && (
        <div className="card">
          <p className="font-semibold text-gray-700 mb-1">
            {selected.replace(/-/g, '/')} の記録
          </p>
          <p className="text-xs text-gray-400 mb-3">※ タップで状態を切り替え</p>
          {settings.medications.filter(m => m.enabled).map(med => {
            const entry = selectedRecord.records.find(r => r.medicationId === med.id);
            const status = entry?.status ?? 'pending';
            return (
              <div key={med.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                {status === 'taken' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : status === 'missed' ? (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                ) : (
                  <Clock className="w-5 h-5 text-gray-300 flex-shrink-0" />
                )}
                <span className="flex-1 text-sm">
                  {med.label} ({med.time})
                </span>
                <button
                  onClick={() => toggleStatus(med)}
                  className={`text-xs font-medium px-2 py-1 rounded-full transition-colors ${statusBadgeClass(status)}`}
                >
                  {statusText(status)}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-2 px-1">
        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />全完了
        </span>
        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs">
          <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />一部完了
        </span>
        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />未完了
        </span>
      </div>
    </div>
  );
}
