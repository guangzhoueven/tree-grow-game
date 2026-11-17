const SIDES = new Set(['red', 'blue']);

/** Return the computer-controlled side for a match, or null for local PVP. */
export function getAISide(mode, playerSide = 'red') {
    if (!['pvp', 'pve'].includes(mode) || !SIDES.has(playerSide)) {
        throw new TypeError('Invalid match sides');
    }
    if (mode === 'pvp') return null;
    return playerSide === 'red' ? 'blue' : 'red';
}
