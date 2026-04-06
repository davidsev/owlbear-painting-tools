import type { MergeGroup } from '../../Metadata/MergeItemMetadata';
import type { ShapeInterface } from '../Shapes/ShapeInterface';

export interface RendererInterface {

    /** Returns true if all relevant styles are disabled and nothing would be drawn. */
    allStylesDisabled (hasInnerLines: boolean): boolean;

    startPreview (shape: ShapeInterface): Promise<void>;

    updatePreview (shape: ShapeInterface): Promise<void>;

    removePreview (): Promise<void>;

    saveFinalShape (shape: ShapeInterface, mergeGroup: MergeGroup): Promise<void>;
}
