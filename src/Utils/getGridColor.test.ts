import { describe, expect, it } from 'vitest';
import { getGridColor } from './getGridColor';

describe('getGridColor', () => {
    it('maps LIGHT to white', () => {
        expect(getGridColor('LIGHT')).toBe('#FFFFFF');
    });

    it('maps DARK to black', () => {
        expect(getGridColor('DARK')).toBe('#000000');
    });

    it('maps HIGHLIGHT to orange', () => {
        expect(getGridColor('HIGHLIGHT')).toBe('#FA6400');
    });

    it('passes through unknown values', () => {
        expect(getGridColor('#FF0000')).toBe('#FF0000');
    });

    it('passes through arbitrary strings', () => {
        expect(getGridColor('custom')).toBe('custom');
    });
});
