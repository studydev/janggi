import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { developmentRecords, formatUsd } from './development-records.mjs';

const apps = JSON.parse(readFileSync(new URL('./apps.json', import.meta.url), 'utf8'));
const data = JSON.parse(readFileSync(new URL('./development-records.json', import.meta.url), 'utf8'));

test('all ten apps and three platforms have development records', () => {
  const records = developmentRecords(apps, data);
  assert.equal(records.size, 10);
  assert.deepEqual([...new Set([...records.values()].map((record) => record.env))].sort(), ['claude-code', 'codex', 'copilot']);
  for (const record of records.values()) {
    assert(readFileSync(new URL(`../_comparison/data/${record.logFile}`, import.meta.url), 'utf8').length > 0);
  }
});

test('GHCP credits convert to exact three-decimal USD amounts', () => {
  const records = developmentRecords(apps, data);
  const expected = { astra: '$26.273', opus5: '$13.016', sonnet5: '$10.146', 'sol-fast': '$4.856', sol: '$4.989', terra: '$4.152', luna: '$0.653' };
  for (const [name, usd] of Object.entries(expected)) assert.equal(formatUsd(records.get(name).usd), usd);
});

test('subscription usage is not a monetary cost or inferred time', () => {
  const records = developmentRecords(apps, data);
  for (const name of ['claude_opus5', 'claude_sonnet5', 'codex-astra']) {
    assert.equal(records.get(name).usd, null);
    assert.equal(formatUsd(records.get(name).usd), '직접 환산 불가');
  }
  assert.equal(records.get('claude_sonnet5').usedPercent, 33);
  assert.equal(records.get('claude_opus5').usedPercent, 65);
  assert.equal(records.get('claude_opus5').durationSeconds, null);
  assert.match(records.get('codex-astra').usage, /42% 잔여/);
});

test('missing, duplicate, unknown and mismatched records fail closed', () => {
  assert.throws(() => developmentRecords(apps, { ...data, records: data.records.slice(1) }), /Missing/);
  assert.throws(() => developmentRecords(apps, { ...data, records: [...data.records, data.records[0]] }), /duplicate/);
  assert.throws(() => developmentRecords(apps, { ...data, records: [...data.records, { dir: 'unknown' }] }), /Unknown/);
  const changed = structuredClone(data);
  changed.records[0].env = 'codex';
  assert.throws(() => developmentRecords(apps, changed), /Platform mismatch/);
});