
    import * as React from 'react';

    import { IconType } from '../types';

    type SiBandcampProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#408294';

    const SiBandcamp: IconType = React.forwardRef<SVGSVGElement, SiBandcampProps>(function SiBandcamp({title = 'Bandcamp', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='M0 18.75l7.437-13.5H24l-7.438 13.5H0z' />
        </svg>
      );
    });

    export { SiBandcamp as default, defaultColor };
  