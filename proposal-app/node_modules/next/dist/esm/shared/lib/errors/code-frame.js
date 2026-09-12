import { getBindingsSync } from '../../../build/swc';
/**
 * Renders a code frame showing the location of an error in source code.
 * Requires native bindings to be installed — throws otherwise.
 */ export function codeFrameColumns(file, location, options = {}) {
    // Default to the terminal width
    if (options.maxWidth === undefined) {
        options.maxWidth = process.stdout.columns;
    }
    return getBindingsSync().codeFrameColumns(file, location, options);
}

//# sourceMappingURL=code-frame.js.map