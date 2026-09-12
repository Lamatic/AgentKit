import type { webpack } from 'next/dist/compiled/webpack/webpack';
import type { ConfigurationContext } from '../utils';
export declare const base: (ctx: ConfigurationContext) => (config: webpack.Configuration) => webpack.Configuration;
