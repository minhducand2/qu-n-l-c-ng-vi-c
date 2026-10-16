import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../lib/password-core.ts';

const password = 'Correct-Horse-Battery-2026!';
const first = await hashPassword(password);
const second = await hashPassword(password);
assert.notEqual(first, second, 'Unique salt required');
assert.equal(await verifyPassword(password, first), true);
assert.equal(await verifyPassword('not-the-correct-password', first), false);
assert.equal(await verifyPassword(password, 'invalid-hash'), false);
await assert.rejects(() => hashPassword('short'));
console.log('PASS: Password hashing / verification / random salts / invalid input');
