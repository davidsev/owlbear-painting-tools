import { type Cell, grid, Point } from '@davidsev/owlbear-utils';
import { Command, type PathCommand, type Vector2 } from '@owlbear-rodeo/sdk';
import simplify from 'simplify-js';
import { awaitCanvasKit } from '../../Utils/awaitCanvasKit';
import { cellInPoly } from '../../Utils/cellInPoly';
import { addCellsToPath } from '../../Utils/cellsToPath';
import { fillGapsInPath } from '../../Utils/fillGapsInPath';
import { sharedEdgesToPathCommands } from '../../Utils/sharedEdgesToPathCommands';
import { skiaPathToObrPath } from '../../Utils/skiaPathToObrPath';
import type { ShapeInterface } from './ShapeInterface';

export class LassoCellsShape implements ShapeInterface {

    private points: Point[] = [];
    private cells: Map<string, Cell> = new Map();
    private _cachedResolvedCells: Cell[] | null = null;

    public async add (point: Vector2): Promise<void> {
        this.points.push(new Point(point));
        const cell = grid.getCell(point);
        if (!this.cells.has(cell.toString()))
            this.cells.set(cell.toString(), cell);
        this._cachedResolvedCells = null;
    }

    public async clear (): Promise<void> {
        this.points = [];
        this.cells.clear();
        this._cachedResolvedCells = null;
    }

    private _resolveCells (): Cell[] {
        if (this._cachedResolvedCells !== null)
            return this._cachedResolvedCells;

        if (this.points.length < 3) {
            this._cachedResolvedCells = [];
            return this._cachedResolvedCells;
        }

        // Make a simplified version of the path with less points.
        const simplifiedPoints = simplify([...this.points, this.points[0]], 2, false).map(p => new Point(p));

        // Add extra points to long lines, so a long thin lasso segment can't pass through a cell without any points hitting.
        const lassoPolys = fillGapsInPath(simplifiedPoints, grid.dpi / 2);

        // Iterate over all the cells that could be covered by the lasso, and check if they intersect the path.
        const cells: Cell[] = [];
        for (const cell of grid.iterateCellsBoundingPoints([...this.cells.values()])) {
            if (cellInPoly(cell, lassoPolys))
                cells.push(cell);
        }
        this._cachedResolvedCells = cells;
        return cells;
    }

    public async getPathCommands (): Promise<PathCommand[]> {
        const cells = this._resolveCells();
        if (cells.length === 0) return [];

        // Merge the cells.
        const canvasKit = await awaitCanvasKit();
        const newShape = new canvasKit.Path();
        addCellsToPath(cells, newShape);

        newShape.simplify();

        const cmds = skiaPathToObrPath(newShape.toCmds());
        newShape.delete();
        return cmds;
    }

    public async getInnerLinesPathCommands (): Promise<PathCommand[] | null> {
        const cells = this._resolveCells();
        if (cells.length < 2) return null;
        return sharedEdgesToPathCommands(cells);
    }

    public async getGuidePathCommands (): Promise<PathCommand[] | null> {
        const commands: PathCommand[] = [];
        for (const [i, point] of this.points.entries())
            commands.push([i ? Command.LINE : Command.MOVE, point.x, point.y]);
        commands.push([Command.CLOSE]);

        return commands;
    }
}
