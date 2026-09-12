export interface UploadTraceOptions {
    directory?: string;
}
export declare function uploadTraceToBlob(options: UploadTraceOptions): Promise<void>;
