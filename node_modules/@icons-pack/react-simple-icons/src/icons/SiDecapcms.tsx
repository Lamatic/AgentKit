
    import * as React from 'react';

    import { IconType } from '../types';

    type SiDecapcmsProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#FF0082';

    const SiDecapcms: IconType = React.forwardRef<SVGSVGElement, SiDecapcmsProps>(function SiDecapcms({title = 'Decap CMS', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='M18.947 13.177c0 3.263-2 5.649-4.736 5.649h-2.773v-5.65H6.282v10.387h7.93c5.403 0 9.788-4.668 9.788-10.386h-5.052ZM7.894.476 0 1.212l.948 10.352 5.157-.456-.526-5.615 2.737-.245c2.737-.246 4.91 1.93 5.227 5.193l5.052-.458c-.49-5.752-5.297-9.998-10.7-9.507Z' />
        </svg>
      );
    });

    export { SiDecapcms as default, defaultColor };
  