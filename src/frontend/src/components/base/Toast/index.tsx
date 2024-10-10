/* eslint-disable @/max-len */
"use client";

import { useTheme } from "next-themes";
import { Toaster, ToastT, toast, useSonner } from "sonner";

export type { ToastT as IToast };

type AreaProps = React.ComponentProps<typeof Toaster>;

const Area = ({ ...props }: AreaProps) => {
    const { theme = "system" } = useTheme();

    return (
        <Toaster
            theme={theme as AreaProps["theme"]}
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                    description: "group-[.toast]:text-muted-foreground",
                    actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                },
            }}
            {...props}
        />
    );
};

export { Area, toast as Add, useSonner as useToast };
