import { grid } from '@davidsev/owlbear-utils';

type InitFunction = () => unknown;
const functions: Map<string, InitFunction> = new Map<string, InitFunction>();

export function registerInitFunction (name: string, callback: InitFunction) {
    functions.set(name, callback);
}

async function init () {
    await grid.awaitReady();

    const id = window.location.hash.slice(1);
    const callback = functions.get(id);
    if (callback) callback();
}

init();
