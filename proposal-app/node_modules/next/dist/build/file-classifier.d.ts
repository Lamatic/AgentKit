export type SlotInfo = {
    name: string;
    parent: string;
};
export type RouteInfo = {
    route: string;
    filePath: string;
};
/**
 * Extract slot info from a page path if it contains a parallel route
 */
export declare function extractSlotFromPath(pagePath: string): SlotInfo | undefined;
/**
 * Add a slot to the slots array if it doesn't already exist
 */
export declare function addSlotIfNew(slots: SlotInfo[], pagePath: string): boolean;
/**
 * Extract slots from a route mapping object
 */
export declare function extractSlotsFromRoutes(routes: {
    [page: string]: string;
}, skipRoutes?: Set<string>): SlotInfo[];
/**
 * Combine and deduplicate slot arrays
 */
export declare function combineSlots(...slotArrays: SlotInfo[][]): SlotInfo[];
