
    import * as React from 'react';

    import { IconType } from '../types';

    type SiMentorcruiseProps = React.ComponentPropsWithoutRef<'svg'> & {
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

    const defaultColor = '#172E59';

    const SiMentorcruise: IconType = React.forwardRef<SVGSVGElement, SiMentorcruiseProps>(function SiMentorcruise({title = 'MentorCruise', color = 'currentColor', size = 24, ...others }, ref) {
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
          <path d='M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0Zm-.387 3.791v8.08H6.947c1.557-2.693 3.111-5.386 4.666-8.08Zm.774 0c1.554 2.694 3.11 5.387 4.666 8.08h-4.666Zm-9.244 8.854h17.714l-1.68 2.91H4.823Zm2.125 3.683h13.464l-1.68 2.908H6.948Z' />
        </svg>
      );
    });

    export { SiMentorcruise as default, defaultColor };
  