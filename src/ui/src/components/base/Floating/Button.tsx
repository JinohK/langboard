import { forwardRef } from "react";
import Flex from "@/components/base/Flex";
import IconComponent from "@/components/base/IconComponent";
import { default as BaseButton, ButtonProps } from "@/components/base/Button";
import { cn } from "@/core/utils/ComponentUtils";
import { AnimatePresence, motion } from "framer-motion";
import { FloatingButtonProvider, useFloatingButton } from "@/components/base/Floating/Provider";

const Content = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ children, className, ...props }, ref) => {
    const { fullScreen, isOpened } = useFloatingButton();
    const list = {
        visible: {
            opacity: 1,
            display: "block",
            transition: {
                staggerChildren: 0.1,
                staggerDirection: -1,
            },
        },
        hidden: {
            opacity: 0,
            display: "none",
            transition: {
                when: "afterChildren",
                staggerChildren: 0.1,
            },
        },
    };

    return (
        <motion.ul
            key="list"
            className={cn("absolute bottom-16 z-10 flex flex-col items-center", fullScreen && "-bottom-2 -left-2")}
            initial="hidden"
            animate={isOpened ? "visible" : "hidden"}
            variants={list}
        >
            <Flex direction="col" items="center" gap="2" className={cn("bg-background/70", fullScreen && "h-screen w-screen")} {...props} ref={ref}>
                {children}
            </Flex>
        </motion.ul>
    );
});
Content.displayName = "FloatingButton.Content";

interface IFloatingButtonTriggerProps extends ButtonProps {
    icon: string;
}

const Trigger = forwardRef<HTMLButtonElement, IFloatingButtonTriggerProps>(({ icon, children, className, ...props }, ref) => {
    const { isOpened, setIsOpened } = useFloatingButton();
    const btn = {
        visible: { rotate: "45deg" },
        hidden: { rotate: 0 },
    };

    return (
        <BaseButton className={cn("size-14 rounded-full", className)} {...props} ref={ref}>
            <motion.div
                key="button"
                variants={btn}
                animate={isOpened ? "visible" : "hidden"}
                onClick={() => setIsOpened(!isOpened)}
                className="cursor-pointer"
            >
                <IconComponent icon={icon} size="8" />
            </motion.div>
        </BaseButton>
    );
});
Trigger.displayName = "FloatingButton.Trigger";

const CloseButton = forwardRef<HTMLButtonElement, ButtonProps>(({ children, className, variant = "ghost", ...props }, ref) => {
    const { setIsOpened } = useFloatingButton();
    return (
        <BaseButton
            className={cn("absolute right-2 top-2 z-50", className)}
            variant={variant}
            size="icon-sm"
            {...props}
            onClick={() => setIsOpened(false)}
            ref={ref}
        >
            <IconComponent icon="x" size="6" />
        </BaseButton>
    );
});
CloseButton.displayName = "FloatingButton.CloseButton";

interface IFloatingRootProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    fullScreen?: bool;
}

const Root = forwardRef<HTMLDivElement, IFloatingRootProps>(({ children, className, fullScreen = false, ...props }, ref) => {
    return (
        <FloatingButtonProvider fullScreen={fullScreen}>
            <div
                className={cn("floating-wrapper group/floating fixed bottom-2 left-2 z-50 inline-block md:hidden", className)}
                data-fullscreen={fullScreen}
                data-expanded={false}
                {...props}
                ref={ref}
            >
                <AnimatePresence>{children}</AnimatePresence>
            </div>
        </FloatingButtonProvider>
    );
});
Root.displayName = "FloatingButton.Root";

function Item({ children }: { children: React.ReactNode }) {
    const item = {
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0, y: 5 },
    };
    return <motion.li variants={item}>{children}</motion.li>;
}

export { CloseButton, Content, Root, Trigger, Item };
