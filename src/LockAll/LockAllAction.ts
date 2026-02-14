import OBR, { type Item, type ToolAction, type ToolContext, type ToolIcon } from '@owlbear-rodeo/sdk';
import { lockItemMetadataMapper } from '../Metadata/LockItemMetadata';
import { lockSceneMetadata } from '../Metadata/LockSceneMetadata';
import getId from '../Utils/getId';

export class LockAllAction implements ToolAction {
    public readonly id = getId('lockAllAction');
    readonly icons: ToolIcon[] = [{
        icon: `${URL_PREFIX}/lock.svg`,
        label: 'Lock All Drawing',
        filter: {
            activeTools: ['rodeo.owlbear.tool/drawing'],
        },
    }];

    async onClick (_context: ToolContext) {
        lockSceneMetadata.set({ isLocked: true });
        await OBR.scene.items.updateItems(shouldLock, (items) => {
            for (const item of items) {
                item.locked = true;
                lockItemMetadataMapper.set(item, { isLocked: true });
            }
        });
    }
}

function shouldLock (item: Item) {
    return item.layer === 'DRAWING'
        && !item.locked;
}
