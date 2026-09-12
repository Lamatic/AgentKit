import type { Rule } from 'eslint';
/**
 * Gets one or more Root, returns an array of root directories.
 */
export declare const getRootDirs: (context: Rule.RuleContext) => string[];
