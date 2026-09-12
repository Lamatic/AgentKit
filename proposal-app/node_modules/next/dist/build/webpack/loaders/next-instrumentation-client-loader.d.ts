import type { webpack } from 'next/dist/compiled/webpack/webpack';
export type InstrumentationClientLoaderOptions = {
    modules: string[];
};
declare const NextInstrumentationClientLoader: webpack.LoaderDefinitionFunction<InstrumentationClientLoaderOptions>;
export default NextInstrumentationClientLoader;
