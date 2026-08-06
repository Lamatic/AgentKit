
    import * as React from 'react';

    import { IconType } from '../types';

    type SiKotlinProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#7F52FF';

    const SiKotlin: IconType = React.forwardRef<SVGSVGElement, SiKotlinProps>(function SiKotlin({title = 'Kotlin', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='M24 24H0V0h24L12 12Z' />
        </svg>
      );
    });

    export { SiKotlin as default, defaultColor };
  