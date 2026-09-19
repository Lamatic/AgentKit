import * as React from "react";

/** Card container component. */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-[10px] border border-hairline bg-card p-4 ${className}`}
      {...props}
    />
  )
);
Card.displayName = "Card";

/** Card header component. */
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div ref={ref} className={`flex flex-col space-y-1.5 pb-3 ${className}`} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

/** Card title heading component. */
const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = "", ...props }, ref) => (
    <h3
      ref={ref}
      className={`text-sm font-semibold leading-none tracking-tight text-neutral-900 ${className}`}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

/** Card content component. */
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div ref={ref} className={`${className}`} {...props} />
  )
);
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardContent };
