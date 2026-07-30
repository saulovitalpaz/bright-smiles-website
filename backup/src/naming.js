import { randomUUID } from 'node:crypto';

const pad = (value) => String(value).padStart(2, '0');
const timestamp = (date) => date.toISOString().replace(/[-:.]/g, '');

export const backupKeys = (date = new Date(), suffix = randomUUID()) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error('Invalid backup date.');
  }

  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const name = `postgres-${timestamp(date)}-${suffix}.dump.enc`;

  return {
    dailyKey: `daily/${year}/${month}/${name}`,
    monthlyKey: date.getUTCDate() === 1 ? `monthly/${year}/${name}` : null
  };
};
