
    import * as React from 'react';

    import { IconType } from '../types';

    type SiCratedbProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#009DC7';

    const SiCratedb: IconType = React.forwardRef<SVGSVGElement, SiCratedbProps>(function SiCratedb({title = 'CrateDB', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='M18 9V3h-6v6H0v6h6v6h6v-6h12V9h-6z' />
        </svg>
      );
    });

    export { SiCratedb as default, defaultColor };
  