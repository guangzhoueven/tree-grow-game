const SIDES = ['red', 'blue'];
const emptyState = () => ({ uses: 0, coolingDown: false });
export class UndoManager {
    constructor({ mode = 'pvp', playerSide = 'red', maxUses = 3 } = {}) {
        if (!['pvp', 'pve'].includes(mode) || !SIDES.includes(playerSide) ||
            !Number.isInteger(maxUses) || maxUses < 1) throw new TypeError('悔棋管理器配置无效');
        this.schemaVersion = 1; this.mode = mode; this.playerSide = playerSide;
        this.maxUses = maxUses; this.players = { red: emptyState(), blue: emptyState() };
    }
    getControlledSides() { return this.mode === 'pve' ? [this.playerSide] : [...SIDES]; }
    getState(side) {
        if (!SIDES.includes(side)) throw new TypeError('阵营无效');
        return { ...this.players[side], remaining: Math.max(0, this.maxUses - this.players[side].uses) };
    }
    canUndo(side, { history, gamePhase = 'playing', isAnimating = false, isAIThinking = false, isPaused = false } = {}) {
        if (!this.getControlledSides().includes(side) || gamePhase !== 'playing' ||
            isAnimating || isAIThinking || isPaused || !history?.canUndo(side)) return false;
        const state = this.players[side]; return state.uses < this.maxUses && !state.coolingDown;
    }
    consumeUndo(side) {
        if (!this.getControlledSides().includes(side)) throw new TypeError('该阵营不能使用悔棋');
        const state = this.players[side];
        if (state.uses >= this.maxUses || state.coolingDown) throw new Error('当前无法悔棋');
        state.uses++; state.coolingDown = true; return this.getState(side);
    }
    onActionCompleted(side) {
        if (!SIDES.includes(side)) throw new TypeError('行动方无效');
        if (this.players[side].coolingDown) this.players[side].coolingDown = false;
        return this.getState(side);
    }
    toJSON() { return JSON.parse(JSON.stringify({ schemaVersion: this.schemaVersion, mode: this.mode,
        playerSide: this.playerSide, maxUses: this.maxUses, players: this.players })); }
    static fromJSON(data) {
        if (!data || data.schemaVersion !== 1 || !['pvp', 'pve'].includes(data.mode) ||
            !SIDES.includes(data.playerSide) || !Number.isInteger(data.maxUses) ||
            data.maxUses < 1 || !data.players) throw new TypeError('悔棋状态存档无效');
        const manager = new UndoManager(data);
        for (const side of SIDES) {
            const state = data.players[side];
            if (!state || !Number.isInteger(state.uses) || state.uses < 0 ||
                state.uses > data.maxUses || typeof state.coolingDown !== 'boolean') throw new TypeError('悔棋次数或冷却状态无效');
            manager.players[side] = { uses: state.uses, coolingDown: state.coolingDown };
        }
        return manager;
    }
}
