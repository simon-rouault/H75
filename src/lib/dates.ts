export function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function today(): string {
  return toLocalDateStr(new Date());
}

export function formatDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatDateShort(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

export function daysArray(startDate: string, count: number): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + 'T00:00:00');
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(toLocalDateStr(d));
  }
  return dates;
}
