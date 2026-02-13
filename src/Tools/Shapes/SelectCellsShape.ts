import { PathCommand, Vector2 } from '@owlbear-rodeo/sdk';
import { Cell, grid } from '@davidsev/owlbear-utils';
import { skiaPathToObrPath } from '../../Utils/skiaPathToObrPath';
import { ShapeInterface } from './ShapeInterface';
import { awaitCanvasKit } from '../../Utils/awaitCanvasKit';
import { addCellsToPath } from '../../Utils/cellsToPath';

export class SelectCellsShape implements ShapeInterface {

    private cells: Map<string, Cell> = new Map();

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
        addCellsToPath(this.cells.values(), newShape);

        newShape.simplify();

        return skiaPathToObrPath(newShape.toCmds());
    }

    public async getGuidePathCommands (): Promise<null> {
        return null;
    }
}
