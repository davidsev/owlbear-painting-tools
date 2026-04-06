import { Command, type PathCommand, type Vector2 } from '@owlbear-rodeo/sdk';
import type { CanvasKit, Path } from 'canvaskit-wasm';

export function obrPathToSkiaPath (commands: PathCommand[], canvasKit: CanvasKit, offset: Vector2 = { x: 0, y: 0 }): Path {
    const path = new canvasKit.Path();
    const ox = offset.x;
    const oy = offset.y;
    for (const cmd of commands) {
        switch (cmd[0]) {
            case Command.CLOSE:
                path.close();
                break;
            case Command.MOVE:
                path.moveTo(cmd[1] + ox, cmd[2] + oy);
                break;
            case Command.LINE:
                path.lineTo(cmd[1] + ox, cmd[2] + oy);
                break;
            case Command.QUAD:
                path.quadTo(cmd[1] + ox, cmd[2] + oy, cmd[3] + ox, cmd[4] + oy);
                break;
            case Command.CONIC:
                path.conicTo(cmd[1] + ox, cmd[2] + oy, cmd[3] + ox, cmd[4] + oy, cmd[5]);
                break;
            case Command.CUBIC:
                path.cubicTo(cmd[1] + ox, cmd[2] + oy, cmd[3] + ox, cmd[4] + oy, cmd[5] + ox, cmd[6] + oy);
                break;
            default:
                throw new Error(`Unknown PathCommand: ${cmd[0]}`);
        }
    }
    return path;
}
