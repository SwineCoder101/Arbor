import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const tabListVariants = cva("flex", {
  variants: {
    variant: {
      default: "border-b border-border",
      card: "bg-muted p-1 rounded-lg",
      outline: "rounded-lg border border-border p-1",
      minimal: "gap-4",
    },
    size: {
      default: "gap-2",
      sm: "gap-1",
      lg: "gap-4",
    },
    fullWidth: {
      true: "w-full",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
    fullWidth: false,
  },
});

const tabVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-all focus-visible:outline-none disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "text-muted-foreground hover:text-foreground data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary -mb-px px-1 h-9",
        card: "text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground rounded-md",
        outline:
          "text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground rounded-md",
        minimal:
          "text-muted-foreground hover:text-foreground data-[state=active]:text-primary data-[state=active]:font-medium",
      },
      size: {
        default: "text-sm px-3 py-1.5",
        sm: "text-xs px-2 py-1",
        lg: "text-base px-4 py-2",
      },
      fullWidth: {
        true: "flex-1",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  }
);

interface TabsProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tabListVariants> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({
  className,
  variant,
  size,
  fullWidth,
  defaultValue,
  value,
  onValueChange,
  children,
  ...props
}: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(value || defaultValue);

  React.useEffect(() => {
    if (value !== undefined) {
      setActiveTab(value);
    }
  }, [value]);

  const handleTabClick = (tabValue: string) => {
    if (value === undefined) {
      setActiveTab(tabValue);
    }
    onValueChange?.(tabValue);
  };

  // Filter out non-Tab children
  const tabChildren = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === Tab
  );

  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div className={tabListVariants({ variant, size, fullWidth })}>
        {React.Children.map(tabChildren, (child) => {
          if (!React.isValidElement(child)) return null;
          
          const childElement = child as React.ReactElement<TabProps>;
          const tabValue = childElement.props.value;
          const isActive = activeTab === tabValue;
          
          return React.cloneElement(childElement, {
            variant,
            size,
            fullWidth,
            isActive,
            onClick: () => handleTabClick(tabValue),
          });
        })}
      </div>
      <div className="mt-2">
        {React.Children.map(tabChildren, (child) => {
          if (!React.isValidElement(child)) return null;
          
          const childElement = child as React.ReactElement<TabProps>;
          const tabValue = childElement.props.value;
          const isActive = activeTab === tabValue;
          return isActive ? childElement.props.children : null;
        })}
      </div>
    </div>
  );
}

interface TabProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value">,
    VariantProps<typeof tabVariants> {
  value: string;
  isActive?: boolean;
  children?: React.ReactNode;
}

export function Tab({
  className,
  variant,
  size,
  fullWidth,
  // value,
  isActive,
  // children,
  ...props
}: TabProps) {
  return (
    <button
      className={cn(
        tabVariants({ variant, size, fullWidth }),
        className
      )}
      data-state={isActive ? "active" : "inactive"}
      {...props}
    >
      {props.children}
    </button>
  );
}

Tabs.Tab = Tab;