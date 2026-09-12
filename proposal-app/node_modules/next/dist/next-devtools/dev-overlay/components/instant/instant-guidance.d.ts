import { type GuidanceKind, type GuidanceVariant } from './instant-guidance-data';
export { SYNC_IO_CLIENT_DOCS, SYNC_IO_DOCS } from './instant-guidance-data';
export type { GuidanceKind, GuidanceVariant } from './instant-guidance-data';
export declare function InstantGuidance({ variant, kind, explanation, cause, showExplanation, generateErrorInfo, }: {
    variant: GuidanceVariant;
    kind?: GuidanceKind;
    explanation?: string;
    cause?: string;
    showExplanation?: boolean;
    generateErrorInfo?: () => Promise<string>;
}): import("react").JSX.Element;
export declare function InstantHeaderExplanation({ kind, variant, explanation, docsUrl, }: {
    kind?: GuidanceKind;
    variant?: GuidanceVariant;
    explanation?: string;
    docsUrl?: string;
}): import("react").JSX.Element;
export declare const INSTANT_GUIDANCE_STYLES: string;
