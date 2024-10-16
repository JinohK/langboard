import { Button, IconComponent } from "@/components/base";
import NavItems from "@/components/Sidebar/NavItems";
import { ISidebarProps } from "@/components/Sidebar/types";
import { classNames, cn } from "@/core/utils/ComponentUtils";
import { useState } from "react";

function Sidebar({ navs, main }: ISidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const sharedClassNames = "h-[calc(100vh_-_theme(spacing.16))] w-full transition-all duration-200 ease-in-out";

    return (
        <>
            <div
                className={cn(
                    classNames("hidden md:grid", sharedClassNames),
                    isCollapsed ? "grid-cols-[56px_1fr]" : "md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]"
                )}
            >
                <div className="relative h-full w-full">
                    <aside
                        className={cn(
                            "sticky flex h-full w-full flex-col items-start border-r text-sm font-medium",
                            isCollapsed ? "p-1 lg:p-2" : "p-2 lg:p-3"
                        )}
                    >
                        <NavItems isCollapsed={isCollapsed} navs={navs} />
                    </aside>

                    <Button
                        variant="secondary"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="absolute right-[-1rem] top-1/2 h-10 w-10 -translate-y-1/2 transform rounded-full p-0"
                    >
                        <IconComponent icon={isCollapsed ? "chevron-right" : "chevron-left"} size="8" />
                    </Button>
                </div>
                {main}
            </div>
            <div className={classNames("md:hidden", sharedClassNames)}>{main}</div>
        </>
    );
}

export default Sidebar;
