import { useState } from 'react';
import { Bell, BellOff, Save, RotateCcw } from 'lucide-react';
import { loadSettings, saveSettings } from '../storage';
import { requestNotificationPermission, scheduleMedicationNotifications } from '../notifications';
import type { AppSettings, MedicationTime } from '../types';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [saved, setSaved] = useState(false);
  const [notifGranted, setNotifGranted] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted',
  );

  function updateTime(id: string, time: string) {
    setSettings(prev => ({
      ...prev,
      medications: prev.medications.map(m => m.id === id ? { ...m, time } : m),
    }));
    setSaved(false);
  }

  function toggleEnabled(id: string) {
    setSettings(prev => ({
      ...prev,
      medications: prev.medications.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m),
    }));
    setSaved(false);
  }

  function updateLabel(id: string, label: string) {
    setSettings(prev => ({
      ...prev,
      medications: prev.medications.map(m => m.id === id ? { ...m, label } : m),
    }));
    setSaved(false);
  }

  async function handleSave() {
    saveSettings(settings);
    scheduleMedicationNotifications(settings.medications);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleRequestNotif() {
    const granted = await requestNotificationPermission();
    setNotifGranted(granted);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="card">
        <h2 className="font-bold text-gray-700 mb-3">服薬時刻の設定</h2>
        <div className="flex flex-col divide-y divide-gray-100">
          {settings.medications.map((med: MedicationTime) => (
            <MedicationRow
              key={med.id}
              med={med}
              onTimeChange={t => updateTime(med.id, t)}
              onToggle={() => toggleEnabled(med.id)}
              onLabelChange={l => updateLabel(med.id, l)}
            />
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="font-bold text-gray-700 mb-3">ブラウザ通知</h2>
        {notifGranted ? (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <Bell className="w-4 h-4" />
            <span>通知が許可されています</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <BellOff className="w-4 h-4" />
              <span>通知が許可されていません</span>
            </div>
            <button onClick={handleRequestNotif} className="btn-secondary text-sm">
              通知を許可する
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        className={`btn-primary flex items-center justify-center gap-2 ${saved ? 'bg-green-600' : ''}`}
      >
        {saved ? (
          <>
            <RotateCcw className="w-4 h-4" />
            保存しました
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            設定を保存
          </>
        )}
      </button>

      <p className="text-xs text-gray-400 text-center">
        データはこのブラウザのローカルストレージに保存されます
      </p>
    </div>
  );
}

interface RowProps {
  med: MedicationTime;
  onTimeChange: (t: string) => void;
  onToggle: () => void;
  onLabelChange: (l: string) => void;
}

function MedicationRow({ med, onTimeChange, onToggle, onLabelChange }: RowProps) {
  return (
    <div className={`py-4 flex items-center gap-3 ${!med.enabled ? 'opacity-50' : ''}`}>
      <button
        onClick={onToggle}
        className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
          med.enabled ? 'bg-green-500' : 'bg-gray-200'
        }`}
        aria-label={med.enabled ? 'オフにする' : 'オンにする'}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            med.enabled ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>

      <input
        type="text"
        value={med.label}
        onChange={e => onLabelChange(e.target.value)}
        disabled={!med.enabled}
        className="w-12 text-sm font-medium text-gray-700 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-green-400 rounded px-1"
        maxLength={4}
      />

      <input
        type="time"
        value={med.time}
        onChange={e => onTimeChange(e.target.value)}
        disabled={!med.enabled}
        className="flex-1 text-xl font-bold tabular-nums text-gray-800 bg-transparent border-0
                   focus:outline-none focus:ring-1 focus:ring-green-400 rounded px-1 disabled:cursor-not-allowed"
      />
    </div>
  );
}
