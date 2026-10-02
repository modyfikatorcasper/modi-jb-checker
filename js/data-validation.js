import { compareVersions } from './firmware-checker.js';
const statuses = new Set(['CONFIRMED','ESTIMATED','UNKNOWN']);
const date = value => typeof value === 'string' && /^20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value);
export function validateData({ consoles, rules, firmware, sources }) {
  const assert = (condition,message) => { if (!condition) throw new Error(message); };
  const identifiers = new Set();
  const sourceIds = new Set(sources.sources?.map(source => source.id));
  for (const [name,database] of Object.entries({consoles,rules,firmware,sources})) {
    assert(database.schema_version === 1,`${name}: unsupported schema version`);
    assert(date(database.last_updated),`${name}: invalid update date`);
  }
  assert(Array.isArray(consoles.records) && Array.isArray(rules.rules) && Array.isArray(rules.model_rules) && Array.isArray(firmware.ranges) && Array.isArray(sources.sources),'Expected database arrays');
  function sourced(entry) {
    assert(sourceIds.has(entry.source_id),`${entry.id ?? 'Rule'}: unknown source_id`);
    assert(entry.source_name && date(entry.source_date) && entry.data_type,'Missing source metadata');
    assert(entry.source_url === null || /^https:\/\//.test(entry.source_url ?? ''),'Sources must use HTTPS or null');
  }
  function versioned(entry) {
    if (entry.firmware) compareVersions(entry.firmware,entry.firmware);
    if (entry.firmware_min || entry.firmware_max) assert(compareVersions(entry.firmware_min,entry.firmware_max) <= 0,'Inverted firmware range');
  }
  for (const entry of [...consoles.records,...rules.rules]) {
    assert(typeof entry.id === 'string' && !identifiers.has(entry.id),'Missing or duplicate record ID'); identifiers.add(entry.id);
    assert((consoles.records.includes(entry) ? /^S01-[A-Z]\d{3}$/ : /^S01-[A-Z]\d{1,3}$/).test(entry.serial_prefix),'Publish only short serial prefixes (at most eight characters)');
    assert(statuses.has(entry.status),'Invalid verification status');
    sourced(entry); versioned(entry);
  }
  for (const record of consoles.records) {
    assert(record.model && record.console_family && record.edition && record.evidence && record.evidence_review && record.confidence && record.notes,'Incomplete unit record');
    assert(Array.isArray(record.proof),'Proof must be an array');
    if (record.production_date) assert(/^20\d{2}-(0[1-9]|1[0-2])$/.test(record.production_date),'Invalid production month');
    if (record.status === 'CONFIRMED') assert(record.firmware && record.verified_by && record.verification_pending !== true && record.firmware_basis !== 'unverified','Confirmed unit must have exact firmware and verifier');
    for (const proof of record.proof) assert(proof.type && /^assets\/proof\/[A-Za-z0-9_/-]+\.(png|jpe?g|webp)$/i.test(proof.file) && !proof.file.includes('..'),'Unsafe proof file path');
  }
  for (const rule of rules.rules) {
    assert(rule.status !== 'CONFIRMED','Batch rules cannot confirm another physical console');
    for (const period of [rule.production_from,rule.production_to].filter(Boolean)) assert(/^20\d{2}-(0[1-9]|1[0-2])$/.test(period),'Invalid production interval');
    if (rule.production_from && rule.production_to) assert(rule.production_from <= rule.production_to,'Inverted production interval');
  }
  for (const rule of rules.model_rules) { sourced(rule); new RegExp(rule.model_pattern); }
  for (const entry of firmware.ranges) {
    sourced(entry); versioned(entry);
    assert(entry.firmware || (entry.firmware_min && entry.firmware_max),'Missing exploit firmware bounds');
    assert(['compatible','unknown','not_known'].includes(entry.status) && typeof entry.public === 'boolean' && entry.exploit_name && date(entry.last_updated),'Incomplete exploit metadata');
  }
  // Public data must contain no full serials, MAC addresses or private identifier fields.
  const serialized = JSON.stringify({consoles,rules});
  assert(!/S01-?[A-Z]\d{4,}/i.test(serialized),'Full or overlong serial identifier in public data');
  assert(!/(?:[0-9a-f]{2}:){5}[0-9a-f]{2}/i.test(serialized),'MAC address in public data');
  assert(!/"(?:serial_number|full_serial|mac_address|serial)"\s*:/i.test(serialized),'Private identifier field in public data');
  return true;
}
