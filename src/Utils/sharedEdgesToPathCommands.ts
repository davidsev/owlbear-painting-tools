import type { Cell } from '@davidsev/owlbear-utils';
import { Command, type PathCommand, type Vector2 } from '@owlbear-rodeo/sdk';

export function sharedEdgesToPathCommands (cells: Iterable<Cell>): PathCommand[] | null {
    const edgeCounts = new Map<string, { p1: Vector2; p2: Vector2; count: number }>();
    for (const cell of cells) {
        for (const edge of cell.edges) {
            const key = edge.toString(2);
            const entry = edgeCounts.get(key);
            if (entry) entry.count++;
            else edgeCounts.set(key, { p1: edge.p1, p2: edge.p2, count: 1 });
        }
    }

    const commands: PathCommand[] = [];
    for (const { p1, p2, count } of edgeCounts.values()) {
        if (count >= 2) {
            commands.push([Command.MOVE, p1.x, p1.y]);
            commands.push([Command.LINE, p2.x, p2.y]);
        }
    }

    return commands.length > 0 ? commands : null;
}
