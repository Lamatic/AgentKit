import { type PanelStateKind } from './context';
import './panel-router.css';
export declare const PanelRouter: () => import("react").JSX.Element;
export declare const usePanelContext: () => {
    name: PanelStateKind;
    mounted: boolean;
};
