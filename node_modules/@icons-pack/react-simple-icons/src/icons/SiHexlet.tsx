
    import * as React from 'react';

    import { IconType } from '../types';

    type SiHexletProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#116EF5';

    const SiHexlet: IconType = React.forwardRef<SVGSVGElement, SiHexletProps>(function SiHexlet({title = 'Hexlet', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='M16.732 7.099v6.422H7.268V7.099L4.563 6.085V24h2.705v-7.775h9.464V24h2.705V6.085l-2.705 1.014Zm3.043-4.057L12 0 4.225 3.042 12 5.746l7.775-2.704Z' />
        </svg>
      );
    });

    export { SiHexlet as default, defaultColor };
  