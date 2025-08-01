import { PathCommand, Vector2 } from '@owlbear-rodeo/sdk';

export interface ShapeInterface {

    add (point: Vector2): Promise<void>;

    getPathCommands (): Promise<PathCommand[]>;

    getGuidePathCommands (): Promise<null | PathCommand[]>;

    clear (): Promise<void>;
}
