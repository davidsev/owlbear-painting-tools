// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../Metadata/DrawingToolMetadata', () => ({
    drawingToolMetadata: {
        get: vi.fn(),
    },
}));

import { drawingToolMetadata } from '../Metadata/DrawingToolMetadata';
import { settings } from './Settings';

beforeEach(() => {
    localStorage.clear();
});

describe('Settings defaults', () => {
    it('returns default for autoMergeDrawing', () => {
        expect(settings.autoMergeDrawing).toBe('off');
    });

    it('returns default for autoMergeFog', () => {
        expect(settings.autoMergeFog).toBe('off');
    });

    it('returns default for borderMode', () => {
        expect(settings.borderMode).toBe('stroke');
    });

    it('returns default for borderColor', () => {
        expect(settings.borderColor).toBe('#000000');
    });

    it('returns default for borderWidth', () => {
        expect(settings.borderWidth).toBe(2);
    });

    it('returns default for borderStyle', () => {
        expect(settings.borderStyle).toBe('solid');
    });

    it('returns default for fillMode', () => {
        expect(settings.fillMode).toBe('fill');
    });

    it('returns default for fillColor', () => {
        expect(settings.fillColor).toBe('#000000');
    });

    it('returns default for innerLinesMode', () => {
        expect(settings.innerLinesMode).toBe('off');
    });

    it('returns default for innerLinesColor', () => {
        expect(settings.innerLinesColor).toBe('#000000');
    });

    it('returns default for innerLinesWidth', () => {
        expect(settings.innerLinesWidth).toBe(1);
    });

    it('returns default for innerLinesStyle', () => {
        expect(settings.innerLinesStyle).toBe('solid');
    });
});

describe('Settings getters with valid values', () => {
    it('reads enum values from localStorage', () => {
        localStorage.setItem('settings.autoMergeDrawing', 'on');
        expect(settings.autoMergeDrawing).toBe('on');
    });

    it('reads borderMode from localStorage', () => {
        localStorage.setItem('settings.borderMode', 'custom');
        expect(settings.borderMode).toBe('custom');
    });

    it('reads string values from localStorage', () => {
        localStorage.setItem('settings.borderColor', '#ff0000');
        expect(settings.borderColor).toBe('#ff0000');
    });

    it('reads number values from localStorage', () => {
        localStorage.setItem('settings.borderWidth', '5');
        expect(settings.borderWidth).toBe(5);
    });
});

describe('Settings getters with invalid values', () => {
    it('falls back to default for invalid enum', () => {
        localStorage.setItem('settings.borderMode', 'invalid');
        expect(settings.borderMode).toBe('stroke');
    });

    it('falls back to default for invalid number (NaN)', () => {
        localStorage.setItem('settings.borderWidth', 'abc');
        expect(settings.borderWidth).toBe(2);
    });

    it('falls back to default for number below min', () => {
        localStorage.setItem('settings.borderWidth', '0');
        expect(settings.borderWidth).toBe(2);
    });

    it('falls back to default for invalid line style', () => {
        localStorage.setItem('settings.borderStyle', 'wavy');
        expect(settings.borderStyle).toBe('solid');
    });

    it('falls back to default for number above max', () => {
        localStorage.setItem('settings.borderWidth', '99');
        expect(settings.borderWidth).toBe(2);
    });

    it('falls back to default for opacity above max', () => {
        localStorage.setItem('settings.borderOpacity', '5');
        expect(settings.borderOpacity).toBe(1);
    });
});

describe('Settings setters', () => {
    it('persists enum values to localStorage', () => {
        settings.autoMergeDrawing = 'on';
        expect(localStorage.getItem('settings.autoMergeDrawing')).toBe('on');
    });

    it('persists string values to localStorage', () => {
        settings.borderColor = '#ff0000';
        expect(localStorage.getItem('settings.borderColor')).toBe('#ff0000');
    });

    it('persists number values to localStorage', () => {
        settings.borderWidth = 5;
        expect(localStorage.getItem('settings.borderWidth')).toBe('5');
    });

    it('roundtrips enum values', () => {
        settings.fillMode = 'custom';
        expect(settings.fillMode).toBe('custom');
    });

    it('roundtrips number values', () => {
        settings.innerLinesWidth = 3;
        expect(settings.innerLinesWidth).toBe(3);
    });

    it('clamps borderWidth to min', () => {
        settings.borderWidth = 0;
        expect(settings.borderWidth).toBe(1);
    });

    it('clamps borderWidth to max', () => {
        settings.borderWidth = 99;
        expect(settings.borderWidth).toBe(10);
    });

    it('clamps innerLinesWidth to min', () => {
        settings.innerLinesWidth = -5;
        expect(settings.innerLinesWidth).toBe(1);
    });

    it('clamps innerLinesWidth to max', () => {
        settings.innerLinesWidth = 20;
        expect(settings.innerLinesWidth).toBe(10);
    });
});

describe('resolvedBorder', () => {
    it('returns null when mode is off', async () => {
        settings.borderMode = 'off';
        expect(await settings.resolvedBorder()).toBeNull();
    });

    it('returns OBR metadata when mode is stroke', async () => {
        settings.borderMode = 'stroke';
        vi.mocked(drawingToolMetadata.get).mockResolvedValue({
            strokeColor: '#ffffff',
            strokeWidth: 3,
            strokeOpacity: 0.8,
            strokeDash: [2, 2],
            fillColor: '#000000',
            fillOpacity: 0,
        });

        const result = await settings.resolvedBorder();
        expect(result).toEqual({
            strokeColor: '#ffffff',
            strokeWidth: 3,
            strokeOpacity: 0.8,
            strokeDash: [6, 6],
        });
    });

    it('returns custom values when mode is custom', async () => {
        settings.borderMode = 'custom';
        settings.borderColor = '#ff0000';
        settings.borderOpacity = 0.75;
        settings.borderWidth = 4;
        settings.borderStyle = 'dashed';

        const result = await settings.resolvedBorder();
        expect(result).toEqual({
            strokeColor: '#ff0000',
            strokeWidth: 4,
            strokeOpacity: 0.75,
            strokeDash: [20, 20],
        });
    });

    it('returns empty dash for solid style', async () => {
        settings.borderMode = 'custom';
        settings.borderStyle = 'solid';

        const result = await settings.resolvedBorder();
        expect(result?.strokeDash).toEqual([]);
    });
});

describe('resolvedFill', () => {
    it('returns null when mode is off', async () => {
        settings.fillMode = 'off';
        expect(await settings.resolvedFill()).toBeNull();
    });

    it('returns OBR metadata when mode is fill', async () => {
        settings.fillMode = 'fill';
        vi.mocked(drawingToolMetadata.get).mockResolvedValue({
            strokeColor: '#ffffff',
            strokeWidth: 2,
            strokeOpacity: 1,
            strokeDash: [],
            fillColor: '#1a6aff',
            fillOpacity: 0.5,
        });

        const result = await settings.resolvedFill();
        expect(result).toEqual({
            fillColor: '#1a6aff',
            fillOpacity: 0.5,
        });
    });

    it('returns custom values when mode is custom', async () => {
        settings.fillMode = 'custom';
        settings.fillColor = '#00ff00';
        settings.fillOpacity = 0.5;

        const result = await settings.resolvedFill();
        expect(result).toEqual({
            fillColor: '#00ff00',
            fillOpacity: 0.5,
        });
    });
});

describe('resolvedInnerLines', () => {
    it('returns null when mode is off', async () => {
        settings.innerLinesMode = 'off';
        expect(await settings.resolvedInnerLines()).toBeNull();
    });

    it('returns OBR metadata when mode is stroke', async () => {
        settings.innerLinesMode = 'stroke';
        vi.mocked(drawingToolMetadata.get).mockResolvedValue({
            strokeColor: '#aaaaaa',
            strokeWidth: 1,
            strokeOpacity: 0.5,
            strokeDash: [1, 1],
            fillColor: '#000000',
            fillOpacity: 0,
        });

        const result = await settings.resolvedInnerLines();
        expect(result).toEqual({
            strokeColor: '#aaaaaa',
            strokeWidth: 1,
            strokeOpacity: 0.5,
            strokeDash: [1, 1],
        });
    });

    it('returns custom values when mode is custom', async () => {
        settings.innerLinesMode = 'custom';
        settings.innerLinesColor = '#0000ff';
        settings.innerLinesOpacity = 0.3;
        settings.innerLinesWidth = 2;
        settings.innerLinesStyle = 'dashed';

        const result = await settings.resolvedInnerLines();
        expect(result).toEqual({
            strokeColor: '#0000ff',
            strokeWidth: 2,
            strokeOpacity: 0.3,
            strokeDash: [10, 10],
        });
    });
});
