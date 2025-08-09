import { ToolIcon } from '@owlbear-rodeo/sdk';
import getId from '../Utils/getId';
import { BaseTool } from './BaseTool';
import { FogRenderer } from './Renderers/FogRenderer';
import { LassoCellsShape } from './Shapes/LassoCellsShape';

export class LassoCellsFogTool extends BaseTool <FogRenderer, LassoCellsShape> {

    readonly id: string = getId('lassoCellsFog');
    readonly icons: ToolIcon[] = [{
        icon: URL_PREFIX + '/lassoCells.svg',
        label: 'Select Area',
        filter: {
            activeTools: ['rodeo.owlbear.tool/fog'],
        },
    }];

    constructor () {
        super(new FogRenderer(), new LassoCellsShape());
    }
}

