import type { CacheLife } from './cache-life-profile';
export type { CacheLife };
type CacheLifeProfiles = 'default' | 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'max' | (string & {});
export declare function cacheLife(profile: CacheLifeProfiles | CacheLife): void;
