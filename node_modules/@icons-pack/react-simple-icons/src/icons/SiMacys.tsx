
    import * as React from 'react';

    import { IconType } from '../types';

    type SiMacysProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#E21A2C';

    const SiMacys: IconType = React.forwardRef<SVGSVGElement, SiMacysProps>(function SiMacys({title = 'Macys', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='M12.015.624L9.19 9.293H0l7.445 5.384-2.819 8.673L12 17.986l7.422 5.393-2.835-8.713L24 9.292h-9.162L12.015.622v.002z' />
        </svg>
      );
    });

    export { SiMacys as default, defaultColor };
  