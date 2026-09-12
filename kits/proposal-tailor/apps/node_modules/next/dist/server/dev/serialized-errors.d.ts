import { type HmrMessageSentToBrowser } from './hot-reloader-types';
import type { AnyStream } from '../app-render/stream-ops';
export declare function sendSerializedErrorsToClient(errorsRscStream: AnyStream, sendToClient: (message: HmrMessageSentToBrowser) => void): void;
export declare function sendSerializedErrorsToClientForHtmlRequest(htmlRequestId: string, sendToClient: (message: HmrMessageSentToBrowser) => void): void;
export declare function setErrorsRscStreamForHtmlRequest(htmlRequestId: string, errorsRscStream: AnyStream): void;
export declare function deleteErrorsRscStreamForHtmlRequest(htmlRequestId: string): void;
