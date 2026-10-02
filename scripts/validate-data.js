import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateData } from '../js/data-validation.js';
const root = resolve(import.meta.dirname,'..');
const load = async name => JSON.parse(await readFile(resolve(root,`data/${name}.json`),'utf8'));
const [consoles,rules,firmware,sources] = await Promise.all(['verified-consoles','serial-rules','firmware-ranges','sources'].map(load));
validateData({consoles,rules,firmware,sources});
for (const record of consoles.records) for (const proof of record.proof) await access(resolve(root,proof.file));
console.log(`Validated ${consoles.records.length} unit records, ${rules.rules.length} serial rules and ${firmware.ranges.length} exploit ranges. Privacy and source checks passed.`);
