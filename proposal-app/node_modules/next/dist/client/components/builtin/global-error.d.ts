import React from 'react';
export type GlobalErrorComponent = React.ComponentType<{
    error: any;
    reset: () => void;
    retry: () => void;
}>;
declare function DefaultGlobalError({ error }: {
    error: any;
}): React.JSX.Element;
export default DefaultGlobalError;
