import { Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  className?: string;
  iconClassName?: string;
}

export default function BrandLogo({ className, iconClassName }: BrandLogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-sm",
        className
      )}
    >
      <Database className={cn("h-3/5 w-3/5", iconClassName)} />
    </span>
  );
}
