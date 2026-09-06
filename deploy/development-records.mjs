export function developmentRecords(apps, data) {
  if (data.creditsPerUsd !== 100) throw new Error('Expected 100 credits per USD');
  const appNames = new Set(apps.map((app) => app.dir));
  if (appNames.size !== apps.length) throw new Error('Duplicate app directory');
  const records = new Map();
  for (const record of data.records) {
    if (!appNames.has(record.dir) || records.has(record.dir)) {
      throw new Error(`Unknown or duplicate development record: ${record.dir}`);
    }
    const app = apps.find((entry) => entry.dir === record.dir);
    if (record.env !== app.env) throw new Error(`Platform mismatch: ${record.dir}`);
    if (!/^make-[\w-]+\.md$/.test(record.logFile)) throw new Error(`Invalid log: ${record.dir}`);
    for (const key of ['durationSeconds', 'steps']) {
      if (record[key] !== null && (!Number.isInteger(record[key]) || record[key] <= 0)) {
        throw new Error(`Invalid ${key}: ${record.dir}`);
      }
    }
    if (record.env === 'copilot') {
      if (!Number.isFinite(record.credits) || record.credits < 0) throw new Error(`Invalid credits: ${record.dir}`);
    } else if (record.credits != null || !record.usage || !record.plan) {
      throw new Error(`Subscription usage must not be converted to credits: ${record.dir}`);
    }
    records.set(record.dir, {
      ...record,
      usd: record.env === 'copilot' ? record.credits / data.creditsPerUsd : null,
    });
  }
  for (const app of apps) {
    if (!records.has(app.dir)) throw new Error(`Missing development record: ${app.dir}`);
  }
  return records;
}

export function formatUsd(value) {
  return value == null ? '직접 환산 불가' : `$${value.toFixed(3)}`;
}