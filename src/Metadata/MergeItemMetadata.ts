import { ItemMetadataMapper } from '@davidsev/owlbear-utils';
import getId from '../Utils/getId';

export type MergeGroup = 'brush' | 'cells';
export type MergeRole = 'fill' | 'border' | 'innerLines' | 'fog';

export class MergeItemMetadata {
    group: MergeGroup | null = null;
    role: MergeRole | null = null;
}

export const mergeItemMetadataMapper = new ItemMetadataMapper(getId('merge'), new MergeItemMetadata());
