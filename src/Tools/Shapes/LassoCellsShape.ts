import { type Cell, grid, Point } from '@davidsev/owlbear-utils';
import { Command, type PathCommand, type Vector2 } from '@owlbear-rodeo/sdk';
import simplify from 'simplify-js';
import { awaitCanvasKit } from '../../Utils/awaitCanvasKit';
import { cellInPoly } from '../../Utils/cellInPoly';
import { addCellsToPath } from '../../Utils/cellsToPath';
import { fillGapsInPath } from '../../Utils/fillGapsInPath';
import { skiaPathToObrPath } from '../../Utils/skiaPathToObrPath';
import type { ShapeInterface } from './ShapeInterface';

export class LassoCellsShape implements ShapeInterface {

    private points: Point[] = [];
    private cells: Map<string, Cell> = new Map();

    public async add (point: Vector2): Promise<void> {
        this.points.push(new Point(point));
        const cell = grid.getCell(point);
        if (!this.cells.has(cell.toString()))
            this.cells.set(cell.toString(), cell);
    }

    public async clear (): Promise<void> {
        this.points = [];
        this.cells.clear();
    }

    public async getPathCommands (): Promise<PathCommand[]> {

        if (this.points.length < 3)
            return [];

        // Make a simplified version of the path with less points.
        const simplifiedPoints = simplify([...this.points, this.points[0]], 2, false).map(p => new Point(p));

        // If there are overlaps, then separate them out.  Polyclip can do this, and also guarantees that it's counter clockwise.
        // For each path, only take the outer ring (so fill any holes).
        // We then also add extra points to long lines, so long thin points can't go through a cell without any points hitting.
        const lassoPolys = fillGapsInPath(simplifiedPoints, grid.dpi / 2);

        //  Iterate over all the cells that could be covered by the lasso, and check if they intersect any of the paths.
        const cells: Cell[] = [];
        for (const cell of grid.iterateCellsBoundingPoints([...this.cells.values()])) {
            if (cellInPoly(cell, lassoPolys))
                cells.push(cell);
        }

        // Merge the cells.
        const canvasKit = await awaitCanvasKit();
        const newShape = new canvasKit.Path();
        addCellsToPath(cells, newShape);

        newShape.simplify();

        return skiaPathToObrPath(newShape.toCmds());
    }

    public async getGuidePathCommands (): Promise<PathCommand[] | null> {
        const commands: PathCommand[] = [];
        for (const [i, point] of this.points.entries())
            commands.push([i ? Command.LINE : Command.MOVE, point.x, point.y]);
        commands.push([Command.CLOSE]);

        return commands;
    }
}
