/**
 * Format arguments array to a string for display
 */
export declare function formatArgs(args: unknown[]): string;
export interface ServerActionLogInfo {
    functionName: string;
    args: unknown[];
    location: string;
}
