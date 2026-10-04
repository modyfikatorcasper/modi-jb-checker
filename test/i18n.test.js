import test from 'node:test';
import assert from 'node:assert/strict';
import { translate, setLanguage, getLanguage } from '../js/i18n.js';

test('switching PL and EN preserves firmware, model identifiers and record status semantics', () => {
  setLanguage('pl');
  assert.equal(getLanguage(),'pl');
  assert.equal(translate('CONFIRMED'),'POTWIERDZONE');
  assert.equal(translate('ESTIMATED'),'SZACOWANE');
  for (const value of ['11.40','CFI-7121 B01Y','S01-F258…']) assert.equal(translate(value),value);
  setLanguage('en');
  assert.equal(translate('CONFIRMED'),'CONFIRMED');
  setLanguage('unsupported');
  assert.equal(getLanguage(),'en');
});
test('Polish dynamic result copy includes counts, dates, sources and reference labels', () => {
  assert.equal(translate('3 of 3 records · Prefixes only','pl'),'3 z 3 wpisów · Tylko prefiksy');
  assert.equal(translate('Limited — 1 matching reference','pl'),'Ograniczona — liczba pasujących wpisów: 1');
  assert.equal(translate('Limited — 2 matching references','pl'),'Ograniczona — liczba pasujących wpisów: 2');
  assert.match(translate('Reference unit: CONFIRMED · Modi Diagnostic Lab / Modyfikator89','pl'),/^Sztuka referencyjna: POTWIERDZONE/);
  assert.match(translate('S01-F258… · prefix match found','pl'),/znaleziono dopasowanie/);
  assert.equal(translate('05.2026 (box input)','pl'),'05.2026 (dane z pudełka)');
  assert.match(translate('Relapse · documentation reviewed 2026-10-02','pl'),/dokumentacja sprawdzona 2026-10-02/);
});
test('Polish errors and evidence retain uncertainty rather than promoting visitor matches', () => {
  assert.equal(translate('Possibly compatible','pl'),'Możliwa zgodność');
  assert.match(translate('Enter a serial number or a prefix from the box label.','pl'),/^Wpisz numer seryjny/);
  assert.match(translate('Prefix match only. The reference firmware was observed on another unit; your console’s original firmware is not confirmed.','pl'),/nie jest potwierdzony/);
  assert.match(translate('Owner-supplied confirmation on 2026-10-02; original publication URL and proof photos were not supplied or independently reviewed.','pl'),/nie dostarczono ani nie zweryfikowano niezależnie/);
});
