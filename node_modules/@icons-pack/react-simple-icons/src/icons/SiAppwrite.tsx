
    import * as React from 'react';

    import { IconType } from '../types';

    type SiAppwriteProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#FD366E';

    const SiAppwrite: IconType = React.forwardRef<SVGSVGElement, SiAppwriteProps>(function SiAppwrite({title = 'Appwrite', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='M24 17.291v5.29H10.557A10.58 10.58 0 0 1 0 12.715v-1.43c.048-.735.174-1.463.374-2.171C1.63 4.673 5.713 1.419 10.557 1.419c4.844 0 8.927 3.254 10.183 7.695h-5.749a5.283 5.283 0 0 0-4.434-2.404 5.282 5.282 0 0 0-4.434 2.404A5.23 5.23 0 0 0 5.267 12a5.27 5.27 0 0 0 1.66 3.848 5.27 5.27 0 0 0 3.63 1.443H24Zm0-6.734v5.291h-9.813A5.276 5.276 0 0 0 15.848 12c0-.5-.07-.984-.199-1.443H24Z' />
        </svg>
      );
    });

    export { SiAppwrite as default, defaultColor };
  