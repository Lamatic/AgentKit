
    import * as React from 'react';

    import { IconType } from '../types';

    type SiRetoolProps = React.ComponentPropsWithoutRef<'svg'> & {
      /**
       * The title provides an accessible short text description to the SVG
       */
      title?: string;
      /**
       * Hex color or color name or "default" to use the default hex for each icon
       */
      color?: string;
      /**
       * The size of the Icon.
       */
      size?: string | number;
    }

    const defaultColor = '#3D3D3D';

    const SiRetool: IconType = React.forwardRef<SVGSVGElement, SiRetoolProps>(function SiRetool({title = 'Retool', color = 'currentColor', size = 24, ...others }, ref) {
      if (color === 'default') {
        color = defaultColor;
      }

      return (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width={size}
          height={size}
          fill={color}
          viewBox='0 0 24 24'
          ref={ref}
          {...others}
        >
          <title>{title}</title>
          <path d='M0 2.2A2.2 2.2 0 0 1 2.2 0h8.6A2.2 2.2 0 0 1 13 2.2v1.7A1.1 1.1 0 0 1 11.9 5H1.1A1.1 1.1 0 0 1 0 3.9V2.2zm0 6.9A1.1 1.1 0 0 1 1.1 8h20.7a2.2 2.2 0 0 1 2.2 2.2v5.7a1.1 1.1 0 0 1-1.1 1.1H2.2A2.2 2.2 0 0 1 0 14.8V9.1zm11 12a1.1 1.1 0 0 1 1.1-1.1h10.8a1.1 1.1 0 0 1 1.1 1.1v.7a2.2 2.2 0 0 1-2.2 2.2h-8.6a2.2 2.2 0 0 1-2.2-2.2v-.7z' />
        </svg>
      );
    });

    export { SiRetool as default, defaultColor };
  