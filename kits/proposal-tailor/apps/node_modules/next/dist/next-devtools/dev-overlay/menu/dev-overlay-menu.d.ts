export declare const DevtoolMenu: ({ closeOnClickOutside, items, }: {
    closeOnClickOutside?: boolean;
    items: Array<false | undefined | null | {
        onClick?: () => void;
        title?: string;
        label: string;
        value: React.ReactNode;
        attributes?: Record<string, string | boolean>;
        footer?: boolean;
    }>;
}) => import("react").JSX.Element;
export declare function IssueCount({ children, variant, }: {
    children: number;
    variant?: 'issue' | 'insight';
}): import("react").JSX.Element;
export declare function ChevronRight(): import("react").JSX.Element;
