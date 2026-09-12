import type { webpack } from 'next/dist/compiled/webpack/webpack';
export declare const loader: (rule: webpack.RuleSetRule) => (config: webpack.Configuration) => webpack.Configuration;
export declare const unshiftLoader: (rule: webpack.RuleSetRule) => (config: webpack.Configuration) => webpack.Configuration;
export declare const plugin: (p: webpack.WebpackPluginInstance) => (config: webpack.Configuration) => webpack.Configuration;
