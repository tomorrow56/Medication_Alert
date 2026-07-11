import { useState, useEffect } from 'react';
import { Home, CalendarDays, Settings } from 'lucide-react';
import HomeScreen from './screens/HomeScreen';
import CalendarScreen from './screens/CalendarScreen';
import SettingsScreen from './screens/SettingsScreen';
import { scheduleMedicationNotifications } from './notifications';
import { loadSettings } from './storage';
import type { TabId } from './types';

const TABS: { id: TabId; label: string; Icon: typeof Home }[] = [
  { id: 'home', label: 'ホーム', Icon: Home },
  { id: 'calendar', label: 'カレンダー', Icon: CalendarDays },
  { id: 'settings', label: '設定', Icon: Settings },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');

  useEffect(() => {
    const settings = loadSettings();
    scheduleMedicationNotifications(settings.medications);
  }, []);

  return (
    <div className="flex flex-col min-h-dvh max-w-md mx-auto bg-white shadow-sm">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label="pill">💊</span>
          <h1 className="text-lg font-bold text-gray-800">服薬管理</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'calendar' && <CalendarScreen />}
        {activeTab === 'settings' && <SettingsScreen />}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 z-10">
        <div className="flex">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`tab-btn flex-1 ${activeTab === id ? 'active' : ''}`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
