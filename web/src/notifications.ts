export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function sendNotification(title: string, body: string): void {
  if (Notification.permission !== 'granted') return;
  new Notification(title, { body, icon: '/Medication_Alert/favicon.svg' });
}

export function scheduleMedicationNotifications(
  medications: { id: string; label: string; time: string; enabled: boolean }[],
): void {
  const now = new Date();
  const todayBase = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  medications
    .filter(m => m.enabled)
    .forEach(med => {
      const [h, m] = med.time.split(':').map(Number);
      const target = new Date(todayBase.getTime());
      target.setHours(h, m, 0, 0);

      const delay = target.getTime() - now.getTime();
      if (delay <= 0) return;

      setTimeout(() => {
        sendNotification('服薬の時間です', `${med.label}（${med.time}）の服薬時刻になりました`);
      }, delay);
    });
}
