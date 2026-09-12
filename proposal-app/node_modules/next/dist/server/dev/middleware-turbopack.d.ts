import type { IncomingMessage, ServerResponse } from 'http';
import { type OriginalStackFramesResponse, type StackFrame } from '../../next-devtools/server/shared';
import type { Project } from '../../build/swc/types';
/**
 * Code frame rendering options. The defaults match terminal consumers; only
 * the overlay HTTP path opts in to always-on colors and the wide max width.
 */
type CodeFrameOptions = {
    /** Defaults to `process.stdout.isTTY`. */
    colors?: boolean;
    /** Defaults to the dev server's terminal width. */
    maxWidth?: number;
};
export declare function getOverlayMiddleware({ project, projectPath, isSrcDir, }: {
    project: Project;
    projectPath: string;
    isSrcDir: boolean;
}): (req: IncomingMessage, res: ServerResponse, next: () => void) => Promise<void>;
export declare function getSourceMapMiddleware(project: Project): (req: IncomingMessage, res: ServerResponse, next: () => void) => Promise<void>;
export declare function getOriginalStackFrames({ project, projectPath, frames, isServer, isEdgeServer, isAppDirectory, codeFrameOptions, }: {
    project: Project;
    projectPath: string;
    frames: readonly StackFrame[];
    isServer: boolean;
    isEdgeServer: boolean;
    isAppDirectory: boolean;
    codeFrameOptions?: CodeFrameOptions;
}): Promise<OriginalStackFramesResponse>;
export {};
