import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@owlbear-rodeo/sdk', () => ({
    default: {},
    buildPath: vi.fn(),
    isPath: vi.fn(),
}));

vi.mock('@davidsev/owlbear-utils', () => ({
    grid: {},
}));

vi.mock('../../Metadata/MergeItemMetadata', () => ({
    mergeItemMetadataMapper: {
        get: vi.fn(),
    },
}));

vi.mock('../../Settings/Settings', () => ({
    settings: {},
}));

vi.mock('../../Utils/awaitCanvasKit', () => ({ awaitCanvasKit: vi.fn() }));
vi.mock('../../Utils/cellsToPath', () => ({ addCellsToPath: vi.fn() }));
vi.mock('../../Utils/findTouchingPaths', () => ({ cascadingMerge: vi.fn() }));
vi.mock('../../Utils/getGridColor', () => ({ getGridColor: vi.fn() }));
vi.mock('../../Utils/getId', () => ({ default: vi.fn((s: string) => `test/${s}`) }));
vi.mock('../../Utils/obrPathToSkiaPath', () => ({ obrPathToSkiaPath: vi.fn() }));
vi.mock('../../Utils/sharedEdgesToPathCommands', () => ({ sharedEdgesToPathCommands: vi.fn() }));
vi.mock('../../Utils/skiaPathToObrPath', () => ({ skiaPathToObrPath: vi.fn() }));

import { mergeItemMetadataMapper } from '../../Metadata/MergeItemMetadata';
import type { FillStyle, StrokeStyle } from '../../Settings/Settings';
import { DrawingRenderer } from './DrawingRenderer';

// biome-ignore lint/suspicious/noExplicitAny: testing private methods
type Any = any;

function mockPath (id: string, opts: {
    attachedTo?: string;
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    strokeDash?: number[];
} = {}): Any {
    return {
        id,
        attachedTo: opts.attachedTo,
        style: {
            fillColor: opts.fillColor ?? '#000000',
            fillOpacity: opts.fillOpacity ?? 1,
            strokeColor: opts.strokeColor ?? '#000000',
            strokeWidth: opts.strokeWidth ?? 2,
            strokeOpacity: opts.strokeOpacity ?? 1,
            strokeDash: opts.strokeDash ?? [],
        },
    };
}

let renderer: Any;

beforeEach(() => {
    renderer = new DrawingRenderer();
    vi.mocked(mergeItemMetadataMapper.get).mockReset();
});

// ---------- strokeDashEquals ----------

describe('strokeDashEquals', () => {
    it('returns true for identical arrays', () => {
        expect(renderer.strokeDashEquals([5, 5], [5, 5])).toBe(true);
    });

    it('returns true for both empty', () => {
        expect(renderer.strokeDashEquals([], [])).toBe(true);
    });

    it('returns false for different lengths', () => {
        expect(renderer.strokeDashEquals([5], [5, 5])).toBe(false);
    });

    it('returns false for same length but different values', () => {
        expect(renderer.strokeDashEquals([5, 10], [5, 5])).toBe(false);
    });
});

// ---------- strokeStyleMatches ----------

describe('strokeStyleMatches', () => {
    const stroke: StrokeStyle = {
        strokeColor: '#ff0000',
        strokeWidth: 3,
        strokeOpacity: 0.8,
        strokeDash: [10, 10],
    };

    it('returns true when both absent', () => {
        expect(renderer.strokeStyleMatches(undefined, null)).toBe(true);
    });

    it('returns false when item present but expected absent', () => {
        const item = mockPath('a', { strokeColor: '#ff0000' });
        expect(renderer.strokeStyleMatches(item, null)).toBe(false);
    });

    it('returns false when item absent but expected present', () => {
        expect(renderer.strokeStyleMatches(undefined, stroke)).toBe(false);
    });

    it('returns true when all properties match', () => {
        const item = mockPath('a', {
            strokeColor: '#ff0000',
            strokeWidth: 3,
            strokeOpacity: 0.8,
            strokeDash: [10, 10],
        });
        expect(renderer.strokeStyleMatches(item, stroke)).toBe(true);
    });

    it('returns false when strokeColor differs', () => {
        const item = mockPath('a', {
            strokeColor: '#00ff00',
            strokeWidth: 3,
            strokeOpacity: 0.8,
            strokeDash: [10, 10],
        });
        expect(renderer.strokeStyleMatches(item, stroke)).toBe(false);
    });

    it('returns false when strokeWidth differs', () => {
        const item = mockPath('a', {
            strokeColor: '#ff0000',
            strokeWidth: 5,
            strokeOpacity: 0.8,
            strokeDash: [10, 10],
        });
        expect(renderer.strokeStyleMatches(item, stroke)).toBe(false);
    });

    it('returns false when strokeOpacity differs beyond epsilon', () => {
        const item = mockPath('a', {
            strokeColor: '#ff0000',
            strokeWidth: 3,
            strokeOpacity: 0.5,
            strokeDash: [10, 10],
        });
        expect(renderer.strokeStyleMatches(item, stroke)).toBe(false);
    });

    it('returns true when strokeOpacity differs within epsilon', () => {
        const item = mockPath('a', {
            strokeColor: '#ff0000',
            strokeWidth: 3,
            strokeOpacity: 0.805,
            strokeDash: [10, 10],
        });
        expect(renderer.strokeStyleMatches(item, stroke)).toBe(true);
    });

    it('returns false when strokeDash differs', () => {
        const item = mockPath('a', {
            strokeColor: '#ff0000',
            strokeWidth: 3,
            strokeOpacity: 0.8,
            strokeDash: [5, 5],
        });
        expect(renderer.strokeStyleMatches(item, stroke)).toBe(false);
    });
});

// ---------- findSiblingsByRole ----------

describe('findSiblingsByRole', () => {
    it('returns empty map for item with no attachments', () => {
        const fill = mockPath('fill');
        const itemMap = new Map([['fill', fill]]);
        const result = renderer.findSiblingsByRole(fill, itemMap);
        expect(result.size).toBe(0);
    });

    it('finds border sibling via attachment chain', () => {
        const border = mockPath('border', { attachedTo: 'fill' });
        const fill = mockPath('fill', { attachedTo: 'border' });
        const itemMap = new Map([['fill', fill], ['border', border]]);

        vi.mocked(mergeItemMetadataMapper.get).mockImplementation((item: Any) => {
            if (item.id === 'border') return { group: 'cells', role: 'border' };
            return { group: null, role: null };
        });

        const result = renderer.findSiblingsByRole(fill, itemMap);
        expect(result.get('border')).toBe(border);
    });

    it('finds border and innerLines siblings in a 3-item chain', () => {
        const fill = mockPath('fill', { attachedTo: 'inner' });
        const inner = mockPath('inner', { attachedTo: 'border' });
        const border = mockPath('border', { attachedTo: 'fill' });
        const itemMap = new Map([['fill', fill], ['inner', inner], ['border', border]]);

        vi.mocked(mergeItemMetadataMapper.get).mockImplementation((item: Any) => {
            if (item.id === 'inner') return { group: 'cells', role: 'innerLines' };
            if (item.id === 'border') return { group: 'cells', role: 'border' };
            return { group: null, role: null };
        });

        const result = renderer.findSiblingsByRole(fill, itemMap);
        expect(result.get('innerLines')).toBe(inner);
        expect(result.get('border')).toBe(border);
        expect(result.size).toBe(2);
    });

    it('stops when chain loops back to the fill item', () => {
        const fill = mockPath('fill', { attachedTo: 'border' });
        const border = mockPath('border', { attachedTo: 'fill' });
        const itemMap = new Map([['fill', fill], ['border', border]]);

        vi.mocked(mergeItemMetadataMapper.get).mockImplementation((item: Any) => {
            if (item.id === 'border') return { group: 'cells', role: 'border' };
            return { group: null, role: null };
        });

        const result = renderer.findSiblingsByRole(fill, itemMap);
        expect(result.size).toBe(1);
        expect(result.get('border')).toBe(border);
    });
});

// ---------- itemMatchesStyle ----------

describe('itemMatchesStyle', () => {
    const fill: FillStyle = { fillColor: '#ff0000', fillOpacity: 0.5 };
    const border: StrokeStyle = {
        strokeColor: '#000000',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeDash: [],
    };

    it('returns false when fill is null', () => {
        const item = mockPath('a', { fillColor: '#ff0000', fillOpacity: 0.5 });
        const itemMap = new Map([['a', item]]);
        expect(renderer.itemMatchesStyle(item, itemMap, null, null, null)).toBe(false);
    });

    it('returns true when fill matches and no border/innerLines', () => {
        const item = mockPath('a', { fillColor: '#ff0000', fillOpacity: 0.5 });
        const itemMap = new Map([['a', item]]);

        vi.mocked(mergeItemMetadataMapper.get).mockReturnValue({ group: null, role: null });

        expect(renderer.itemMatchesStyle(item, itemMap, fill, null, null)).toBe(true);
    });

    it('returns false when fill color differs', () => {
        const item = mockPath('a', { fillColor: '#00ff00', fillOpacity: 0.5 });
        const itemMap = new Map([['a', item]]);

        expect(renderer.itemMatchesStyle(item, itemMap, fill, null, null)).toBe(false);
    });

    it('returns false when fill opacity differs beyond epsilon', () => {
        const item = mockPath('a', { fillColor: '#ff0000', fillOpacity: 0.8 });
        const itemMap = new Map([['a', item]]);

        expect(renderer.itemMatchesStyle(item, itemMap, fill, null, null)).toBe(false);
    });

    it('returns true when fill opacity differs within epsilon', () => {
        const item = mockPath('a', { fillColor: '#ff0000', fillOpacity: 0.505 });
        const itemMap = new Map([['a', item]]);

        vi.mocked(mergeItemMetadataMapper.get).mockReturnValue({ group: null, role: null });

        expect(renderer.itemMatchesStyle(item, itemMap, fill, null, null)).toBe(true);
    });

    it('returns true when fill and border both match', () => {
        const fillItem = mockPath('fill', { fillColor: '#ff0000', fillOpacity: 0.5, attachedTo: 'border' });
        const borderItem = mockPath('border', {
            attachedTo: 'fill',
            strokeColor: '#000000',
            strokeWidth: 2,
            strokeOpacity: 1,
            strokeDash: [],
        });
        const itemMap = new Map([['fill', fillItem], ['border', borderItem]]);

        vi.mocked(mergeItemMetadataMapper.get).mockImplementation((item: Any) => {
            if (item.id === 'border') return { group: 'cells', role: 'border' };
            return { group: null, role: null };
        });

        expect(renderer.itemMatchesStyle(fillItem, itemMap, fill, border, null)).toBe(true);
    });

    it('returns false when border style differs', () => {
        const fillItem = mockPath('fill', { fillColor: '#ff0000', fillOpacity: 0.5, attachedTo: 'border' });
        const borderItem = mockPath('border', {
            attachedTo: 'fill',
            strokeColor: '#0000ff',
            strokeWidth: 2,
            strokeOpacity: 1,
            strokeDash: [],
        });
        const itemMap = new Map([['fill', fillItem], ['border', borderItem]]);

        vi.mocked(mergeItemMetadataMapper.get).mockImplementation((item: Any) => {
            if (item.id === 'border') return { group: 'cells', role: 'border' };
            return { group: null, role: null };
        });

        expect(renderer.itemMatchesStyle(fillItem, itemMap, fill, border, null)).toBe(false);
    });

    it('returns false when border expected but no border sibling exists', () => {
        const fillItem = mockPath('fill', { fillColor: '#ff0000', fillOpacity: 0.5 });
        const itemMap = new Map([['fill', fillItem]]);

        vi.mocked(mergeItemMetadataMapper.get).mockReturnValue({ group: null, role: null });

        expect(renderer.itemMatchesStyle(fillItem, itemMap, fill, border, null)).toBe(false);
    });

    it('returns false when no border expected but border sibling exists', () => {
        const fillItem = mockPath('fill', { fillColor: '#ff0000', fillOpacity: 0.5, attachedTo: 'border' });
        const borderItem = mockPath('border', {
            attachedTo: 'fill',
            strokeColor: '#000000',
            strokeWidth: 2,
            strokeOpacity: 1,
            strokeDash: [],
        });
        const itemMap = new Map([['fill', fillItem], ['border', borderItem]]);

        vi.mocked(mergeItemMetadataMapper.get).mockImplementation((item: Any) => {
            if (item.id === 'border') return { group: 'cells', role: 'border' };
            return { group: null, role: null };
        });

        expect(renderer.itemMatchesStyle(fillItem, itemMap, fill, null, null)).toBe(false);
    });
});
