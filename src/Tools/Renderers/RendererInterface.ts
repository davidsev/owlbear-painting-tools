import { ShapeInterface } from '../Shapes/ShapeInterface';

export interface RendererInterface {

    startPreview (shape: ShapeInterface): Promise<void>;

    updatePreview (shape: ShapeInterface): Promise<void>;

    removePreview (): Promise<void>;

    saveFinalShape (shape: ShapeInterface): Promise<void>;
}
