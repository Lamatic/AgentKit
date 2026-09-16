import * as React from "react";

interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedLabel: React.ReactNode;
  setSelectedLabel: React.Dispatch<React.SetStateAction<React.ReactNode>>;
}

const SelectContext = React.createContext<SelectContextType | undefined>(
  undefined,
);

const useSelect = () => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within a <Select />");
  }
  return context;
};

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

const Select = ({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  children,
}: SelectProps) => {
  const [internalValue, setInternalValue] = React.useState(
    controlledValue ?? defaultValue,
  );
  const [open, setOpen] = React.useState(false);
  const [selectedLabel, setSelectedLabel] =
    React.useState<React.ReactNode>(null);

  const activeValue =
    controlledValue !== undefined ? controlledValue : internalValue;

  const handleValueChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
    setOpen(false);
  };

  return (
    <SelectContext.Provider
      value={{
        value: activeValue,
        onValueChange: handleValueChange,
        open,
        setOpen,
        selectedLabel,
        setSelectedLabel,
      }}
    >
      <div className="relative w-full">{children}</div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className = "", children, ...props }, ref) => {
  const { open, setOpen } = useSelect();

  return (
    <button
      type="button"
      ref={ref}
      onClick={() => setOpen((prev) => !prev)}
      className={`flex h-10 w-full items-center justify-between rounded-lg border border-neutral-700 bg-brand-black px-3 py-2 text-sm text-brand-white focus:outline-none focus:border-brand-red transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
      <svg
        className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${
          open ? "rotate-180" : ""
        }`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const { value, selectedLabel } = useSelect();
  return (
    <span className="block truncate">
      {selectedLabel || value || (
        <span className="text-neutral-500">{placeholder}</span>
      )}
    </span>
  );
};

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = "", children, ...props }, ref) => {
  const { open, setOpen } = useSelect();
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-neutral-800 bg-brand-black p-1 text-brand-white shadow-lg ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});
SelectContent.displayName = "SelectContent";

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className = "", children, value: itemValue, ...props }, ref) => {
    const { value, onValueChange, setSelectedLabel } = useSelect();
    const isSelected = String(value) === String(itemValue);

    React.useEffect(() => {
      if (isSelected) {
        setSelectedLabel(children);
      }
    }, [isSelected, children, setSelectedLabel]);

    return (
      <div
        ref={ref}
        onClick={() => {
          setSelectedLabel(children);
          onValueChange(itemValue);
        }}
        className={`relative flex w-full cursor-pointer select-none items-center justify-between rounded-md px-3 py-2 text-sm outline-none transition ${
          isSelected
            ? "bg-neutral-800 text-brand-red font-semibold"
            : "text-neutral-300 hover:bg-neutral-800 hover:text-brand-white"
        } ${className}`}
        {...props}
      >
        <span className="block truncate">{children}</span>
        {isSelected && (
          <span className="text-brand-red font-bold text-xs">✓</span>
        )}
      </div>
    );
  },
);
SelectItem.displayName = "SelectItem";

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
