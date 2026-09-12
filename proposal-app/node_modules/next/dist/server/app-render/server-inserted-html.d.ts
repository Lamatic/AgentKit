import type { JSX } from 'react';
export declare function createServerInsertedHTML(): {
    ServerInsertedHTMLProvider({ children }: {
        children: JSX.Element;
    }): JSX.Element;
    renderServerInsertedHTML(): JSX.Element[];
};
