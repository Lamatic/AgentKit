import { codeFrameColumns } from '../../shared/lib/errors/code-frame';
import { ignoreListAnonymousStackFramesIfSandwiched as ignoreListAnonymousStackFramesIfSandwichedGeneric } from '../../server/lib/source-maps';
export const DEVTOOLS_CODE_FRAME_MAX_WIDTH = 1000;
export function ignoreListAnonymousStackFramesIfSandwiched(responses) {
    ignoreListAnonymousStackFramesIfSandwichedGeneric(responses, (response)=>{
        return response.status === 'fulfilled' && response.value.originalStackFrame !== null && response.value.originalStackFrame.file === '<anonymous>';
    }, (response)=>{
        return response.status === 'fulfilled' && response.value.originalStackFrame !== null && response.value.originalStackFrame.ignored === true;
    }, (response)=>{
        return response.status === 'fulfilled' && response.value.originalStackFrame !== null ? response.value.originalStackFrame.methodName : '';
    }, (response)=>{
        ;
        response.value.originalStackFrame.ignored = true;
    });
}
/**
 * It looks up the code frame of the traced source.
 * @note It ignores Next.js/React internals, as these can often be huge bundled files.
 */ export function getOriginalCodeFrame(frame, source, colorsOrOptions = process.stdout?.isTTY ?? false) {
    if (!source || frame.line1 == null) {
        return null;
    }
    const { colors, maxWidth } = typeof colorsOrOptions === 'boolean' ? {
        colors: colorsOrOptions,
        maxWidth: undefined
    } : {
        colors: colorsOrOptions.colors ?? process.stdout?.isTTY ?? false,
        maxWidth: colorsOrOptions.maxWidth
    };
    return codeFrameColumns(source, {
        start: {
            line: frame.line1,
            column: frame.column1 ?? undefined
        }
    }, {
        color: colors,
        maxWidth
    }) ?? null;
}

//# sourceMappingURL=shared.js.map