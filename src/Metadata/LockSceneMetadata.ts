import { CachedSceneMetadata } from '@davidsev/owlbear-utils';
import getId from '../Utils/getId';

export class LockSceneMetadata {
    isLocked: boolean = false;
}

export const lockSceneMetadata = new CachedSceneMetadata(getId('lock'), new LockSceneMetadata());

