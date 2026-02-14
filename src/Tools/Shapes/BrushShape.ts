import { grid, Point } from '@davidsev/owlbear-utils';
import type { PathCommand, Vector2 } from '@owlbear-rodeo/sdk';
import type { Path } from 'canvaskit-wasm';
import { awaitCanvasKit } from '../../Utils/awaitCanvasKit';
import { skiaPathToObrPath } from '../../Utils/skiaPathToObrPath';
import type { ShapeInterface } from './ShapeInterface';

export class BrushShape implements ShapeInterface {

    private points: Point[] = [];
    private path: Path | null = null;

    public get radius (): number {
        return parseFloat(localStorage.getItem('brushRadius') || '0.25') * 2 * grid.dpi;
    }

    public async add (point: Vector2): Promise<void> {

        const canvasKit = await awaitCanvasKit();

        if (!this.path)
            this.path = new canvasKit.Path();

        if (!this.points.length || this.points[this.points.length - 1].distanceTo(new Point(point)) > 10) {
            const prevPoint = this.points[this.points.length - 1] ?? null;
            const newPoint = new Point(point);
            this.points.push(newPoint);

            // Add a circle at the new point for the brush.
            const newShape = new canvasKit.Path();
            newShape.addCircle(point.x, point.y, this.radius);

            // Draw a line from the last point to the new one, to make the edge less blobby.
            if (prevPoint) {
                const length = prevPoint.distanceTo(newPoint);
                const normal = newPoint.sub(prevPoint).div(length).mult(this.radius);
                const tangent = new Point(-normal.y, normal.x);
                const topLeft = prevPoint.add(tangent);
                const topRight = prevPoint.sub(tangent);
                const bottomRight = newPoint.sub(tangent);
                const bottomLeft = newPoint.add(tangent);
                newShape.moveTo(topLeft.x, topLeft.y);
                newShape.lineTo(topRight.x, topRight.y);
                newShape.lineTo(bottomRight.x, bottomRight.y);
                newShape.lineTo(bottomLeft.x, bottomLeft.y);
                newShape.close();
            }
            this.path.op(newShape, canvasKit.PathOp.Union);
            newShape.delete();
        }
    }

    public async clear (): Promise<void> {
        this.points = [];
        this.path?.delete();
        this.path = null;
    }

    public async getPathCommands (): Promise<PathCommand[]> {
        if (this.path)
            return skiaPathToObrPath(this.path.toCmds());
        else
            return [];
    }

    public async getGuidePathCommands (): Promise<PathCommand[] | null> {
        return null;
    }
}

