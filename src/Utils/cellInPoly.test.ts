import type { Cell, Point } from '@davidsev/owlbear-utils';
import { describe, expect, it } from 'vitest';
import { cellInPoly, cellInPolys, pointInPoly } from './cellInPoly';

// Partial mocks — only the properties used by pointInPoly/cellInPoly
function point(x: number, y: number): Point {
    return { x, y } as Point;
}

function cell(cx: number, cy: number, size: number): Cell {
    const half = size / 2;
    return {
        corners: [
            point(cx - half, cy - half),
            point(cx + half, cy - half),
            point(cx + half, cy + half),
            point(cx - half, cy + half),
        ],
        containsPoint(p: Point) {
            return p.x >= cx - half && p.x <= cx + half && p.y >= cy - half && p.y <= cy + half;
        },
    } as Cell;
}

describe('pointInPoly', () => {
    const square = [point(0, 0), point(10, 0), point(10, 10), point(0, 10)];

    it('detects point inside polygon', () => {
        expect(pointInPoly(point(5, 5), square)).toBe(true);
    });

    it('detects point outside polygon', () => {
        expect(pointInPoly(point(15, 5), square)).toBe(false);
    });

    it('works with a triangle', () => {
        const triangle = [point(0, 0), point(10, 0), point(5, 10)];
        expect(pointInPoly(point(5, 3), triangle)).toBe(true);
        expect(pointInPoly(point(0, 10), triangle)).toBe(false);
    });

    it('returns false for empty polygon', () => {
        expect(pointInPoly(point(5, 5), [])).toBe(false);
    });
});

describe('cellInPoly', () => {
    const square = [point(0, 0), point(20, 0), point(20, 20), point(0, 20)];

    it('detects cell fully inside polygon', () => {
        const c = cell(10, 10, 4);
        expect(cellInPoly(c, square)).toBe(true);
    });

    it('detects cell fully outside polygon', () => {
        const c = cell(30, 30, 4);
        expect(cellInPoly(c, square)).toBe(false);
    });

    it('detects cell overlapping polygon edge (corner inside)', () => {
        // Cell centered at (19, 10) with size 4: right corners at x=21, outside polygon
        // but left corners at x=17, inside polygon
        const c = cell(19, 10, 4);
        expect(cellInPoly(c, square)).toBe(true);
    });

    it('detects polygon vertex inside cell', () => {
        // Cell centered at polygon vertex (0, 0) - the polygon vertex is inside the cell
        const c = cell(0, 0, 4);
        expect(cellInPoly(c, square)).toBe(true);
    });
});

describe('cellInPolys', () => {
    const poly1 = [point(0, 0), point(10, 0), point(10, 10), point(0, 10)];
    const poly2 = [point(20, 20), point(30, 20), point(30, 30), point(20, 30)];

    it('detects cell in one of multiple polygons', () => {
        const c = cell(25, 25, 2);
        expect(cellInPolys(c, [poly1, poly2])).toBe(true);
    });

    it('returns false when cell is in none of the polygons', () => {
        const c = cell(15, 15, 2);
        expect(cellInPolys(c, [poly1, poly2])).toBe(false);
    });

    it('returns false for empty polygon array', () => {
        const c = cell(5, 5, 2);
        expect(cellInPolys(c, [])).toBe(false);
    });
});
