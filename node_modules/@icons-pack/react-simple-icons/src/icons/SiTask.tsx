
    import * as React from 'react';

    import { IconType } from '../types';

    type SiTaskProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#29BEB0';

    const SiTask: IconType = React.forwardRef<SVGSVGElement, SiTaskProps>(function SiTask({title = 'Task', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='M1.857 18.013 11.736 24V12.456L1.857 6.468Zm20.286 0V6.468l-9.879 5.988V24Zm-.246-12.014L12 0 2.103 5.999 12 11.998Z' />
        </svg>
      );
    });

    export { SiTask as default, defaultColor };
  