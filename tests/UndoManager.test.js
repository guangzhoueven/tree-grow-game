import test from 'node:test';
import assert from 'node:assert/strict';
import { UndoManager } from '../js/game/UndoManager.js';
const historyFor=(...sides)=>({canUndo:side=>sides.includes(side)});
test('PVP sides have independent three-use limits and cooldowns',()=>{
 const m=new UndoManager(),h=historyFor('red','blue');
 assert.equal(m.canUndo('red',{history:h}),true);m.consumeUndo('red');
 assert.equal(m.canUndo('red',{history:h}),false);assert.equal(m.canUndo('blue',{history:h}),true);
 m.onActionCompleted('blue');assert.equal(m.canUndo('red',{history:h}),false);m.onActionCompleted('red');
 for(let i=0;i<2;i++){assert.equal(m.canUndo('red',{history:h}),true);m.consumeUndo('red');m.onActionCompleted('red');}
 assert.equal(m.canUndo('red',{history:h}),false);assert.equal(m.getState('red').remaining,0);
});
test('PVE only allows the configured human side',()=>{const m=new UndoManager({mode:'pve',playerSide:'blue'}),h=historyFor('red','blue');assert.equal(m.canUndo('red',{history:h}),false);assert.equal(m.canUndo('blue',{history:h}),true);});
test('blocks undo during animation, AI thinking, pause, and setup',()=>{const m=new UndoManager(),h=historyFor('red');for(const s of [{isAnimating:true},{isAIThinking:true},{isPaused:true},{gamePhase:'selectBlue'}])assert.equal(m.canUndo('red',{history:h,...s}),false);});
test('opponent action does not clear cooldown but own completed action does',()=>{const m=new UndoManager(),h=historyFor('red');m.consumeUndo('red');m.onActionCompleted('blue');assert.equal(m.canUndo('red',{history:h}),false);m.onActionCompleted('red');assert.equal(m.canUndo('red',{history:h}),true);});
test('undo metadata round-trips',()=>{const m=new UndoManager({mode:'pve',playerSide:'blue'});m.consumeUndo('blue');assert.deepEqual(UndoManager.fromJSON(m.toJSON()).getState('blue'),m.getState('blue'));});
