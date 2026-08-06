
    import * as React from 'react';

    import { IconType } from '../types';

    type SiMedusaProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#000000';

    const SiMedusa: IconType = React.forwardRef<SVGSVGElement, SiMedusaProps>(function SiMedusa({title = 'Medusa', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='M20.325 3.8958 14.8913.7692a5.7283 5.7283 0 0 0-5.7342 0L3.6983 3.8958C1.9455 4.9213.8437 6.8223.8437 8.8484v6.2783c0 2.051 1.1018 3.927 2.8546 4.9526l5.4337 3.1515a5.7283 5.7283 0 0 0 5.7343 0l5.4338-3.1515c1.7778-1.0256 2.8545-2.9015 2.8545-4.9526V8.8484c.0501-2.026-1.0517-3.927-2.8296-4.9526Zm-8.3133 13.6821c-3.08 0-5.584-2.5013-5.584-5.5778 0-3.0767 2.504-5.578 5.584-5.578 3.08 0 5.609 2.5013 5.609 5.578 0 3.0765-2.504 5.5778-5.609 5.5778z' />
        </svg>
      );
    });

    export { SiMedusa as default, defaultColor };
  