import { describe, expect, it } from 'vitest';
import getId, { baseId } from './getId';

describe('getId', () => {
    it('returns base ID with no argument', () => {
        expect(getId()).toBe(baseId);
    });

    it('returns base ID when called with undefined', () => {
        expect(getId(undefined)).toBe(baseId);
    });

    it('returns namespaced ID with argument', () => {
        expect(getId('myTool')).toBe(`${baseId}/myTool`);
    });

    it('handles nested paths', () => {
        expect(getId('tool/sub')).toBe(`${baseId}/tool/sub`);
    });
});
