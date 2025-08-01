import { ToolMetadataMapper } from '@davidsev/owlbear-utils';

export class DrawingToolMetadata {
    fillColor: string = '#1a6aff';
    fillOpacity: number = 0;
    strokeColor: string = '#ffffff';
    strokeDash: number[] = [];
    strokeOpacity: number = 1;
    strokeWidth: number = 2;
}

export const drawingToolMetadata = new ToolMetadataMapper('rodeo.owlbear.tool/drawing', new DrawingToolMetadata);


