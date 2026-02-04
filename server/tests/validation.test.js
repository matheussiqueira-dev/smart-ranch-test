import test from 'node:test';
import assert from 'node:assert/strict';
import { clamp, isValidBase64, normalizeBase64 } from '../src/utils/validation.js';

test('normalizeBase64 removes data prefix', () => {
  const raw = 'data:image/jpeg;base64,QUJDRA==';
  assert.equal(normalizeBase64(raw), 'QUJDRA==');
});

test('normalizeBase64 returns null for empty', () => {
  assert.equal(normalizeBase64(''), null);
});

test('isValidBase64 validates size and content', () => {
  assert.equal(isValidBase64('QUJDRA==', 10), true);
  assert.equal(isValidBase64('@@@', 10), false);
});

test('clamp respects bounds', () => {
  assert.equal(clamp(10, 0, 5), 5);
  assert.equal(clamp(-2, 0, 5), 0);
  assert.equal(clamp(3, 0, 5), 3);
});
