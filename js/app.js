import { decodeSerial } from './serial-decoder.js';
import { checkFirmware } from './firmware-checker.js';
import { validateData } from './data-validation.js';

const $ = id => document.getElementById(id);
let data, filter = 'ALL';
const node = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = String(text);
  return element;
};
const badge = status => node('span', `badge ${status.toLowerCase()}`, status);
const firmwareText = firmware => !firmware ? 'Unknown' : typeof firmware === 'string' ? firmware : firmware.min === firmware.max ? firmware.min : `${firmware.min} – ${firmware.max}`;
const sourceLink = (name, url) => {
  if (!url || !/^https:\/\//.test(url)) return node('span', '', name);
  const link = node('a', '', name);
  link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.referrerPolicy = 'no-referrer';
  return link;
};
const detailButton = record => {
  const button = node('button', 'text-button', record.proof?.length ? 'VIEW PROOF' : 'Details');
  button.type = 'button';
  button.setAttribute('aria-label', `${record.proof?.length ? 'View proof' : 'View details'} for ${record.model}`);
  button.addEventListener('click', () => openRecord(record));
  return button;
};
function metric(list, label, value, className = '') {
  const group = node('div');
  group.append(node('dt', '', label), node('dd', className, value));
  list.append(group);
}
function showError(message) {
  $('form-error').textContent = message;
  $('form-error').hidden = false;
  $('serial').setAttribute('aria-invalid','true');
  $('result').replaceChildren(node('p','error','No result generated. Correct the input and check again.'));
}
function runCheck() {
  if (!data) return;
  const result = decodeSerial({ serial: $('serial').value, model: $('model').value, production_date: $('production').value }, data.consoles.records, data.rules);
  if (!result.valid) { showError(result.error); return; }
  $('form-error').hidden = true;
  $('serial').removeAttribute('aria-invalid');
  const compatibility = checkFirmware(result.firmware, data.firmware);
  const fragment = document.createDocumentFragment();
  const top = node('div', 'result-top');
  top.append(node('h3', '', result.console_family), badge(result.status));
  fragment.append(top, node('p','result-sub',`${result.serial_prefix}… · prefix match ${result.references.length ? 'found' : 'unconfirmed'}`));
  const metrics = node('dl','result-metrics');
  metric(metrics, 'Model', result.model);
  metric(metrics, 'Production period', result.production_period);
  metric(metrics, result.firmware_basis?.includes('first_observed') ? 'Expected factory / first observed' : 'Expected factory firmware', firmwareText(result.firmware), 'firmware-value');
  metric(metrics, 'Confidence', result.confidence);
  fragment.append(metrics);
  const status = node('div',`compatibility ${compatibility.status === 'possible' || compatibility.status === 'compatible' ? '' : 'neutral'}`);
  status.append(node('p','',compatibility.label),node('p','hint',compatibility.exploit_names.length ? `${compatibility.exploit_names.join(', ')} · documentation reviewed ${compatibility.last_updated}` : compatibility.notes));
  fragment.append(status,node('p','result-note',result.note));
  if (result.verification_pending) fragment.append(node('p','hint','Original firmware: pending verification.'));
  fragment.append(node('p','hint',`Data source: ${result.source}`));
  for (const entry of result.rule_sources ?? []) { const p = node('p','hint','Rule: '); p.append(sourceLink(entry.name,entry.url)); fragment.append(p); }
  if (result.model_source) { const p = node('p','hint','Model source: '); p.append(sourceLink(result.model_source.source_name,result.model_source.source_url)); fragment.append(p); }
  for (const referenceId of result.references) {
    const reference = data.consoles.records.find(record => record.id === referenceId);
    if (!reference) continue;
    const line = node('p','hint',`Reference unit: ${reference.status}${reference.verification_pending ? ' / PENDING VERIFICATION' : ''} · ${reference.verified_by ?? reference.reported_by ?? 'Source record'}`);
    fragment.append(line, detailButton(reference));
  }
  $('result').replaceChildren(fragment);
  $('result-panel').setAttribute('aria-busy','false');
}

function renderDatabase() {
  const query = $('database-search').value.toLowerCase().trim();
  const records = data.consoles.records.filter(record => (filter === 'ALL' || record.status === filter) && [record.model,record.console_family,record.edition,record.production_period,record.serial_prefix,record.firmware,record.status,record.verified_by,record.reported_by].some(value => String(value ?? '').toLowerCase().includes(query)));
  const rows = records.map(record => {
    const row = node('tr');
    const model = node('td'); model.append(node('strong','',record.model),node('small','',`${record.console_family} · ${record.edition}`));
    row.append(model,node('td','mono',record.production_period ?? 'Unknown'),node('td','mono',`${record.serial_prefix}…`),node('td','mono',firmwareText(record.firmware ?? (record.firmware_min ? {min:record.firmware_min,max:record.firmware_max}:null))));
    const state = node('td'); state.append(badge(record.status));
    if (record.verification_pending) state.append(node('small','','Pending verification'));
    if (record.firmware_basis === 'factory_or_first_observed') state.append(node('small','','Factory / first observed'));
    const verifier = node('td'); verifier.append(node('span','',record.verified_by ?? 'Pending'));
    if (!record.verified_by && record.reported_by) verifier.append(node('small','',`Reported by ${record.reported_by}`));
    const actions = node('td'); actions.append(detailButton(record));
    row.append(state,verifier,actions); return row;
  });
  if (!rows.length) { const row = node('tr'), cell = node('td','muted','No records match these filters.'); cell.colSpan = 7; row.append(cell); rows.push(row); }
  $('database-body').replaceChildren(...rows);
  $('database-state').textContent = `${records.length} of ${data.consoles.records.length} records · Prefixes only`;
}

function renderFeatured() {
  const record = data.consoles.records.find(record => record.featured && record.status === 'CONFIRMED');
  if (!record) return;
  const text = node('div');
  text.append(node('p','eyebrow','NEW VERIFIED UNIT'),node('h2','',`${record.edition.replace(' Limited Edition','')} ${record.console_family}`),node('p','mono',`${record.model} · ${record.production_period} · ${record.motherboard}`),node('p','',`Verified by ${record.verified_by}`));
  const values = node('div','featured-data');
  const firmware = node('div','featured-firmware',firmwareText(record.firmware));
  firmware.append(node('small','','FACTORY / FIRST OBSERVED'));
  values.append(firmware,badge(record.status),detailButton(record));
  $('featured').replaceChildren(text,values); $('featured').hidden = false;
}

function openRecord(record) {
  const content = document.createDocumentFragment();
  const heading = node('h2','',record.console_family); heading.id = 'dialog-title';
  content.append(heading,node('p','muted',record.edition),badge(record.status));
  const metrics = node('dl','record-details');
  metric(metrics,'Model',record.model); metric(metrics,'Serial prefix',`${record.serial_prefix}…`);
  metric(metrics,'Production',record.production_period ?? 'Unknown');
  metric(metrics,'Printed production date',record.production_date ? record.production_date : record.printed_production_date_present === false ? 'Not present on box' : 'Unknown');
  metric(metrics,record.firmware_basis === 'factory_or_first_observed' ? 'Factory / first observed firmware' : 'Factory firmware',firmwareText(record.firmware), 'mono');
  metric(metrics,'Verification',record.verification_pending ? 'PENDING VERIFICATION' : record.confidence);
  metric(metrics,'Verified by',record.verified_by ?? 'Pending');
  if (record.motherboard) metric(metrics,'Motherboard',record.motherboard);
  if (record.manufacturing_country) metric(metrics,'Manufactured in',record.manufacturing_country);
  if (record.system_software) metric(metrics,'System software string',record.system_software,'mono');
  const compatibility = checkFirmware(record.firmware,data.firmware,{confirmed:record.status === 'CONFIRMED' && !record.verification_pending});
  metric(metrics,'Documented exploit support',compatibility.label);
  content.append(metrics,node('p','small',record.evidence),node('p','small muted',record.evidence_review));
  const source = node('p','small','Source: '); source.append(sourceLink(record.source_name,record.source_url)); content.append(source);
  for (const entry of compatibility.sources) { const p = node('p','small','Exploit source: '); p.append(sourceLink(entry.name,entry.url),document.createTextNode(` · Reviewed ${entry.last_updated}`)); content.append(p); }
  const proofs = node('div','proof-grid');
  for (const proof of record.proof ?? []) {
    // Keep evidence same-origin and in the dedicated sanitized public directory.
    if (!/^assets\/proof\/[A-Za-z0-9_/-]+\.(png|jpe?g|webp)$/i.test(proof.file) || proof.file.includes('..')) continue;
    const figure = node('figure'), image = node('img'); image.src = proof.file; image.alt = proof.caption ?? proof.type.replaceAll('_',' '); image.loading = 'lazy';
    const link = node('a','','Open sanitized proof'); link.href = proof.file; link.target = '_blank'; link.rel = 'noopener';
    image.addEventListener('error', () => { image.replaceWith(node('p','error','Proof file could not be loaded.')); }, {once:true});
    figure.append(image,node('figcaption','',proof.caption ?? proof.type.replaceAll('_',' ')),link); proofs.append(figure);
  }
  content.append(proofs);
  if (!record.proof?.length) content.append(node('p','small muted','Public proof not attached yet. No evidence image has been fabricated.'));
  content.append(node('p','dialog-note',record.notes));
  $('dialog-content').replaceChildren(content); $('record-dialog').showModal();
}

$('checker-form').addEventListener('submit', event => { event.preventDefault(); runCheck(); });
$('database-search').addEventListener('input', () => { if (data) renderDatabase(); });
$('filters').addEventListener('click', event => {
  const button = event.target.closest('[data-status]'); if (!button || !data) return;
  filter = button.dataset.status;
  for (const item of $('filters').querySelectorAll('button')) { item.classList.toggle('active',item === button); item.setAttribute('aria-pressed',String(item === button)); }
  renderDatabase();
});
$('close-dialog').addEventListener('click', () => $('record-dialog').close());
$('record-dialog').addEventListener('click', event => {
  if (event.target !== $('record-dialog')) return;
  const box = event.target.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) event.target.close();
});

async function load() {
  try {
    const files = ['verified-consoles','serial-rules','firmware-ranges','sources'];
    const [consoles,rules,firmware,sources] = await Promise.all(files.map(async file => {
      const response = await fetch(`data/${file}.json`,{credentials:'omit'});
      if (!response.ok) throw new Error('Data unavailable');
      return response.json();
    }));
    validateData({consoles,rules,firmware,sources});
    data = {consoles,rules,firmware,sources};
    $('check-button').disabled = false;
    $('record-count').textContent = consoles.records.length;
    renderDatabase(); renderFeatured();
    $('source-list').replaceChildren(...sources.sources.map(source => {
      const li = node('li'); li.append(sourceLink(source.source_name,source.source_url),node('p','small',`${source.notes} Reviewed ${source.source_date}.`)); return li;
    }));
    $('review-date').textContent = `Database and exploit documentation last reviewed: ${firmware.last_updated}. Updates require a reviewed JSON edit.`;
  } catch {
    $('database-state').textContent = 'Database could not be loaded. Reload the page or report an invalid data file.';
    $('form-error').textContent = 'Reference data is unavailable. Open this project through a web server, such as GitHub Pages, then reload.';
    $('form-error').hidden = false;
  }
}
load();
