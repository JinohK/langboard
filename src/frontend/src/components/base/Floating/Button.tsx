import { IconComponent } from "@/components/base";
import { default as BaseButton, ButtonProps } from "@/components/base/Button";
import { cn } from "@/core/utils/ComponentUtils";
import { Children, forwardRef, isValidElement } from "react";

const Content = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ children, className, ...props }, ref) => {
    return (
        <div
            className={cn(
                "group-data-[fullscreen=false]/floating:absolute group-data-[fullscreen=false]/floating:bottom-16",
                "group-data-[fullscreen=false]/floating:w-full group-data-[fullscreen=false]/floating:gap-1.5",
                "sm:group-data-[fullscreen=false]/floating:mb-2",
                "group-data-[fullscreen=true]/floating:fixed",
                "group-data-[fullscreen=true]/floating:left-0 group-data-[fullscreen=true]/floating:top-0",
                "group-data-[fullscreen=true]/floating:h-screen group-data-[fullscreen=true]/floating:w-screen",
                "group-[:is([data-fullscreen='true'][data-expanded='true'])]/floating:translate-x-0",
                "group-data-[fullscreen=true]/floating:-translate-x-full",
                "group-data-[fullscreen=true]/floating:bg-background",
                "group-data-[expanded=true]/floating:-translate-y-0 group-data-[expanded=true]/floating:scale-x-100",
                "group-data-[expanded=true]/floating:opacity-90 [&>*]:group-data-[expanded=true]/floating:opacity-100",
                "z-10 flex scale-x-0 flex-col items-center opacity-0",
                "w-sc translate-y-full transition-all duration-300 ease-out",
                className
            )}
            {...props}
            ref={ref}
        >
            {children}
        </div>
    );
});
Content.displayName = "FloatingButton.Content";

interface IFloatingButtonTriggerProps extends ButtonProps {
    icon: string;
}

const setFloating = (event: React.MouseEvent<HTMLButtonElement>) => {
    const wrapper = event.currentTarget.closest(".floating-wrapper");
    if (!wrapper) {
        throw new Error("Floating button must be wrapped in a floating wrapper");
    }

    const isFloating = wrapper.getAttribute("data-expanded") === "true";

    if (isFloating) {
        wrapper.removeAttribute("data-expanded");
    } else {
        wrapper.setAttribute("data-expanded", "true");
    }
};

const Trigger = forwardRef<HTMLButtonElement, IFloatingButtonTriggerProps>(({ icon, children, className, ...props }, ref) => (
    <BaseButton
        className={cn(
            "group-[:is([data-fullscreen=true][data-expanded=true])]/floating:opacity-0",
            "group-data-[expanded=true]/floating:rotate-45",
            "h-14 w-14 rounded-full transition-transform duration-300 ease-in-out sm:h-16 sm:w-16",
            className
        )}
        onClick={setFloating}
        {...props}
        ref={ref}
    >
        <IconComponent icon={icon} size="8" />
    </BaseButton>
));
Trigger.displayName = "FloatingButton.Trigger";

const CloseButton = forwardRef<HTMLButtonElement, ButtonProps>(({ children, className, variant = "ghost", ...props }, ref) => (
    <BaseButton
        className={cn(
            "absolute right-2 top-2 z-50 hidden h-8 w-8 p-0 opacity-0",
            "group-[:is([data-fullscreen=true][data-expanded=true])]/floating:flex",
            "group-[:is([data-fullscreen=true][data-expanded=true])]/floating:opacity-100",
            className
        )}
        onClick={setFloating}
        variant={variant}
        {...props}
        ref={ref}
    >
        <IconComponent icon="x" size="6" />
    </BaseButton>
));
CloseButton.displayName = "FloatingButton.CloseButton";

interface IFloatingRootProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    fullScreen?: boolean;
}

const Root = forwardRef<HTMLDivElement, IFloatingRootProps>(({ children, className, fullScreen = false, ...props }, ref) => {
    let hasContent = false;
    let hasTrigger = false;
    Children.forEach(children, (child) => {
        if (child === null) {
            return;
        }

        if (!isValidElement(child)) {
            throw new Error(`${Root.displayName} children must be valid React elements`);
        }

        if (child.type === Trigger) {
            hasTrigger = true;
        }

        if (child.type !== Content) {
            return;
        }

        hasContent = true;

        let hasCloseButton = false;
        if (fullScreen) {
            Children.forEach(child.props.children, (contentChild) => {
                if (contentChild === null) {
                    return;
                }

                if (!isValidElement(contentChild)) {
                    throw new Error(`${Content.displayName} children must be valid React elements`);
                }

                if (contentChild.type === CloseButton) {
                    hasCloseButton = true;
                }
            });

            if (!hasCloseButton) {
                throw new Error(`${Content.displayName} must have a ${CloseButton.displayName} when fullScreen is true`);
            }
        }
    });

    if (!hasContent || !hasTrigger) {
        throw new Error(`${Root.displayName} must have a ${Content.displayName} and a ${Trigger.displayName}`);
    }

    return (
        <div
            className={cn("floating-wrapper group/floating fixed bottom-2 left-2 z-50 inline-block md:hidden", className)}
            data-fullscreen={fullScreen}
            data-expanded={false}
            {...props}
            ref={ref}
        >
            {children}
        </div>
    );
});
Root.displayName = "FloatingButton.Root";

export { Root, Content, Trigger, CloseButton };
