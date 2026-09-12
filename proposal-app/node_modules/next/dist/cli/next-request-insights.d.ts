export type NextRequestInsightsOptions = {
    url?: string;
    json?: boolean;
    limit?: number;
};
export declare function nextRequestInsights(options: NextRequestInsightsOptions, directory?: string): Promise<void>;
