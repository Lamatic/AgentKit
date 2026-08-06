
    import * as React from 'react';

    import { IconType } from '../types';

    type SiSucklessProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#1177AA';

    const SiSuckless: IconType = React.forwardRef<SVGSVGElement, SiSucklessProps>(function SiSuckless({title = 'suckless', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='M0 4h24v4H4v2h20v10H0v-4h20v-2H0z' />
        </svg>
      );
    });

    export { SiSuckless as default, defaultColor };
  