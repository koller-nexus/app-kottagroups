function toDate(isoDay: string): Date {
  const [year, month, day] = isoDay.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

/** "12 de out." */
export function formatShortDate(isoDay: string): string {
  return toDate(isoDay).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** "outubro de 2026" */
export function formatMonthYear(isoDay: string): string {
  return toDate(isoDay).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "domingo, 4 de outubro" */
export function formatLongDay(isoDay: string): string {
  return toDate(isoDay).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}
