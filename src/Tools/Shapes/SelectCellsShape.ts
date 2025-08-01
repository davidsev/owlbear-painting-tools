import { PathCommand, Vector2 } from '@owlbear-rodeo/sdk';
import { Cell, grid } from '@davidsev/owlbear-utils';
import { skiaPathToObrPath } from '../../Utils/skiaPathToObrPath';
import { ShapeInterface } from './ShapeInterface';
import { awaitCanvasKit } from '../../Utils/awaitCanvasKit';

export class SelectCellsShape implements ShapeInterface {

    private cells: Map<String, Cell> = new Map();

    public async add (point: Vector2): Promise<void> {
        const cell = grid.getCell(point);
        if (!this.cells.has(cell.toString()))
            this.cells.set(cell.toString(), cell);
    }

    public async clear (): Promise<void> {
        this.cells.clear();
    }

    public async getPathCommands (): Promise<PathCommand[]> {

        const canvasKit = await awaitCanvasKit();

        const newShape = new canvasKit.Path();
        for (const cell of this.cells.values()) {
            for (const [i, point] of cell.corners.entries()) {
                if (i == 0)
                    newShape.moveTo(point.x, point.y);
                else
                    newShape.lineTo(point.x, point.y);
            }
            newShape.close();
        }

        newShape.simplify();

        return skiaPathToObrPath(newShape.toCmds());
    }

    public async getGuidePathCommands (): Promise<null> {
        return null;
    }
}
