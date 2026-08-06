
    import * as React from 'react';

    import { IconType } from '../types';

    type SiNormalizedotcssProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#E3695F';

    const SiNormalizedotcss: IconType = React.forwardRef<SVGSVGElement, SiNormalizedotcssProps>(function SiNormalizedotcss({title = 'Normalize.css', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='M8.427 6.361v5.064l-5.381.705 7.058.924v-1.915l5.469 6.5v-5.064l5.382-.705-7.059-.924v1.914zM12 0l12 12-12 12L0 12Z' />
        </svg>
      );
    });

    export { SiNormalizedotcss as default, defaultColor };
  