
    import * as React from 'react';

    import { IconType } from '../types';

    type SiVuetifyProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#1867C0';

    const SiVuetify: IconType = React.forwardRef<SVGSVGElement, SiVuetifyProps>(function SiVuetify({title = 'Vuetify', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='M6.312 12.564 12.636 1.2H0l6.312 11.364ZM14.94 1.2 7.464 14.64 12 22.8 24 1.2h-9.06Zm4.98 2.4L12 17.856l-1.788-3.216L16.344 3.6h3.576ZM6.312 7.62 4.08 3.6h4.476L6.312 7.62Z' />
        </svg>
      );
    });

    export { SiVuetify as default, defaultColor };
  