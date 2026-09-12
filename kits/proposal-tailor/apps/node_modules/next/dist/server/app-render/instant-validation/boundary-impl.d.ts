import { type ReactNode } from 'react';
type BoundaryPlacement = null | string;
export declare const InstantValidationBoundaryContext: import("react").Context<BoundaryPlacement>;
export declare function PlaceValidationBoundaryBelowThisLevel({ id, children, }: {
    id: string;
    children: ReactNode;
}): import("react").JSX.Element;
export declare function RenderValidationBoundaryAtThisLevel({ id, children, }: {
    id: string;
    children: ReactNode;
}): import("react").JSX.Element;
export declare function SlotMarker({ name, children, }: {
    name: string;
    children: ReactNode;
}): import("react").JSX.Element;
export {};
