import test from 'node:test';
import assert from 'node:assert/strict';
import { getAISide } from '../js/app/MatchSides.js';

test('AI side is opposite to the selected PVE player side', () => {
    assert.equal(getAISide('pve', 'red'), 'blue');
    assert.equal(getAISide('pve', 'blue'), 'red');
});

test('PVP has no AI side', () => {
    assert.equal(getAISide('pvp', 'red'), null);
});

test('invalid side configurations are rejected', () => {
    assert.throws(() => getAISide('pve', 'green'), TypeError);
    assert.throws(() => getAISide('coop', 'red'), TypeError);
});
