
    import * as React from 'react';

    import { IconType } from '../types';

    type SiHackclubProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#EC3750';

    const SiHackclub: IconType = React.forwardRef<SVGSVGElement, SiHackclubProps>(function SiHackclub({title = 'Hack Club', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='M12 0C2.4 0 0 2.4 0 12s2.4 12 12 12 12-2.4 12-12S21.6 0 12 0zm4.5 19.5094h-3.3094V13.003c0-.975-.1875-1.6218-.8343-1.6218-.7125 0-1.575 1.003-1.575 2.625v5.503H7.5V4.9689l3.2906-.5625v5.428c.7125-.6468 1.7063-.928 2.7188-.928 2.1562 0 2.9906 1.4156 2.9906 3.628z' />
        </svg>
      );
    });

    export { SiHackclub as default, defaultColor };
  