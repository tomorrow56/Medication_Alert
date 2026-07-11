import { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { loadSettings, loadMonthRecords, loadDailyRecord } from '../storage';
import type { DailyRecord } from '../types';

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

export default function CalendarScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  const settings = loadSettings();
  const enabledCount = settings.medications.filter(m => m.enabled).length;
  const monthRecords = loadMonthRecords(year, month);
  const recordMap = new Map(monthRecords.map(r => [r.date, r]));

  const days = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);
  const todayStr = dateStr(now.getFullYear(), now.getMonth(), now.getDate());

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelected(null);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelected(null);
  }

  const selectedRecord = selected ? loadDailyRecord(selected) : null;

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

            let dotColor = '';
            if (rate) {
              if (rate.taken === rate.total) dotColor = 'bg-green-500';
              else if (rate.taken > 0) dotColor = 'bg-yellow-400';
              else dotColor = 'bg-red-400';
            }

            return (
              <button
                key={ds}
                onClick={() => setSelected(ds === selected ? null : ds)}
                className={`flex flex-col items-center py-1.5 rounded-xl transition-colors ${
                  isSelected
                    ? 'bg-green-500 text-white'
                    : isToday
                    ? 'bg-green-50 text-green-700 font-bold'
                    : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-sm">{day}</span>
                {rate && (
                  <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                    {rate.taken}/{rate.total}
                  </span>
                )}
                {dotColor && !rate && (
                  <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${dotColor}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selected && selectedRecord && (
        <div className="card">
          <p className="font-semibold text-gray-700 mb-3">
            {selected.replace(/-/g, '/')} の記録
          </p>
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
                <span className={`text-xs font-medium ${
                  status === 'taken' ? 'text-green-600'
                  : status === 'missed' ? 'text-red-500'
                  : 'text-gray-400'
                }`}>
                  {status === 'taken' ? '服薬済み' : status === 'missed' ? '飲み忘れ' : '未服薬'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500 px-1">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />全完了</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />一部完了</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />未服薬</span>
      </div>
    </div>
  );
}
