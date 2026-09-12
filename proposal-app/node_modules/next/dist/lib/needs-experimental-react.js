"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "needsExperimentalReact", {
    enumerable: true,
    get: function() {
        return needsExperimentalReact;
    }
});
function needsExperimentalReact(config) {
    const { blockingSSR, taint, transitionIndicator, gestureTransition } = config.experimental || {};
    return Boolean(blockingSSR || taint || transitionIndicator || gestureTransition);
}

//# sourceMappingURL=needs-experimental-react.js.map