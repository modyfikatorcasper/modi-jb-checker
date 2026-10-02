import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { decodeSerial, parseSerial } from '../js/serial-decoder.js';
import { checkFirmware, compareVersions } from '../js/firmware-checker.js';
import { validateData } from '../js/data-validation.js';
const load = async name => JSON.parse(await readFile(new URL(`../data/${name}.json`,import.meta.url),'utf8'));
const [consoles,rules,firmware,sources] = await Promise.all(['verified-consoles','serial-rules','firmware-ranges','sources'].map(load));
const decode = (serial,extra = {},records = consoles.records) => decodeSerial({serial,...extra},records,rules);

test('all initial records validate without full serials or MAC addresses', () => {
  assert.equal(validateData({consoles,rules,firmware,sources}),true);
  assert.equal(consoles.records.length,3);
  assert.equal(consoles.records.filter(record=>record.status === 'CONFIRMED').length,3);
});
test('known Slim firmware remains an estimate for the entered serial', () => {
  const result = decode('S01-F556');
  assert.equal(result.status,'ESTIMATED'); assert.equal(result.model,'CFI-2116 B01Y');
  assert.deepEqual(result.firmware,{min:'11.20',max:'11.20'});
  assert.equal(checkFirmware(result.firmware,firmware).status,'possible');
});
test('Wolverine prefix produces 13.20, preserves first-observed caveat and no unit confirmation', () => {
  const result = decode(' s01-v565… ');
  assert.equal(result.status,'ESTIMATED'); assert.equal(result.firmware.min,'13.20');
  assert.equal(result.production_period,'05.2026'); assert.equal(result.firmware_basis,'factory_or_first_observed');
  const unit = consoles.records.find(record => record.featured);
  assert.equal(unit.status,'CONFIRMED'); assert.equal(unit.system_software,'26.03-13.20.00.06-00.00.00.0.1');
  assert.equal(checkFirmware(unit.firmware,firmware,{confirmed:true}).status,'compatible');
});
test('confirmed Pro at 11.40 keeps visitor matches estimated and production date unknown', () => {
  const result = decode('S01-F258');
  assert.equal(result.status,'ESTIMATED'); assert.deepEqual(result.firmware,{min:'11.40',max:'11.40'});
  assert.equal(result.production_period,'2025'); assert.equal(result.verification_pending,false);
  assert.equal(checkFirmware(result.firmware,firmware).status,'possible');
  const unit = consoles.records.find(record=>record.id === 'modi-pro-2025');
  assert.equal(unit.status,'CONFIRMED'); assert.equal(unit.firmware_basis,'factory');
  assert.equal(unit.production_date,null); assert.equal(unit.printed_production_date_present,false);
  assert.equal(checkFirmware(unit.firmware,firmware,{confirmed:true}).status,'compatible');
});
test('pending Pro can be confirmed by a data-only edit', () => {
  const records = structuredClone(consoles.records), pro = records.find(record=>record.id === 'modi-pro-2025');
  Object.assign(pro,{firmware:null,status:'ESTIMATED',verification_pending:true,firmware_basis:'unverified',verified_by:null});
  assert.equal(decode('S01-F258',{},records).firmware,null);
  Object.assign(pro,{firmware:'11.40',status:'CONFIRMED',verification_pending:false,firmware_basis:'factory',verified_by:'Modi Diagnostic Lab / Modyfikator89'});
  assert.equal(validateData({consoles:{...consoles,records},rules,firmware,sources}),true);
  assert.equal(decode('S01-F258',{},records).firmware.min,'11.40');
});
test('invalid, empty, markup and oversized serial input reject without echoing input', () => {
  for (const input of ['', 'garbage','CFI-2116','S01-V56','<script>alert(1)</script>','S01-V565'+'1'.repeat(40)]) {
    const result = decode(input); assert.equal(result.valid,false);
    if (input.length > 8) assert.equal(result.error.includes(input),false);
  }
});
test('unknown serials stay unknown, even when model and production date are supplied', () => {
  const result = decode('S01-X999',{model:'CFI-2116 BZJY',production_date:'2026-05'});
  assert.equal(result.status,'UNKNOWN'); assert.equal(result.firmware,null);
  assert.equal(result.console_family,'PS5 Slim');
});
test('full serial is never included in decoder output', () => {
  const synthetic = 'S01-V565'+'1234567890';
  assert.equal(parseSerial(synthetic).valid,true);
  assert.equal(JSON.stringify(decode(synthetic)).includes(synthetic),false);
  assert.equal(decode(synthetic).serial_prefix,'S01-V565');
});
test('model and production conflicts suppress firmware estimates', () => {
  for (const extra of [{model:'CFI-7121'},{model:'CFI-2116 B01Y'},{production_date:'2025-06'}]) {
    const result = decode('S01-V565',extra); assert.equal(result.status,'UNKNOWN'); assert.equal(result.firmware,null); assert.match(result.note,/conflicts/);
  }
});
test('optional fields are not needed and base or short model labels work', () => {
  assert.equal(decode('S01-V565').valid,true);
  for (const model of ['CFI2116','CFI-2116','CFI-2116B','CFI-2116 BZJY']) assert.equal(decode('S01-V565',{model}).firmware.min,'13.20');
  assert.equal(decode('S01-V565',{production_date:'2026-05'}).firmware.min,'13.20');
  assert.equal(decode('S01-V565',{production_date:'2026-13'}).valid,false);
});
test('contradictory verified samples create a range rather than cherry-picking', () => {
  const duplicate = {...consoles.records[2],id:'additional-unit',firmware:'13.40'};
  const result = decode('S01-V565',{},[...consoles.records,duplicate]);
  assert.deepEqual(result.firmware,{min:'13.20',max:'13.40'});
  assert.equal(result.status,'ESTIMATED');
});
test('version comparisons and range endpoints are correct', () => {
  assert.equal(compareVersions('11.20','11.02'),1);
  for (const value of ['7.00','11.20','11.40','13.20','13.60']) assert.equal(checkFirmware(value,firmware,{confirmed:true}).status,'compatible');
  assert.equal(checkFirmware('13.61',firmware,{confirmed:true}).status,'not_known');
  assert.equal(checkFirmware('6.99',firmware).status,'not_known');
});
test('partial coverage, gaps and private exploit records do not promise compatibility', () => {
  assert.equal(checkFirmware({min:'13.20',max:'14.00'},firmware).status,'possible');
  assert.equal(checkFirmware('13.20',{...firmware,ranges:firmware.ranges.map(entry=>({...entry,public:false}))},{confirmed:true}).status,'not_known');
  const gap = {last_updated:'2026-10-02',ranges:[{...firmware.ranges[0],firmware_min:'11.00',firmware_max:'11.20'},{...firmware.ranges[0],firmware_min:'13.00',firmware_max:'13.60'}]};
  assert.match(checkFirmware({min:'11.00',max:'13.20'},gap).notes,/Only part/);
});
test('exact firmware JSON rules work without application changes', () => {
  const exact = {...firmware,ranges:[{...firmware.ranges[0],firmware:'13.20',firmware_min:undefined,firmware_max:undefined}]};
  assert.equal(checkFirmware('13.20',exact,{confirmed:true}).status,'compatible');
  assert.equal(checkFirmware('13.40',exact).status,'not_known');
});
test('public data rejects accidental full serials, false confirmation and unsourced rules', () => {
  const mutated = structuredClone(consoles); mutated.records[0].serial_prefix += '1234';
  assert.throws(()=>validateData({consoles:mutated,rules,firmware,sources}),/prefix/);
  const privateData = structuredClone(consoles); privateData.records[0].mac_address='00:11:22:33:44:55';
  assert.throws(()=>validateData({consoles:privateData,rules,firmware,sources}),/MAC|Private/);
  const bad = structuredClone(consoles); bad.records[1].firmware=null;
  assert.throws(()=>validateData({consoles:bad,rules,firmware,sources}),/Confirmed/);
});
