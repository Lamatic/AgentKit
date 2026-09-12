export type CacheLife = {
    stale?: number;
    revalidate?: number;
    expire?: number;
};
type CacheLifeProfileContext = {
    kind: 'inline';
} | {
    kind: 'config';
    profileName: string;
};
export declare function validateAndNormalizeCacheLifeProfile(profile: CacheLife, context: CacheLifeProfileContext): CacheLife;
export {};
