
    import * as React from 'react';

    import { IconType } from '../types';

    type SiPurismProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#2D2D2D';

    const SiPurism: IconType = React.forwardRef<SVGSVGElement, SiPurismProps>(function SiPurism({title = 'Purism', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='M24 19.588H0V4.412h24zM2.824 16.765h18.352v-9.53H2.824Z' />
        </svg>
      );
    });

    export { SiPurism as default, defaultColor };
  