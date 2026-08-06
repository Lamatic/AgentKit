
    import * as React from 'react';

    import { IconType } from '../types';

    type SiEclipseadoptiumProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#FF1464';

    const SiEclipseadoptium: IconType = React.forwardRef<SVGSVGElement, SiEclipseadoptiumProps>(function SiEclipseadoptium({title = 'Eclipse Adoptium', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='m11.98 14.013-2.632 5.729 6.813 3.058c-1.55-2.754-2.82-5.852-4.18-8.787Zm11.033 4.645L16.277 4.064a3.952 3.952 0 0 1-.387 1.471l-3.6 7.82 3.871 8.361a3.76 3.76 0 0 0 3.445 2.245 3.734 3.734 0 0 0 3.755-3.755c0-.542-.155-1.045-.348-1.548zM15.735 3.755A3.734 3.734 0 0 0 11.982 0C10.51 0 9.27.852 8.65 2.052 6.119 7.582 3.544 13.127.988 18.658c-.232.464-.348 1.006-.348 1.587A3.734 3.734 0 0 0 4.394 24a3.76 3.76 0 0 0 3.445-2.245l7.587-16.413c.193-.503.31-1.045.31-1.587z' />
        </svg>
      );
    });

    export { SiEclipseadoptium as default, defaultColor };
  