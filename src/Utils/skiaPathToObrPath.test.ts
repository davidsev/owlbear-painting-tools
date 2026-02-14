import { describe, expect, it, vi } from 'vitest';

// Mock the SDK to provide Command enum without triggering SDK initialization
vi.mock('@owlbear-rodeo/sdk', () => ({
    Command: {
        MOVE: 0,
        LINE: 1,
        QUAD: 2,
        CONIC: 3,
        CUBIC: 4,
        CLOSE: 5,
    },
}));

import { skiaPathToObrPath } from './skiaPathToObrPath';

describe('skiaPathToObrPath', () => {
    it('parses MOVE command', () => {
        const cmds = new Float32Array([0, 10, 20]); // MOVE, x, y
        const result = skiaPathToObrPath(cmds);
        expect(result).toEqual([[0, 10, 20]]);
    });

    it('parses LINE command', () => {
        const cmds = new Float32Array([1, 30, 40]); // LINE, x, y
        const result = skiaPathToObrPath(cmds);
        expect(result).toEqual([[1, 30, 40]]);
    });

    it('parses QUAD command', () => {
        const cmds = new Float32Array([2, 1, 2, 3, 4]); // QUAD, cx, cy, x, y
        const result = skiaPathToObrPath(cmds);
        expect(result).toEqual([[2, 1, 2, 3, 4]]);
    });

    it('parses CONIC command', () => {
        const cmds = new Float32Array([3, 1, 2, 3, 4, 0.5]); // CONIC, cx, cy, x, y, w
        const result = skiaPathToObrPath(cmds);
        expect(result).toEqual([[3, 1, 2, 3, 4, 0.5]]);
    });

    it('parses CUBIC command', () => {
        const cmds = new Float32Array([4, 1, 2, 3, 4, 5, 6]); // CUBIC, c1x, c1y, c2x, c2y, x, y
        const result = skiaPathToObrPath(cmds);
        expect(result).toEqual([[4, 1, 2, 3, 4, 5, 6]]);
    });

    it('parses CLOSE command', () => {
        const cmds = new Float32Array([5]); // CLOSE
        const result = skiaPathToObrPath(cmds);
        expect(result).toEqual([[5]]);
    });

    it('parses multi-command path', () => {
        const cmds = new Float32Array([
            0, 10, 20,     // MOVE to (10, 20)
            1, 30, 40,     // LINE to (30, 40)
            1, 50, 60,     // LINE to (50, 60)
            5,             // CLOSE
        ]);
        const result = skiaPathToObrPath(cmds);
        expect(result).toEqual([
            [0, 10, 20],
            [1, 30, 40],
            [1, 50, 60],
            [5],
        ]);
    });

    it('returns empty array for empty input', () => {
        const cmds = new Float32Array([]);
        const result = skiaPathToObrPath(cmds);
        expect(result).toEqual([]);
    });

    it('throws on unknown command', () => {
        const cmds = new Float32Array([99]);
        expect(() => skiaPathToObrPath(cmds)).toThrow('Unknown skPath command: 99');
    });
});
