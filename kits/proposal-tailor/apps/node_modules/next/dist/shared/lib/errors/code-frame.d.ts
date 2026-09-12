import type { NapiCodeFrameLocation, NapiCodeFrameOptions } from '../../../build/swc/generated-native';
/**
 * Renders a code frame showing the location of an error in source code.
 * Requires native bindings to be installed — throws otherwise.
 */
export declare function codeFrameColumns(file: string, location: NapiCodeFrameLocation, options?: NapiCodeFrameOptions): string | undefined;
export type { NapiCodeFrameLocation, NapiCodeFrameOptions };
