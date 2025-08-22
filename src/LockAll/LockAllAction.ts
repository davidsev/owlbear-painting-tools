import OBR, { Item, ToolAction, ToolContext, ToolIcon } from '@owlbear-rodeo/sdk';
import getId from '../Utils/getId';
import { lockSceneMetadata } from '../Metadata/LockSceneMetadata';
import { lockItemMetadataMapper } from '../Metadata/LockItemMetadata';

export class LockAllAction implements ToolAction {
    public readonly id = getId('lockAllAction');
    readonly icons: ToolIcon[] = [{
        icon: URL_PREFIX + '/lock.svg',
        label: 'Lock All Drawing',
        filter: {
            activeTools: ['rodeo.owlbear.tool/drawing'],
        },
    }];

    async onClick (context: ToolContext) {
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
