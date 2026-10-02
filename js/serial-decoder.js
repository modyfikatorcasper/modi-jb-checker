import { compareVersions } from './firmware-checker.js';

// Returns only safe metadata. Never return, persist or log the full serial.
export function parseSerial(input) {
  if (typeof input !== 'string' || input.length > 32) return { valid: false, error: 'Enter a serial number or a prefix from the box label.' };
  const value = input.trim().toUpperCase().replace(/[\s‐‑–]/g, '').replace(/(?:\.{3}|…)$/, '');
  const normalized = value.replace(/^S01(?=[A-Z])/, 'S01-');
  if (!/^S01-[A-Z]\d{3,16}$/.test(normalized)) return { valid: false, error: 'Use an S01 prefix followed by a letter and at least three digits, for example S01-V565. Check that this is the serial, not a barcode or model number.' };
  return { valid: true, safe_prefix: normalized.slice(0, 8), prefix_only: normalized.length === 8 };
}

function normalizedSerial(input) {
  return input.trim().toUpperCase().replace(/[\s‐‑–]/g, '').replace(/(?:\.{3}|…)$/, '').replace(/^S01(?=[A-Z])/, 'S01-');
}

export function normalizeModel(input = '') {
  return input.trim().toUpperCase().replace(/\s+/g, ' ').replace(/^CFI(?=\d)/, 'CFI-').replace(/^(CFI-\d{4})([A-Z])$/, '$1 $2');
}

function modelMatches(entered, reference) {
  if (!entered || !reference) return true;
  const a = normalizeModel(entered), b = normalizeModel(reference);
  const [aBase,aSuffix] = a.split(' '), [bBase,bSuffix] = b.split(' ');
  return aBase === bBase && (!aSuffix || !bSuffix || aSuffix === bSuffix || (aSuffix.length === 1 && bSuffix.startsWith(aSuffix)));
}

function dateMatches(date, record) {
  if (!date) return true;
  if (record.production_date && record.production_date !== date) return false;
  if (/^\d{4}$/.test(record.production_period ?? '') && record.production_period !== date.slice(0,4)) return false;
  const from = record.production_from, to = record.production_to;
  return (!from || date >= from) && (!to || date <= to);
}

export function decodeSerial({ serial, model = '', production_date = '' }, records, rules) {
  const parsed = parseSerial(serial);
  if (!parsed.valid) return { valid: false, error: parsed.error };
  if (typeof model !== 'string' || typeof production_date !== 'string') return { valid: false, error: 'Check the optional model and production date.' };
  const enteredModel = normalizeModel(model);
  if (enteredModel && !/^CFI-\d{4}(?: [A-Z0-9]{1,5})?$/.test(enteredModel)) return { valid: false, error: 'Use a model such as CFI-2116 or CFI-2116 BZJY.' };
  if (production_date && !/^(20\d{2})-(0[1-9]|1[0-2])$/.test(production_date)) return { valid: false, error: 'Use a valid production month and year.' };
  const normalized = normalizedSerial(serial);
  const candidates = [
    ...records.map(record => ({ ...record, candidate_type: 'unit', match_length: record.serial_prefix.length })),
    ...rules.rules.map(rule => ({ ...rule, candidate_type: 'rule', match_length: rule.serial_prefix.length }))
  ].filter(record => normalized.startsWith(record.serial_prefix));
  const familyRule = rules.model_rules.find(rule => enteredModel && new RegExp(rule.model_pattern).test(enteredModel));
  const unknown = {
    valid: true, status: 'UNKNOWN', console_family: familyRule?.console_family ?? 'PS5 · family unknown',
    model: enteredModel || 'Unknown', serial_prefix: parsed.safe_prefix,
    production_period: production_date ? `${production_date.slice(5)}.${production_date.slice(0,4)} (box input)` : 'Unknown',
    firmware: null, confidence: 'Insufficient evidence', references: [], verification_pending: false,
    note: 'No supported prefix match. Model or production date alone does not establish factory firmware.',
    source: familyRule ? `${familyRule.source_name} (model only)` : 'No matching source',
    model_source: familyRule ?? null
  };
  if (!candidates.length) return unknown;
  const longest = Math.max(...candidates.map(candidate => candidate.match_length));
  const batch = candidates.filter(candidate => candidate.match_length === longest);
  const matches = batch.filter(record => modelMatches(enteredModel, record.model) && dateMatches(production_date, record));
  if (!matches.length) return { ...unknown, note: 'The prefix matches a reference, but your model or production date conflicts with it. Check the box details; no firmware estimate is made.', references: batch.map(record => record.id) };
  const known = matches.filter(record => (record.status === 'CONFIRMED' || (record.candidate_type === 'rule' && record.status === 'ESTIMATED')) && !record.verification_pending && (record.firmware || (record.firmware_min && record.firmware_max)));
  let firmware = null;
  if (known.length === matches.length) {
    const values = known.flatMap(record => record.firmware ? [record.firmware] : [record.firmware_min, record.firmware_max]).sort(compareVersions);
    firmware = { min: values[0], max: values.at(-1) };
  }
  const unique = key => [...new Set(matches.map(record => record[key]).filter(Boolean))];
  const models = unique('model'), families = unique('console_family'), periods = unique('production_period');
  return {
    ...unknown, status: matches.every(record => record.status === 'UNKNOWN') ? 'UNKNOWN' : 'ESTIMATED', console_family: families.length === 1 ? families[0] : unknown.console_family,
    model: enteredModel || (models.length === 1 ? models[0] : 'Multiple reference models'),
    serial_prefix: matches[0].serial_prefix,
    production_period: production_date ? `${production_date.slice(5)}.${production_date.slice(0,4)} (box input)` : periods.join(' / ') || 'Unknown',
    firmware, confidence: firmware ? `Limited — ${matches.length} matching reference${matches.length === 1 ? '' : 's'}` : 'Low — firmware pending verification',
    references: matches.filter(record => record.candidate_type === 'unit').map(record => record.id),
    verification_pending: matches.some(record => record.verification_pending) || !firmware,
    source: unique('source_name').join('; ') || 'Sourced serial rule',
    rule_sources: matches.filter(record => record.candidate_type === 'rule').map(record => ({ name: record.source_name, url: record.source_url, date: record.source_date })),
    firmware_basis: unique('firmware_basis').join(' / '),
    note: firmware ? 'Prefix match only. The reference firmware was observed on another unit; your console’s original firmware is not confirmed.' : 'A matching reference exists, but its original firmware is not verified. No firmware value is inferred.'
  };
}
