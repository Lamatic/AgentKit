import '../server/require-hook';
import '../server/lib/cpu-profile';
import { isPageStatic as isPageStaticImpl } from './utils';
export { getDefinedNamedExports, hasCustomGetInitialProps } from './utils';
export declare const isPageStatic: typeof isPageStaticImpl;
export { exportPages } from '../export/worker';
