import { Button, FloatingButton, IconComponent } from "@/components/base";
import NavItems from "@/components/Sidebar/NavItems";
import { ISidebarProps } from "@/components/Sidebar/types";
import { cn } from "@/core/utils/ComponentUtils";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function Sidebar({ navs, main, floatingIcon = "plus", floatingTitle = "common.Actions" }: ISidebarProps) {
    const [t] = useTranslation();
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <>
            <div
                className={cn(
                    "block md:grid",
                    "h-[calc(100vh_-_theme(spacing.16))] w-full transition-all duration-200 ease-in-out",
                    isCollapsed ? "grid-cols-[56px_1fr]" : "md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]"
                )}
            >
                <div className="relative hidden h-full w-full md:block">
                    <aside
                        className={cn(
                            "sticky z-50 flex h-full w-full flex-col items-start border-r text-sm font-medium",
                            isCollapsed ? "p-1 lg:p-2" : "p-2 lg:p-3"
                        )}
                    >
                        <NavItems isCollapsed={isCollapsed} navs={navs} />
                    </aside>

                    <Button
                        variant="secondary"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="absolute right-[-1.2rem] top-1/2 z-50 h-10 w-10 -translate-y-1/2 transform rounded-full p-0"
                    >
                        <IconComponent icon={isCollapsed ? "chevron-right" : "chevron-left"} size="8" />
                    </Button>
                </div>
                {main}
            </div>
            <FloatingButton.Root>
                <FloatingButton.Content>
                    <NavItems isFloating navs={navs} />
                </FloatingButton.Content>
                <FloatingButton.Trigger icon={floatingIcon} title={t(floatingTitle)} titleSide="right" />
            </FloatingButton.Root>
        </>
    );
}

export default Sidebar;
