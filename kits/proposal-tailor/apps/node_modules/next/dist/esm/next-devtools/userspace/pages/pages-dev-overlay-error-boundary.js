import React from 'react';
export class PagesDevOverlayErrorBoundary extends React.PureComponent {
    static getDerivedStateFromError(_) {
        return {
            hasError: true
        };
    }
    // Explicit type is needed to avoid the generated `.d.ts` having a wide return type that could be specific to the `@types/react` version.
    render() {
        // The component has to be unmounted or else it would continue to error
        return this.state.hasError ? null : this.props.children;
    }
    constructor(...args){
        super(...args), this.state = {
            hasError: false
        };
    }
}

//# sourceMappingURL=pages-dev-overlay-error-boundary.js.map