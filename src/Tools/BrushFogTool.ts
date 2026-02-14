import type { ToolIcon } from '@owlbear-rodeo/sdk';
import getId from '../Utils/getId';
import { BaseBrushTool } from './BaseBrushTool';
import { FogRenderer } from './Renderers/FogRenderer';

export class BrushFogTool extends BaseBrushTool<FogRenderer> {

    readonly id: string = getId('brushFog');
    readonly icons: ToolIcon[] = [{
        icon: `${URL_PREFIX}/brush.svg`,
        label: 'Brush',
        filter: {
            activeTools: ['rodeo.owlbear.tool/fog'],
        },
    }];

    constructor () {
        super(new FogRenderer());
    }
}
