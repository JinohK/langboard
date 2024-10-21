"use client";

import { useTheme } from "next-themes";
import { Toaster, ToastT, toast, useSonner } from "sonner";

export type { ToastT as IToast };

type AreaProps = React.ComponentProps<typeof Toaster>;

const Area = ({ ...props }: AreaProps) => {
    const { theme } = useTheme();

    return (
        <Toaster
            theme={theme as AreaProps["theme"]}
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast: "group toast group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                    description: "group-[.toast]:text-muted-foreground",
                    actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                    error: "group toast group-[.toaster]:bg-red group-[.toaster]:text-red-600 group-[.toaster]:shadow-lg",
                    success: "group toast group-[.toaster]:bg-green group-[.toaster]:text-green-600 group-[.toaster]:shadow-lg",
                    warning: "group toast group-[.toaster]:bg-yellow group-[.toaster]:text-yellow-600 group-[.toaster]:shadow-lg",
                    info: "group toast group-[.toaster]:bg-blue group-[.toaster]:text-blue-600 group-[.toaster]:shadow-lg",
                },
            }}
            {...props}
        />
    );
};

export { Area, toast as Add, useSonner as useToast };
