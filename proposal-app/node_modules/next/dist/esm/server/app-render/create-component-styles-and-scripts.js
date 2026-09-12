import { interopDefault } from './interop-default';
import { getLinkAndScriptTags } from './get-css-inlined-link-tags';
import { getAssetQueryString } from './get-asset-query-string';
import { encodeURIPath } from '../../shared/lib/encode-uri-path';
import { renderCssResource } from './render-css-resource';
export async function createComponentStylesAndScripts({ filePath, getComponent, injectedCSS, injectedJS, ctx }) {
    const { componentMod: { createElement } } = ctx;
    const { styles: entryCssFiles, scripts: jsHrefs } = getLinkAndScriptTags(filePath, injectedCSS, injectedJS);
    const styles = renderCssResource(entryCssFiles, ctx);
    const scripts = [];
    let scriptIndex = 0;
    for (const href of jsHrefs){
        scripts.push(createElement('script', {
            src: `${ctx.assetPrefix}/_next/${encodeURIPath(href)}${getAssetQueryString(ctx, true)}`,
            async: true,
            key: `script-${scriptIndex}`,
            nonce: ctx.nonce
        }));
        scriptIndex++;
    }
    const Comp = interopDefault(await getComponent());
    return [
        Comp,
        styles,
        scripts.length ? scripts : null
    ];
}

//# sourceMappingURL=create-component-styles-and-scripts.js.map