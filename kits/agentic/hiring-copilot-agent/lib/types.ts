export interface ToastProps {
  id: string | number;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}