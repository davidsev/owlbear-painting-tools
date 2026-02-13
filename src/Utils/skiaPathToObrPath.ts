import { Command, PathCommand } from '@owlbear-rodeo/sdk';

export function skiaPathToObrPath (skiaCmds: Float32Array): PathCommand[] {

    const obrCommands: PathCommand[] = [];
    let i = 0;
    while (i < skiaCmds.length) {
        switch (skiaCmds[i]) {
            case Command.CLOSE:
                obrCommands.push([Command.CLOSE]);
                i++;
                break;
            case Command.MOVE:
            case Command.LINE:
                obrCommands.push([...skiaCmds.subarray(i, i + 3)] as PathCommand);
                i += 3;
                break;
            case Command.QUAD:
                obrCommands.push([...skiaCmds.subarray(i, i + 5)] as PathCommand);
                i += 5;
                break;
            case Command.CONIC:
                obrCommands.push([...skiaCmds.subarray(i, i + 6)] as PathCommand);
                i += 6;
                break;
            case Command.CUBIC:
                obrCommands.push([...skiaCmds.subarray(i, i + 7)] as PathCommand);
                i += 7;
                break;
            default:
                throw new Error('Unknown skPath command: ' + skiaCmds[i]);
        }
    }

    return obrCommands;
}
