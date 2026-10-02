import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeSerial } from '../js/serial-decoder.js';
const rule = {id:'test-batch',serial_prefix:'S01-X9',status:'ESTIMATED',console_family:'PS5 Slim',model:'CFI-2116',production_period:'2026',production_from:'2026-05',production_to:'2026-07',firmware_min:'13.00',firmware_max:'13.40',source_name:'Synthetic test source'};
test('editable batch rules support production intervals and firmware ranges', () => {
  const result = decodeSerial({serial:'S01-X999'},[],{model_rules:[],rules:[rule]});
  assert.deepEqual(result.firmware,{min:'13.00',max:'13.40'}); assert.equal(result.status,'ESTIMATED');
  const rejected = decodeSerial({serial:'S01-X999',production_date:'2026-02'},[],{model_rules:[],rules:[rule]});
  assert.equal(rejected.status,'UNKNOWN'); assert.equal(rejected.firmware,null);
  const accepted = decodeSerial({serial:'S01-X999',production_date:'2026-06'},[],{model_rules:[],rules:[rule]});
  assert.equal(accepted.status,'ESTIMATED');
});
test('longest prefix wins and unknown rules cannot infer firmware', () => {
  const specific = {...rule,id:'specific',serial_prefix:'S01-X999',firmware:'13.20'};
  const result = decodeSerial({serial:'S01-X999'},[],{model_rules:[],rules:[rule,specific]});
  assert.deepEqual(result.firmware,{min:'13.20',max:'13.20'});
  const unknown = decodeSerial({serial:'S01-X999'},[],{model_rules:[],rules:[{...specific,status:'UNKNOWN'}]});
  assert.equal(unknown.firmware,null);
  assert.equal(unknown.status,'UNKNOWN');
});
