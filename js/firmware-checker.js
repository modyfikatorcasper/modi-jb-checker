// Version components are integers, never floating-point numbers (11.20 > 11.02).
export function compareVersions(a, b) {
  const parse = value => {
    if (typeof value !== 'string' || !/^\d{1,2}\.\d{2}$/.test(value)) throw new Error('Invalid firmware version. Use NN.NN.');
    return value.split('.').map(Number);
  };
  const left = parse(a), right = parse(b);
  return Math.sign(left[0] - right[0] || left[1] - right[1]);
}

function bounds(entry) {
  return { min: entry.firmware ?? entry.firmware_min, max: entry.firmware ?? entry.firmware_max };
}

export function checkFirmware(firmware, database, { confirmed = false } = {}) {
  const base = { status: 'unknown', label: 'Unknown', exploit_names: [], sources: [], last_updated: database.last_updated, notes: 'The original firmware is not known.' };
  if (!firmware) return base;
  const value = typeof firmware === 'string' ? { min: firmware, max: firmware } : firmware;
  if (!value.min || !value.max || compareVersions(value.min, value.max) > 0) return base;
  const entries = database.ranges.filter(entry => entry.public === true && entry.status === 'compatible' && (entry.firmware || (entry.firmware_min && entry.firmware_max)));
  const overlap = entries.filter(entry => {
    const span = bounds(entry);
    return compareVersions(value.max, span.min) >= 0 && compareVersions(value.min, span.max) <= 0;
  });
  if (!overlap.length) return { ...base, status: 'not_known', label: 'Not currently known to be compatible', notes: 'No matching public support in this curated database. This is not proof that no exploit exists.' };
  // Merge intervals: overlapping rules must not leave holes inside an estimated range.
  const sorted = overlap.map(bounds).sort((a,b) => compareVersions(a.min,b.min));
  let coveredUntil = value.min, covered = false;
  for (const span of sorted) {
    if (compareVersions(span.min, coveredUntil) > 0) break;
    if (compareVersions(span.max, coveredUntil) > 0) coveredUntil = span.max;
    if (compareVersions(coveredUntil, value.max) >= 0) { covered = true; break; }
  }
  const exact = value.min === value.max;
  return {
    status: covered && exact && confirmed ? 'compatible' : 'possible',
    label: covered && exact && confirmed ? 'Compatible with documented public exploit range' : 'Possibly compatible',
    exploit_names: [...new Set(overlap.map(entry => entry.exploit_name))],
    sources: overlap.map(entry => ({ name: entry.source_name, url: entry.source_url ?? entry.source, last_updated: entry.last_updated })),
    last_updated: database.last_updated,
    notes: covered ? (confirmed && exact ? 'Documented firmware support; unit-specific success and payload support are not guaranteed.' : 'The expected firmware falls in documented support, but your console’s firmware is unverified.') : 'Only part of the estimated firmware range overlaps documented support.'
  };
}
