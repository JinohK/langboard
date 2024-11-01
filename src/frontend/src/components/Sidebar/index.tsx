import { Button, Floating, IconComponent } from "@/components/base";
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
                    "group/sidebar block md:grid",
                    "h-[calc(100vh_-_theme(spacing.16))] w-full transition-all duration-200 ease-in-out",
                    "data-[collapsed=true]:grid-cols-[56px_1fr]",
                    "md:data-[collapsed=false]:grid-cols-[220px_1fr] lg:data-[collapsed=false]:grid-cols-[280px_1fr]"
                )}
                data-collapsed={isCollapsed}
            >
                <div className="relative hidden size-full md:block">
                    <aside
                        className={cn(
                            "sticky z-50 flex size-full flex-col items-start border-r text-sm font-medium",
                            "group-data-[collapsed=true]/sidebar:p-1 lg:group-data-[collapsed=true]/sidebar:p-2",
                            "group-data-[collapsed=false]/sidebar:p-2 lg:group-data-[collapsed=false]/sidebar:p-3"
                        )}
                    >
                        <NavItems navs={navs} />
                    </aside>

                    <Button
                        variant="secondary"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="absolute right-[-1.2rem] top-1/2 z-50 size-10 -translate-y-1/2 transform rounded-full p-0"
                    >
                        <IconComponent icon={isCollapsed ? "chevron-right" : "chevron-left"} size="8" />
                    </Button>
                </div>
                {main}
            </div>
            <Floating.Button.Root>
                <Floating.Button.Content>
                    <NavItems isFloating navs={navs} />
                </Floating.Button.Content>
                <Floating.Button.Trigger icon={floatingIcon} title={t(floatingTitle)} titleSide="right" />
            </Floating.Button.Root>
        </>
    );
}

export default Sidebar;
