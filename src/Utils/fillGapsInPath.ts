import type { Point } from '@davidsev/owlbear-utils';

export function fillGapsInPath (points: Point[], maxDistance: number): Point[] {
    const firstPoint = points[0];
    if (firstPoint === undefined || points.length <= 1 || maxDistance <= 0) {
        return points;
    }

    let lastPoint: Point = firstPoint;
    const ret: Point[] = [lastPoint];
    for (let i = 1; i < points.length; i++) {
        const nextPoint = points[i] as Point;
        const distance = lastPoint.distanceTo(nextPoint);
        const steps = Math.ceil(distance / maxDistance);
        const stepVector = nextPoint.sub(lastPoint).div(steps);
        for (let step = 1; step < steps; step++) {
            ret.push(lastPoint.add(stepVector.mult(step)));
        }
        ret.push(nextPoint);
        lastPoint = nextPoint;
    }

    return ret;
}
