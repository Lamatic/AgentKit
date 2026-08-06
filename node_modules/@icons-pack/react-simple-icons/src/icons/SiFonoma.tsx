
    import * as React from 'react';

    import { IconType } from '../types';

    type SiFonomaProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#02B78F';

    const SiFonoma: IconType = React.forwardRef<SVGSVGElement, SiFonomaProps>(function SiFonoma({title = 'Fonoma', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='M19.706 21.919a4.295 4.295 0 0 0 4.293-4.296 4.295 4.295 0 1 0-4.293 4.296zM4.296 10.672a4.295 4.295 0 0 0 4.293-4.295 4.295 4.295 0 1 0-4.294 4.295zm10.412 0h4.975a4.277 4.277 0 0 0 4.293-4.295 4.277 4.277 0 0 0-4.293-4.296h-4.975a4.277 4.277 0 0 0-4.294 4.296 4.277 4.277 0 0 0 4.294 4.295zM4.295 21.92h4.976a4.277 4.277 0 0 0 4.293-4.296 4.277 4.277 0 0 0-4.293-4.295H4.295a4.277 4.277 0 0 0-4.293 4.295c.068 2.318 1.976 4.296 4.293 4.296z' />
        </svg>
      );
    });

    export { SiFonoma as default, defaultColor };
  