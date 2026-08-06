
    import * as React from 'react';

    import { IconType } from '../types';

    type SiLibreofficemathProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#C10018';

    const SiLibreofficemath: IconType = React.forwardRef<SVGSVGElement, SiLibreofficemathProps>(function SiLibreofficemath({title = 'LibreOffice Math', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='M22 0v7l-7-7h7zm-9 0 9 9v12c0 1.662-1.338 3-3 3H5c-1.662 0-3-1.338-3-3V3c0-1.662 1.338-3 3-3h8zM8 17H6v1h2v-1zm5 0h-2v1h2v-1zm2.293-1.293a1 1 0 0 0 1.414-1.414l-.793-.793.793-.793a1 1 0 0 0-1.414-1.414l-.793.793-.793-.793a1 1 0 1 0-1.414 1.414l.793.793-.793.793a1 1 0 0 0 1.414 1.414l.793-.793.793.793zM18 17h-2v1h2v-1zm0-8H9.862L8 13.653 7.338 12H6v1h.662L8 16.347 10.539 10H18V9z' />
        </svg>
      );
    });

    export { SiLibreofficemath as default, defaultColor };
  