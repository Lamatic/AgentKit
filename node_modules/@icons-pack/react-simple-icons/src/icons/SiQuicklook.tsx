
    import * as React from 'react';

    import { IconType } from '../types';

    type SiQuicklookProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#0078D3';

    const SiQuicklook: IconType = React.forwardRef<SVGSVGElement, SiQuicklookProps>(function SiQuicklook({title = 'QuickLook', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='m22.682 19.189-.002-.002-3.07-3.068a7.027 7.027 0 0 0 1.332-4.12 7.068 7.068 0 0 0-7.068-7.067V1.037A1.04 1.04 0 0 0 12.653.016L1.67 1.965a.832.832 0 0 0-.687.818v18.434c0 .403.29.748.687.818l10.982 1.949a1.04 1.04 0 0 0 1.22-1.022v-3.894a7.027 7.027 0 0 0 4.12-1.332l3.069 3.07c.446.446 1.17.447 1.617 0h.001c.447-.447.448-1.17.002-1.617zm-8.808-.62a6.576 6.576 0 0 1-6.569-6.57 6.576 6.576 0 0 1 6.569-6.567A6.576 6.576 0 0 1 20.442 12a6.576 6.576 0 0 1-6.568 6.568zm5.28-6.57a5.287 5.287 0 0 1-5.28 5.282c-2.913 0-5.282-2.369-5.282-5.28s2.37-5.282 5.282-5.282a5.287 5.287 0 0 1 5.28 5.28z' />
        </svg>
      );
    });

    export { SiQuicklook as default, defaultColor };
  