import type { Point } from '@davidsev/owlbear-utils';
import { describe, expect, it } from 'vitest';
import { fillGapsInPath } from './fillGapsInPath';

// Partial mock — only the methods used by fillGapsInPath
function point(x: number, y: number): Point {
    return {
        x,
        y,
        distanceTo(other: Point) {
            return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
        },
        sub(other: Point) {
            return point(this.x - other.x, this.y - other.y);
        },
        add(other: Point) {
            return point(this.x + other.x, this.y + other.y);
        },
        div(scalar: number) {
            return point(this.x / scalar, this.y / scalar);
        },
        mult(scalar: number) {
            return point(this.x * scalar, this.y * scalar);
        },
    } as Point;
}

describe('fillGapsInPath', () => {
    it('returns empty array for empty input', () => {
        expect(fillGapsInPath([], 10)).toEqual([]);
    });

    it('returns single point unchanged', () => {
        const pts = [point(0, 0)];
        const result = fillGapsInPath(pts, 10);
        expect(result).toHaveLength(1);
        expect(result[0].x).toBe(0);
        expect(result[0].y).toBe(0);
    });

    it('does not interpolate when points are within maxDistance', () => {
        const pts = [point(0, 0), point(5, 0)];
        const result = fillGapsInPath(pts, 10);
        expect(result).toHaveLength(2);
        expect(result[0].x).toBe(0);
        expect(result[1].x).toBe(5);
    });

    it('interpolates when gap exceeds maxDistance', () => {
        const pts = [point(0, 0), point(20, 0)];
        const result = fillGapsInPath(pts, 10);
        // Distance is 20, maxDistance is 10, so ceil(20/10) = 2 steps
        // Interpolated: (10, 0), then the endpoint (20, 0)
        expect(result).toHaveLength(3);
        expect(result[0].x).toBe(0);
        expect(result[1].x).toBe(10);
        expect(result[2].x).toBe(20);
    });

    it('interpolates diagonal paths', () => {
        const pts = [point(0, 0), point(30, 40)];
        // Distance = 50, maxDistance = 10, ceil(50/10) = 5 steps
        const result = fillGapsInPath(pts, 10);
        expect(result).toHaveLength(6); // original + 4 interpolated + endpoint
        expect(result[0].x).toBe(0);
        expect(result[0].y).toBe(0);
        expect(result[5].x).toBe(30);
        expect(result[5].y).toBe(40);
    });

    it('handles multi-segment paths', () => {
        const pts = [point(0, 0), point(20, 0), point(20, 20)];
        const result = fillGapsInPath(pts, 10);
        // First segment: 20 / 10 = 2 steps → 1 interpolated + endpoint = 2 new points
        // Second segment: 20 / 10 = 2 steps → 1 interpolated + endpoint = 2 new points
        // Total: 1 (start) + 2 + 2 = 5
        expect(result).toHaveLength(5);
        expect(result[0].x).toBe(0);
        expect(result[result.length - 1].y).toBe(20);
    });

    it('returns points unchanged when maxDistance is zero', () => {
        const pts = [point(0, 0), point(10, 0)];
        const result = fillGapsInPath(pts, 0);
        expect(result).toHaveLength(2);
    });

    it('returns points unchanged when maxDistance is negative', () => {
        const pts = [point(0, 0), point(10, 0)];
        const result = fillGapsInPath(pts, -5);
        expect(result).toHaveLength(2);
    });
});
