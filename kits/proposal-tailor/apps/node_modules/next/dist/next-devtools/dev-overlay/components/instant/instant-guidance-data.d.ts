export type CardColor = 'blue' | 'purple' | 'red' | 'amber' | 'teal' | 'gray';
export type FixCardGroup = 'stream' | 'block' | 'cache' | 'static' | 'dynamic' | 'client' | 'defer' | 'measure' | 'ignore' | 'render' | 'upgrade' | 'disable';
export type FixCardIcon = 'align-left' | 'arrow-up' | 'database' | 'history' | 'layout' | 'loading' | 'minus' | 'minus-circle' | 'pointer-click' | 'server-stack' | 'timer' | 'zap';
export declare const FIX_CARD_GROUPS: Record<FixCardGroup, {
    label: string;
    color: CardColor;
    icon: FixCardIcon;
}>;
export type FixCard = {
    /** Docs anchor for this card. */
    id: string;
    title: string;
    group: FixCardGroup;
    /** Docs URL, or null for no link. */
    link: string | null;
    snippets: Snippet[];
    /** Show the Copy prompt button on this card. */
    copyable?: boolean;
};
export type SnippetPart = {
    text: string;
    highlight?: boolean;
};
export type Snippet = {
    text: string;
    highlight?: boolean;
    /** Inline highlights within the line; takes precedence over the line-level `highlight` flag. */
    parts?: SnippetPart[];
};
export type GuidanceKind = 'blocking-route' | 'client-hook' | 'metadata' | 'viewport' | 'sync-io' | 'sync-io-client' | 'unrendered-segment' | 'link-prefetch-partial';
export type GuidanceVariant = 'link' | 'runtime' | 'dynamic';
export declare const DOCS_URLS: Record<GuidanceKind, string>;
export declare const SYNC_IO_DOCS: Record<string, string>;
export declare const SYNC_IO_CLIENT_DOCS: Record<string, string>;
export declare const EXPLANATIONS: Record<GuidanceKind, string>;
export declare const BLOCKING_ROUTE_NAVIGATION_EXPLANATION = "This prevents the navigation from being instant, leading to a slower user experience.";
export declare const BLOCKING_ROUTE_LINK_EXPLANATION = "This may prevent the navigation from being instant, leading to a slower user experience.";
export declare function getCards(kind: GuidanceKind, variant: GuidanceVariant, cause?: string): FixCard[];
