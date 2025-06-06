import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const modalVariants = cva(
  "fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6",
  {
    variants: {
      position: {
        default: "items-center justify-center",
        top: "items-start justify-center pt-16",
        bottom: "items-end justify-center pb-16",
      },
    },
    defaultVariants: {
      position: "default",
    },
  }
);

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  size?: 'default' | 'lg' | 'xl' | 'full'
  showClose?: boolean;
  blur?: boolean;
}

const Modal = ({ children, ...props }: ModalProps) => (
  <DialogPrimitive.Root {...props}>{children}</DialogPrimitive.Root>
);
Modal.displayName = "Modal";

const ModalTrigger = DialogPrimitive.Trigger;

const ModalPortal = ({
  position,
  className,
  children,
  ...props
}: DialogPrimitive.DialogPortalProps & VariantProps<typeof modalVariants> & { className?: string }) => (
  <DialogPrimitive.Portal {...props}>
    <div className={cn(modalVariants({ position }), className)}>{children}</div>
  </DialogPrimitive.Portal>
);
ModalPortal.displayName = DialogPrimitive.Portal.displayName;

const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & {
    blur?: boolean;
  }
>(({ className, blur = false, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-background/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      blur && "backdrop-blur-sm",
      className
    )}
    {...props}
  />
));
ModalOverlay.displayName = DialogPrimitive.Overlay.displayName;

const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showClose?: boolean;
    blur?: boolean;
  }
>(({ className, children, showClose = true, blur = true, ...props }, ref) => (
  <ModalPortal>
    <ModalOverlay blur={blur} />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 grid w-full max-w-lg scale-100 gap-4 border bg-card p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-center data-[state=open]:slide-in-from-center rounded-lg",
        "sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      {showClose && (
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-accent-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </ModalPortal>
));
ModalContent.displayName = DialogPrimitive.Content.displayName;

const ModalHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
ModalHeader.displayName = "ModalHeader";

const ModalFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
ModalFooter.displayName = "ModalFooter";

const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
ModalTitle.displayName = DialogPrimitive.Title.displayName;

const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
ModalDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
};