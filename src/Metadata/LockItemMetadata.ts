import { ItemMetadataMapper } from '@davidsev/owlbear-utils';
import getId from '../Utils/getId';

export class LockItemMetadata {
    isLocked: boolean = false;
}

export const lockItemMetadataMapper = new ItemMetadataMapper(getId('lock'), new LockItemMetadata());

