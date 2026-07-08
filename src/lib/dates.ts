export function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// "Today" follows the timezone of whoever opens the app: Simon in Paris sees the
// Paris date, Emma in Mexico sees the Mexico date. This is simply the device's
// local calendar date — each person's day rolls over at their own local midnight.
export function today(): string {
  return toLocalDateStr(new Date());
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
