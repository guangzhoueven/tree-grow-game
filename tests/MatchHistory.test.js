import test from 'node:test';
import assert from 'node:assert/strict';
import { MatchHistory } from '../js/game/MatchHistory.js';
const snapshot = n => ({ gameState: { marker: n }, matchTracker: { turns: n }, lastMatchResult: null });
test('undoing own latest action preserves earlier actions and restores its before-state', () => {
 const h=MatchHistory.start(snapshot(0));
 for(const [side,n] of [['red',1],['blue',2],['red',3]]) h.recordAction({side,action:{type:'growth',owner:side,nodeId:n},beforeSnapshot:snapshot(n-1),afterSnapshot:snapshot(n),completedAt:n});
 const r=h.undoLatestAction('red'); assert.equal(r.snapshot.gameState.marker,2); assert.deepEqual(r.removedActionIds,[3]); assert.equal(h.actionCount,2);
});
test('undoing an earlier action removes every later action from both sides', () => {
 const h=MatchHistory.start(snapshot(0));
 for(const [side,n] of [['red',1],['blue',2],['blue',3]]) h.recordAction({side,action:{type:'growth',owner:side},beforeSnapshot:snapshot(n-1),afterSnapshot:snapshot(n),completedAt:n});
 const r=h.undoLatestAction('red'); assert.equal(r.snapshot.gameState.marker,0); assert.deepEqual(r.removedActionIds,[1,2,3]); assert.equal(h.actionCount,0);
});
test('action ids are not reused after truncation and history round-trips', () => {
 const h=MatchHistory.start(snapshot(0)); h.recordAction({side:'red',action:{owner:'red'},beforeSnapshot:snapshot(0),afterSnapshot:snapshot(1),completedAt:1}); h.undoLatestAction('red');
 h.recordAction({side:'red',action:{owner:'red'},beforeSnapshot:snapshot(0),afterSnapshot:snapshot(2),completedAt:2});
 assert.equal(h.actions[0].id,2); assert.deepEqual(MatchHistory.fromJSON(h.toJSON()).toJSON(),h.toJSON());
});
test('rejects malformed history data', () => { assert.throws(()=>MatchHistory.start({gameState:null})); const h=MatchHistory.start(snapshot(0));
 assert.throws(()=>h.recordAction({side:'red',action:{owner:'blue'},beforeSnapshot:snapshot(0),afterSnapshot:snapshot(1)})); });

test('skip events remain in the record but are never undo targets', () => {
 const h=MatchHistory.start(snapshot(0));
 h.recordAction({side:'red',action:{type:'growth',owner:'red'},beforeSnapshot:snapshot(0),afterSnapshot:snapshot(1),completedAt:1});
 h.recordAction({side:'blue',action:{type:'skip',owner:'blue'},beforeSnapshot:snapshot(1),afterSnapshot:snapshot(2),completedAt:2});
 assert.equal(h.canUndo('blue'),false);
 const r=h.undoLatestAction('red');
 assert.equal(r.snapshot.gameState.marker,0);
 assert.deepEqual(r.removedActionIds,[1,2]);
 assert.equal(h.actionCount,0);
});
