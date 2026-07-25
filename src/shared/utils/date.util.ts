const pad = (n: number) => String(n).padStart(2, '0');

export const formatTimestamp = (date: Date): string => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const toISO = (date: Date): string => {
  return date.toISOString();
};

export const now = (): Date => new Date();
