
    import * as React from 'react';

    import { IconType } from '../types';

    type SiSourcehutProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#000000';

    const SiSourcehut: IconType = React.forwardRef<SVGSVGElement, SiSourcehutProps>(function SiSourcehut({title = 'SourceHut', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='M12 0C5.371 0 0 5.371 0 12s5.371 12 12 12 12-5.371 12-12S18.629 0 12 0Zm0 21.677A9.675 9.675 0 0 1 2.323 12 9.675 9.675 0 0 1 12 2.323 9.675 9.675 0 0 1 21.677 12 9.675 9.675 0 0 1 12 21.677Z' />
        </svg>
      );
    });

    export { SiSourcehut as default, defaultColor };
  