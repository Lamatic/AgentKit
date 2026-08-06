
    import * as React from 'react';

    import { IconType } from '../types';

    type SiCommodoreProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#1E2A4E';

    const SiCommodore: IconType = React.forwardRef<SVGSVGElement, SiCommodoreProps>(function SiCommodore({title = 'Commodore', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='M11.202.798C5.016.798 0 5.814 0 12s5.016 11.202 11.202 11.202c1.094 0 2.153-.157 3.154-.45v-5.335a6.27 6.27 0 1 1 0-10.839v-5.33c-1-.293-2.057-.45-3.154-.45Zm3.375 6.343v4.304h5.27L24 7.14Zm-.037 5.377v4.304h9.423l-4.156-4.304z' />
        </svg>
      );
    });

    export { SiCommodore as default, defaultColor };
  