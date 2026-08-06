
    import * as React from 'react';

    import { IconType } from '../types';

    type SiAlpinedotjsProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#8BC0D0';

    const SiAlpinedotjs: IconType = React.forwardRef<SVGSVGElement, SiAlpinedotjsProps>(function SiAlpinedotjs({title = 'Alpine.js', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='m24 12-5.72 5.746-5.724-5.741 5.724-5.75L24 12zM5.72 6.254 0 12l5.72 5.746h11.44L5.72 6.254z' />
        </svg>
      );
    });

    export { SiAlpinedotjs as default, defaultColor };
  