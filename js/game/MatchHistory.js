const SIDES = ['red', 'blue'];
const copy = value => value == null ? value : JSON.parse(JSON.stringify(value));
function validSnapshot(value) {
    return !!value && typeof value === 'object' && value.gameState &&
        typeof value.gameState === 'object' &&
        (value.matchTracker === null || typeof value.matchTracker === 'object');
}
export class MatchHistory {
    constructor({ rulesetVersion = 1, historyIncomplete = false } = {}) {
        if (!Number.isInteger(rulesetVersion) || rulesetVersion < 1) throw new TypeError('规则版本无效');
        this.schemaVersion = 1; this.rulesetVersion = rulesetVersion;
        this.historyIncomplete = !!historyIncomplete; this.initialSnapshot = null;
        this.actions = []; this.nextActionId = 1;
    }
    static capture({ gameState, matchTracker = null, lastMatchResult = null }) {
        if (!gameState || typeof gameState !== 'object') throw new TypeError('历史快照需要有效的游戏状态');
        return copy({ gameState, matchTracker, lastMatchResult });
    }
    static start(snapshot, options = {}) {
        if (!validSnapshot(snapshot)) throw new TypeError('初始历史快照无效');
        const history = new MatchHistory(options); history.initialSnapshot = copy(snapshot); return history;
    }
    recordAction({ side, action, beforeSnapshot, afterSnapshot, completedAt = Date.now() }) {
        if (!SIDES.includes(side) || !action || action.owner !== side ||
            !validSnapshot(beforeSnapshot) || !validSnapshot(afterSnapshot) ||
            !Number.isFinite(completedAt) || !this.initialSnapshot) throw new TypeError('完整行动记录参数无效');
        const record = { id: this.nextActionId++, sequence: this.actions.length + 1, side,
            action: copy(action), before: copy(beforeSnapshot), after: copy(afterSnapshot), completedAt };
        this.actions.push(record); return copy(record);
    }
    findLastActionIndex(side) {
        if (!SIDES.includes(side)) return -1;
        for (let i = this.actions.length - 1; i >= 0; i--) {
            const action = this.actions[i];
            if (action.side === side && action.action.type !== 'skip') return i;
        }
        return -1;
    }
    canUndo(side) { return this.findLastActionIndex(side) >= 0; }
    undoLatestAction(side) {
        const index = this.findLastActionIndex(side); if (index < 0) return null;
        const target = this.actions[index], removedActions = this.actions.slice(index);
        this.actions.length = index;
        this.actions.forEach((action, i) => { action.sequence = i + 1; });
        return { snapshot: copy(target.before), targetAction: copy(target),
            removedActionIds: removedActions.map(action => action.id) };
    }
    get actionCount() { return this.actions.length; }
    toJSON() { return copy({ schemaVersion: this.schemaVersion, rulesetVersion: this.rulesetVersion,
        historyIncomplete: this.historyIncomplete, initialSnapshot: this.initialSnapshot,
        actions: this.actions, nextActionId: this.nextActionId }); }
    static fromJSON(data) {
        if (!data || data.schemaVersion !== 1 || !Number.isInteger(data.rulesetVersion) ||
            data.rulesetVersion < 1 || typeof data.historyIncomplete !== 'boolean' ||
            !validSnapshot(data.initialSnapshot) || !Array.isArray(data.actions) ||
            !Number.isInteger(data.nextActionId) || data.nextActionId < 1) throw new TypeError('棋谱数据无效');
        const history = new MatchHistory({ rulesetVersion: data.rulesetVersion, historyIncomplete: data.historyIncomplete });
        const ids = new Set(); let maxId = 0; history.initialSnapshot = copy(data.initialSnapshot);
        history.actions = data.actions.map((raw, index) => {
            if (!raw || !Number.isInteger(raw.id) || raw.id < 1 || ids.has(raw.id) ||
                raw.sequence !== index + 1 || !SIDES.includes(raw.side) || !raw.action ||
                raw.action.owner !== raw.side || !validSnapshot(raw.before) ||
                !validSnapshot(raw.after) || !Number.isFinite(raw.completedAt)) throw new TypeError('棋谱行动记录无效');
            ids.add(raw.id); maxId = Math.max(maxId, raw.id); return copy(raw);
        });
        if (data.nextActionId <= maxId) throw new TypeError('棋谱行动编号计数器无效');
        history.nextActionId = data.nextActionId; return history;
    }
}
