import React from 'react';
import type { Params } from '../../server/request/params';
import type { LoaderTree } from '../../server/lib/app-dir-module';
import type { SearchParams } from '../../server/request/search-params';
import { type MetadataErrorType } from './resolve-metadata';
import type { MetadataContext } from './types/resolvers';
export declare function createMetadataComponents({ tree, pathname, parsedQuery, metadataContext, interpolatedParams, errorType, serveStreamingMetadata, }: {
    tree: LoaderTree;
    pathname: string;
    parsedQuery: SearchParams;
    metadataContext: MetadataContext;
    interpolatedParams: Params;
    errorType?: MetadataErrorType | 'redirect';
    serveStreamingMetadata: boolean;
}): {
    Viewport: React.ComponentType;
    Metadata: React.ComponentType;
    MetadataOutlet: React.ComponentType;
};
