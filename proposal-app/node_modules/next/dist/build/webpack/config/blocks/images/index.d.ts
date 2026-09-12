import type { webpack } from 'next/dist/compiled/webpack/webpack';
import type { ConfigurationContext } from '../../utils';
export declare const images: (ctx: ConfigurationContext) => (config: webpack.Configuration) => Promise<webpack.Configuration>;
