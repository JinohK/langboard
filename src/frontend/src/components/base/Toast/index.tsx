"use client";

import { cn } from "@/core/utils/ComponentUtils";
import { useTheme } from "next-themes";
import { Toaster, ToastT, toast, useSonner } from "sonner";

export type { ToastT as IToast };

type AreaProps = React.ComponentProps<typeof Toaster>;

const Area = ({ ...props }: AreaProps) => {
    const { theme } = useTheme();

    const sharedToastClassNames = "group toast group-[.toaster]:shadow-lg";

    return (
        <Toaster
            theme={theme as AreaProps["theme"]}
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast: cn(sharedToastClassNames, "group-[.toaster]:text-foreground group-[.toaster]:border-border"),
                    description: "group-[.toast]:text-muted-foreground",
                    actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                    error: cn(sharedToastClassNames, "group-[.toaster]:bg-red group-[.toaster]:text-red-600"),
                    success: cn(sharedToastClassNames, "group-[.toaster]:bg-green group-[.toaster]:text-green-600"),
                    warning: cn(sharedToastClassNames, "group-[.toaster]:bg-yellow group-[.toaster]:text-yellow-600"),
                    info: cn(sharedToastClassNames, "group-[.toaster]:bg-blue group-[.toaster]:text-blue-600"),
                },
            }}
            cn={cn}
            {...props}
        />
    );
};

export { Area, toast as Add, useSonner as useToast };
