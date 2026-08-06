
    import * as React from 'react';

    import { IconType } from '../types';

    type SiZincsearchProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#5BA37F';

    const SiZincsearch: IconType = React.forwardRef<SVGSVGElement, SiZincsearchProps>(function SiZincsearch({title = 'ZincSearch', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='m18.723 19.748-1.73 1.493H.678L0 18.77l10.63-9.343.542 6.635h8.701a3.649 3.649 0 0 1-1.15 3.686zM5.277 4.252l1.73-1.493h16.316L24 5.23l-10.63 9.343-.542-6.635H4.129a3.648 3.648 0 0 1 1.148-3.686Z' />
        </svg>
      );
    });

    export { SiZincsearch as default, defaultColor };
  