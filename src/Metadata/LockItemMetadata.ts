import getId from '../Utils/getId';
import { ItemMetadataMapper } from '@davidsev/owlbear-utils';

export class LockItemMetadata {
    isLocked: boolean = false;
}

export const lockItemMetadataMapper = new ItemMetadataMapper(getId('lock'), new LockItemMetadata());

