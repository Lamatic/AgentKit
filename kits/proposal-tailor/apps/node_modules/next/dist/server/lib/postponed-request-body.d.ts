import type { SizeLimit } from '../../types';
export type PostponedRequestBodyChunk = Buffer | Uint8Array | string;
export declare function getMaxPostponedStateSize(configuredMaxPostponedStateSize: SizeLimit | undefined): {
    maxPostponedStateSize: SizeLimit;
    maxPostponedStateSizeBytes: number;
};
export declare function getPostponedStateExceededErrorMessage(maxPostponedStateSize: SizeLimit): string;
export declare function readBodyWithSizeLimit(body: AsyncIterable<PostponedRequestBodyChunk>, maxBodySizeBytes: number): Promise<Buffer | null>;
