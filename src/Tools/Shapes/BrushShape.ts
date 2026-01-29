import OBR, { buildShape, isShape, PathCommand, Shape, Vector2 } from '@owlbear-rodeo/sdk';
import { ShapeInterface } from './ShapeInterface';
import getId from '../../Utils/getId';
import { grid, Point } from '@davidsev/owlbear-utils';
import { Path } from 'canvaskit-wasm';
import { awaitCanvasKit } from '../../Utils/awaitCanvasKit';
import { skiaPathToObrPath } from '../../Utils/skiaPathToObrPath';

export class BrushShape implements ShapeInterface {

    private points: Point[] = [];
    private path: Path | null = null;

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
        }
    }

    public async clear (): Promise<void> {
        this.points = [];
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

    //
    // Settings form
    //

    public async showSettingsPopup (): Promise<void> {
        await OBR.popover.open({
            id: getId('brush-settings'),
            url: URL_PREFIX + '/frame.html#brush-settings',
            height: 40,
            width: 250,
            disableClickAway: true,
            anchorOrigin: {
                horizontal: 'CENTER',
                vertical: 'TOP',
            },
            marginThreshold: 56,
        });
    }

    public async hideSettingsPopup (): Promise<void> {
        await OBR.popover.close(getId('brush-settings'));
    }

    //
    // Cursor
    //

    private cursor: Shape | null = null;

    private get radius (): number {
        return parseFloat(localStorage.getItem('brushRadius') || '0.25') * 2 * grid.dpi;
    }

    public async showCursor (): Promise<void> {
        if (this.cursor)
            this.hideCursor();

        this.cursor = buildShape()
            .strokeColor('#AAAAAA')
            .fillOpacity(0)
            .strokeWidth(3)
            .disableHit(true)
            .layer('POPOVER')
            .shapeType('CIRCLE')
            .build();

        await OBR.scene.local.addItems([this.cursor]);
    }

    public hideCursor (): void {
        if (this.cursor) {
            // We don't handle this promise because we don't care if the cursor is deleted successfully.
            // On success there's nothing to do, and if it fails there's nothing we can do.  It's a local item so will clean itself up on refresh.
            OBR.scene.local.deleteItems([this.cursor.id]);
            this.cursor = null;
        }
    }

    private _inUpdate: boolean = false;

    public async updateCursor (point: Vector2): Promise<void> {
        if (!this.cursor || this._inUpdate)
            return;

        this._inUpdate = true;
        await OBR.scene.local.updateItems([this.cursor.id], ([cursor]) => {
            if (isShape(cursor)) {
                cursor.position = point;
                cursor.width = this.radius * 2;
                cursor.height = this.radius * 2;
            }
        });
        this._inUpdate = false;
    }
}

