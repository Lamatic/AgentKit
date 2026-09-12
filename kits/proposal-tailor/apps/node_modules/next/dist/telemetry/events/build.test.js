"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _build = require("./build");
describe('eventBuildFeatureUsageFromTurbopackDiagnostics', ()=>{
    it('returns empty for empty input', ()=>{
        expect((0, _build.eventBuildFeatureUsageFromTurbopack)([])).toEqual([]);
    });
    it('maps a single diagnostic to one event', ()=>{
        const events = (0, _build.eventBuildFeatureUsageFromTurbopack)([
            {
                featureName: 'next/image',
                invocationCount: 3
            }
        ]);
        expect(events).toEqual([
            {
                eventName: _build.EVENT_BUILD_FEATURE_USAGE,
                payload: {
                    featureName: 'next/image',
                    invocationCount: 3
                }
            }
        ]);
    });
    it('preserves invocationCount of 0 for disabled boolean flags', ()=>{
        const events = (0, _build.eventBuildFeatureUsageFromTurbopack)([
            {
                featureName: 'swcRelay',
                invocationCount: 0
            }
        ]);
        expect(events).toEqual([
            {
                eventName: _build.EVENT_BUILD_FEATURE_USAGE,
                payload: {
                    featureName: 'swcRelay',
                    invocationCount: 0
                }
            }
        ]);
    });
    it('passes through multiple distinct diagnostics (already aggregated Rust-side)', ()=>{
        const events = (0, _build.eventBuildFeatureUsageFromTurbopack)([
            {
                featureName: 'next/image',
                invocationCount: 2
            },
            {
                featureName: 'next/script',
                invocationCount: 1
            }
        ]);
        expect(events).toEqual([
            {
                eventName: _build.EVENT_BUILD_FEATURE_USAGE,
                payload: {
                    featureName: 'next/image',
                    invocationCount: 2
                }
            },
            {
                eventName: _build.EVENT_BUILD_FEATURE_USAGE,
                payload: {
                    featureName: 'next/script',
                    invocationCount: 1
                }
            }
        ]);
    });
});

//# sourceMappingURL=build.test.js.map