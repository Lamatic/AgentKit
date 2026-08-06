
    import * as React from 'react';

    import { IconType } from '../types';

    type SiMantineProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#339AF0';

    const SiMantine: IconType = React.forwardRef<SVGSVGElement, SiMantineProps>(function SiMantine({title = 'Mantine', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='M12 0C5.377 0 0 5.377 0 12s5.377 12 12 12 12-5.377 12-12S18.623 0 12 0zm-1.613 6.15a.91.91 0 0 1 .59.176c.43.317.825.68 1.177 1.082h2.588a.91.91 0 0 1 .912.906.909.909 0 0 1-.912.907h-1.43c.4.908.604 1.889.602 2.88a7.133 7.133 0 0 1-.601 2.883h1.427a.91.91 0 0 1 .914.907.91.91 0 0 1-.914.906h-2.588a7.399 7.399 0 0 1-1.175 1.082.919.919 0 0 1-1.28-.19.904.904 0 0 1 .191-1.268 5.322 5.322 0 0 0 2.2-4.32c0-1.715-.801-3.29-2.2-4.32a.906.906 0 0 1-.191-1.268H9.7a.916.916 0 0 1 .688-.363zm-.778 4.295a1.36 1.36 0 0 1 1.354 1.354v.033a1.36 1.36 0 0 1-1.354 1.32 1.36 1.36 0 0 1-1.353-1.32v-.033a1.36 1.36 0 0 1 1.353-1.354z' />
        </svg>
      );
    });

    export { SiMantine as default, defaultColor };
  