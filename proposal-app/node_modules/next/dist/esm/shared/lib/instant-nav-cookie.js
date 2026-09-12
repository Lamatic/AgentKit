export function parseInstantNavCookieValue(raw) {
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length >= 3) {
            const rawState = parsed[2];
            if (rawState === null) {
                return {
                    state: 'mpa'
                };
            }
            // SPA capture: rawState is { from, to }
            if (typeof rawState === 'object' && rawState !== null) {
                const fromTree = rawState.from ?? [
                    '',
                    {}
                ];
                const toTree = rawState.to ?? null;
                return {
                    state: 'spa',
                    fromTree,
                    toTree
                };
            }
            return {
                state: 'spa',
                fromTree: [
                    '',
                    {}
                ],
                toTree: null
            };
        }
    } catch  {}
    return {
        state: 'pending'
    };
}

//# sourceMappingURL=instant-nav-cookie.js.map