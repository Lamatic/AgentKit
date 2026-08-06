
    import * as React from 'react';

    import { IconType } from '../types';

    type SiVectorlogozoneProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#184D66';

    const SiVectorlogozone: IconType = React.forwardRef<SVGSVGElement, SiVectorlogozoneProps>(function SiVectorlogozone({title = 'Vector Logo Zone', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='M19.458 0l-5.311 2.024 1.989.534-4.847 16.085-4.867-16.25H1.48L8.974 24h4.645l7.043-20.226 1.858.499Z' />
        </svg>
      );
    });

    export { SiVectorlogozone as default, defaultColor };
  