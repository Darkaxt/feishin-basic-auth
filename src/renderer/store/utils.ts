import mergeWith from 'lodash/mergeWith';
import { StoreApi, UseBoundStore } from 'zustand';

/**
 * A custom deep merger that will replace all 'columns' items with the persistent
 * state, instead of the default merge behavior. This is important to preserve the user's
 * order, and not lead to an inconsistent state (e.g. multiple 'Favorite' keys)
 * @param persistedState the persistent state
 * @param currentState the current state
 * @returns the a custom deep merge
 */
export const mergeOverridingColumns = <T>(persistedState: unknown, currentState: T) => {
    return mergeWith(currentState, persistedState, (_original, persistent, key) => {
        if (key === 'columns') {
            return persistent;
        }

        return undefined;
    });
};

type WithSelectors<S> = S extends { getState: () => infer T }
    ? S & { use: { [K in keyof T]: () => T[K] } }
    : never;

export function createSelectors<S extends UseBoundStore<StoreApi<object>>>(_store: S) {
    const store = _store as WithSelectors<typeof _store>;
    store.use = {};
    for (const k of Object.keys(store.getState())) {
        (store.use as any)[k] = () => store((s) => s[k as keyof typeof s]);
    }

    return store;
}
