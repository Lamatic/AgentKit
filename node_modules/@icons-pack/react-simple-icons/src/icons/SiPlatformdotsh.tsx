
    import * as React from 'react';

    import { IconType } from '../types';

    type SiPlatformdotshProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#1A182A';

    const SiPlatformdotsh: IconType = React.forwardRef<SVGSVGElement, SiPlatformdotshProps>(function SiPlatformdotsh({title = 'Platform.sh', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='M24 0H0v9.541h24V0zM24 20.755H0V24h24v-3.245zM0 12.618h24v4.892H0v-4.892z' />
        </svg>
      );
    });

    export { SiPlatformdotsh as default, defaultColor };
  