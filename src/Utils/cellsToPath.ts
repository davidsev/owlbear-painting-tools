import type { Cell } from '@davidsev/owlbear-utils';
import type { Path } from 'canvaskit-wasm';

export function addCellsToPath (cells: Iterable<Cell>, path: Path): void {
    for (const cell of cells) {
        for (const [i, point] of cell.corners.entries()) {
            if (i === 0)
                path.moveTo(point.x, point.y);
            else
                path.lineTo(point.x, point.y);
        }
        path.close();
    }
}
