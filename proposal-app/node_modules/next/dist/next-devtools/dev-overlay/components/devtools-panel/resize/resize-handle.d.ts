import type { Corners } from '../../../shared';
import { type ResizeDirection } from './resize-provider';
import './resize-handle.css';
export declare const ResizeHandle: ({ direction, position, }: {
    direction: ResizeDirection;
    position: Corners;
}) => import("react").JSX.Element | null;
