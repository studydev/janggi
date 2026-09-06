export function subscriptionEstimate(record, allocation) {
  if (record.env === 'copilot') return null;
  for (const key of ['monthlyUsd', 'daysPerMonth', 'windowsPerDay', 'windowHours']) {
    if (!Number.isFinite(allocation?.[key]) || allocation[key] <= 0) throw new Error(`Invalid allocation: ${key}`);
  }
  const windowUsd = allocation.monthlyUsd / (allocation.daysPerMonth * allocation.windowsPerDay);
  if (record.env === 'codex' && (!Number.isInteger(record.assumedFullWindows) || record.assumedFullWindows < 0
    || !Number.isFinite(record.remainingPercent) || record.remainingPercent < 0 || record.remainingPercent > 100)) {
    throw new Error(`Invalid Codex scenario: ${record.dir}`);
  }
  const windowEquivalent = record.env === 'codex'
    ? record.assumedFullWindows + (100 - record.remainingPercent) / 100
    : record.usedPercent / 100;
  if (!Number.isFinite(windowEquivalent) || windowEquivalent < 0 || (record.env !== 'codex' && windowEquivalent > 1)) {
    throw new Error(`Invalid subscription usage: ${record.dir}`);
  }
  return {
    usd: windowUsd * windowEquivalent,
    windowUsd,
    windowEquivalent,
    conditional: record.env === 'codex',
    basis: record.env === 'codex'
      ? `조건부: ${record.assumedFullWindows}개 윈도우 전량 + 재설정 후 ${100 - record.remainingPercent}% = ${windowEquivalent}개. 각 윈도우가 100%에서 시작하고 이 작업만 사용했다고 가정.`
      : `관측 소진율 약 ${record.usedPercent}%에 구독료를 비례 배분.`,
  };
}

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
      estimate: subscriptionEstimate(record, data.subscriptionAllocation),
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