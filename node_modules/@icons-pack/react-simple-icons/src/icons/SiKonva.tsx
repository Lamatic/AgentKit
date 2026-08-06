
    import * as React from 'react';

    import { IconType } from '../types';

    type SiKonvaProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#0D83CD';

    const SiKonva: IconType = React.forwardRef<SVGSVGElement, SiKonvaProps>(function SiKonva({title = 'Konva', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm1.391 18.541-.239-3.76-2.391-1.608.152 5.129-4.325.152-.173-13.409L10.5 4.98l.087 5.346 2.217-1.608.109-3.781 4.412.283-.348 4.586-2.608 1.608 2.673 1.174.913 5.694-4.564.259z' />
        </svg>
      );
    });

    export { SiKonva as default, defaultColor };
  