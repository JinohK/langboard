import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Floating, IconComponent } from "@/components/base";
import setupResizeEvent from "@/core/events/setupResizeEvent";
import { cn } from "@/core/utils/ComponentUtils";
import { screenSizeMap } from "@/core/utils/SizeMap";
import { createShortUUID } from "@/core/utils/StringUtils";

export interface IResizableSidebarProps {
    main: React.ReactNode;
    children: React.ReactNode;
    initialWidth: number;
    defaultCollapsed?: bool;
    collapsableWidth?: number;
    floatingIcon?: string;
    floatingTitle?: string;
    floatingFullScreen?: bool;
}

function ResizableSidebar({
    main,
    children,
    initialWidth,
    collapsableWidth = 100,
    defaultCollapsed = false,
    floatingIcon = "plus",
    floatingTitle = "common.Actions",
    floatingFullScreen = false,
}: IResizableSidebarProps) {
    const isResizing = useRef(false);
    const [t] = useTranslation();
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
    const [isMobile, setIsMobile] = useState(window.innerWidth < screenSizeMap.md);

    const collapsedWidth = 26;

    if (collapsableWidth < 100) {
        throw new Error("collapsableWidth must be greater than 100");
    }

    useEffect(() => {
        const { destroy: destroyResizeEvent } = setupResizeEvent({
            resizingRef: isResizing,
            doneCallback: () => {
                setIsMobile(window.innerWidth < screenSizeMap.md);
            },
        });

        return () => {
            destroyResizeEvent();
        };
    }, []);

    const sidebarId = `resizable-sidebar-${createShortUUID()}`;
    const setCollapsedAttr = (collapsed: bool, sidebar?: HTMLElement, widthSize?: number) => {
        sidebar = sidebar ?? document.getElementById(sidebarId)!;
        if (!widthSize) {
            if (collapsed) {
                widthSize = collapsedWidth;
            } else {
                widthSize = collapsableWidth;
            }
        }

        sidebar.style.maxWidth = `${widthSize}px`;

        sidebar.setAttribute("data-collapsed", collapsed ? "true" : "false");
    };

    const startResizing = (originalEvent: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        document.documentElement.style.cursor = "e-resize";
        document.documentElement.style.userSelect = "none";

        const target = originalEvent.currentTarget;
        const sidebar = target.parentElement!;
        const originalWidth = parseFloat(getComputedStyle(sidebar, null).getPropertyValue("width").replace("px", ""));
        const originalMouseX = originalEvent.pageX;

        target.setAttribute("data-selected", "true");
        sidebar.setAttribute("data-resizing", "true");

        const handleResizing = (event: MouseEvent) => {
            const width = originalWidth + (event.pageX - originalMouseX);
            if (width > collapsableWidth) {
                setCollapsedAttr(false, sidebar, width);
            } else if (width <= collapsableWidth && width >= (collapsableWidth + collapsedWidth) / 2) {
                setCollapsedAttr(false, sidebar);
            } else {
                setCollapsedAttr(true, sidebar);
            }
        };

        const stopResizing = () => {
            document.documentElement.style.cursor = "";
            document.documentElement.style.userSelect = "";
            sidebar.removeAttribute("data-resizing");
            target.removeAttribute("data-selected");
            window.removeEventListener("mousemove", handleResizing);
            window.removeEventListener("mouseup", stopResizing);
            setIsCollapsed(sidebar.getAttribute("data-collapsed") === "true");
        };

        window.addEventListener("mousemove", handleResizing);
        window.addEventListener("mouseup", stopResizing);
    };

    return (
        <>
            <div className="block h-[calc(100vh_-_theme(spacing.16))] w-full transition-all duration-200 ease-in-out md:flex">
                <div
                    className="group/sidebar relative hidden size-full border-r transition-all data-[resizing=true]:transition-none md:block"
                    style={{ maxWidth: `${initialWidth}px` }}
                    data-collapsed={isCollapsed ? "true" : "false"}
                    id={sidebarId}
                >
                    <aside
                        className={cn(
                            "sticky z-50 flex size-full flex-col items-start text-sm font-medium group-data-[collapsed=true]/sidebar:hidden"
                        )}
                    >
                        {!isMobile && children}
                    </aside>

                    <div
                        className={cn(
                            "resizer absolute right-[-1px] top-0 z-50 h-full w-[3px] cursor-e-resize",
                            "bg-transparent opacity-85 transition-colors duration-200 ease-in-out hover:bg-primary data-[selected=true]:bg-primary"
                        )}
                        onMouseDown={startResizing}
                    />

                    <Button
                        variant="secondary"
                        onClick={() => {
                            setCollapsedAttr(!isCollapsed, undefined, isCollapsed ? initialWidth : undefined);
                            setIsCollapsed(!isCollapsed);
                        }}
                        className={cn(
                            "absolute right-[-1.2rem] top-1/2 z-50 size-10 -translate-y-1/2 transform rounded-full p-0",
                            "group-data-[resizing=true]/sidebar:hidden"
                        )}
                    >
                        <IconComponent icon={isCollapsed ? "chevron-right" : "chevron-left"} size="8" />
                    </Button>
                </div>
                {main}
            </div>
            <Floating.Button.Root fullScreen={floatingFullScreen}>
                <Floating.Button.Content>
                    {floatingFullScreen && <Floating.Button.CloseButton />}
                    {isMobile && children}
                </Floating.Button.Content>
                <Floating.Button.Trigger icon={floatingIcon} title={t(floatingTitle)} titleSide="right" />
            </Floating.Button.Root>
        </>
    );
}

export default ResizableSidebar;
