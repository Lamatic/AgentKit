// Keep in sync with Turbopack's experimental React switch: file://./../../../../crates/next-core/src/next_import_map.rs
export function needsExperimentalReact(config) {
    const { blockingSSR, taint, transitionIndicator, gestureTransition } = config.experimental || {};
    return Boolean(blockingSSR || taint || transitionIndicator || gestureTransition);
}

//# sourceMappingURL=needs-experimental-react.js.map