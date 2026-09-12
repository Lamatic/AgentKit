/* eslint-disable @next/internal/no-ambiguous-jsx -- React Client */ // Do not put a "use client" directive here. Import this module via the shim in
// `packages/next/src/client/components/instant-validation/boundary.tsx` instead.
// 'use client'
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext } from 'react';
import { INSTANT_VALIDATION_BOUNDARY_NAME } from './boundary-constants';
import { InvariantError } from '../../../shared/lib/invariant-error';
import { workUnitAsyncStorage } from '../work-unit-async-storage.external';
if (typeof window !== 'undefined') {
    throw Object.defineProperty(new InvariantError('Instant validation boundaries should never appear in browser bundles.'), "__NEXT_ERROR_CODE", {
        value: "E1117",
        enumerable: false,
        configurable: true
    });
}
function getValidationBoundaryTracking() {
    const store = workUnitAsyncStorage.getStore();
    if (!store) return null;
    switch(store.type){
        case 'validation-client':
            return store.boundaryState;
        case 'prerender':
        case 'prerender-client':
        case 'prerender-ppr':
        case 'prerender-legacy':
        case 'prerender-runtime':
        case 'request':
        case 'cache':
        case 'private-cache':
        case 'unstable-cache':
        case 'generate-static-params':
            break;
        default:
            store;
    }
    return null;
}
// We use a namespace object to allow us to recover the name of the function
// at runtime even when production bundling/minification is used.
const NameSpace = {
    [INSTANT_VALIDATION_BOUNDARY_NAME]: function({ id, children }) {
        // Track which boundaries we actually managed to render.
        const state = getValidationBoundaryTracking();
        if (state === null) {
            throw Object.defineProperty(new InvariantError('Missing boundary tracking state'), "__NEXT_ERROR_CODE", {
                value: "E1060",
                enumerable: false,
                configurable: true
            });
        }
        state.renderedIds.add(id);
        return children;
    }
};
export const InstantValidationBoundaryContext = /*#__PURE__*/ createContext(null);
export function PlaceValidationBoundaryBelowThisLevel({ id, children }) {
    return(// OuterLayoutRouter will see this and render a `RenderValidationBoundaryAtThisLevel`.
    /*#__PURE__*/ _jsx(InstantValidationBoundaryContext, {
        value: id,
        children: children
    }));
}
export function RenderValidationBoundaryAtThisLevel({ id, children }) {
    // We got a boundaryId from the context. Clear the context so that the children don't render another boundary.
    return /*#__PURE__*/ _jsx(InstantValidationBoundary, {
        id: id,
        children: /*#__PURE__*/ _jsx(InstantValidationBoundaryContext, {
            value: null,
            children: children
        })
    });
}
const InstantValidationBoundary = // We use slice(0) to trick the bundler into not inlining/minifying the function
// so it retains the name inferred from the namespace object
NameSpace[INSTANT_VALIDATION_BOUNDARY_NAME.slice(0)];
// Slot marker component for attributing validation errors to the
// correct config when a boundary spans multiple parallel slots.
// Renders a dynamically-named inner component so the slot index
// appears in the SSR component stack (__next_instant_slot_N__).
const slotMarkerCache = new Map();
export function SlotMarker({ name, children }) {
    let Marker = slotMarkerCache.get(name);
    if (!Marker) {
        const ns = {
            [name]: function({ children: c }) {
                return c;
            }
        };
        Marker = ns[name];
        slotMarkerCache.set(name, Marker);
    }
    return /*#__PURE__*/ _jsx(Marker, {
        children: children
    });
}

//# sourceMappingURL=boundary-impl.js.map