"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "getLayerAssets", {
    enumerable: true,
    get: function() {
        return getLayerAssets;
    }
});
const _getcssinlinedlinktags = require("./get-css-inlined-link-tags");
const _getpreloadablefonts = require("./get-preloadable-fonts");
const _getassetquerystring = require("./get-asset-query-string");
const _encodeuripath = require("../../shared/lib/encode-uri-path");
const _rendercssresource = require("./render-css-resource");
const EMPTY_SET = new Set();
function getLayerAssets({ ctx, layoutOrPagePath, injectedCSS: injectedCSSWithCurrentLayout, injectedJS: injectedJSWithCurrentLayout, injectedFontPreloadTags: injectedFontPreloadTagsWithCurrentLayout, preloadCallbacks }) {
    const { componentMod: { createElement } } = ctx;
    const { styles: styleTags, scripts: scriptTags } = layoutOrPagePath ? (0, _getcssinlinedlinktags.getLinkAndScriptTags)(layoutOrPagePath, injectedCSSWithCurrentLayout, injectedJSWithCurrentLayout, true) : {
        styles: EMPTY_SET,
        scripts: EMPTY_SET
    };
    const preloadedFontFiles = layoutOrPagePath ? (0, _getpreloadablefonts.getPreloadableFonts)(ctx.renderOpts.nextFontManifest, layoutOrPagePath, injectedFontPreloadTagsWithCurrentLayout) : null;
    if (preloadedFontFiles) {
        if (preloadedFontFiles.length) {
            for(let i = 0; i < preloadedFontFiles.length; i++){
                const fontFilename = preloadedFontFiles[i];
                const ext = /\.(woff|woff2|eot|ttf|otf)$/.exec(fontFilename)[1];
                const type = `font/${ext}`;
                const href = `${ctx.assetPrefix}/_next/${(0, _encodeuripath.encodeURIPath)(fontFilename)}${(0, _getassetquerystring.getAssetQueryString)(ctx, true)}`;
                preloadCallbacks.push(()=>{
                    ctx.componentMod.preloadFont(href, type, ctx.renderOpts.crossOrigin, ctx.nonce);
                });
            }
        } else {
            try {
                let url = new URL(ctx.assetPrefix);
                preloadCallbacks.push(()=>{
                    ctx.componentMod.preconnect(url.origin, 'anonymous', ctx.nonce);
                });
            } catch (error) {
                // assetPrefix must not be a fully qualified domain name. We assume
                // we should preconnect to same origin instead
                preloadCallbacks.push(()=>{
                    ctx.componentMod.preconnect('/', 'anonymous', ctx.nonce);
                });
            }
        }
    }
    const styles = (0, _rendercssresource.renderCssResource)(styleTags, ctx, preloadCallbacks);
    const scripts = [];
    let scriptIndex = 0;
    for (const href of scriptTags){
        const fullSrc = `${ctx.assetPrefix}/_next/${(0, _encodeuripath.encodeURIPath)(href)}${(0, _getassetquerystring.getAssetQueryString)(ctx, true)}`;
        scripts.push(createElement('script', {
            src: fullSrc,
            async: true,
            key: `script-${scriptIndex}`,
            nonce: ctx.nonce
        }));
        scriptIndex++;
    }
    return styles.length || scripts.length ? [
        ...styles,
        ...scripts
    ] : null;
}

//# sourceMappingURL=get-layer-assets.js.map