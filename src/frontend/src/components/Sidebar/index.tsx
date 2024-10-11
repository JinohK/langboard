/* eslint-disable @/max-len */
import { Button, IconComponent } from "@/components/base";
import { classNames, cn } from "@/core/utils/ComponentUtils";
import { useState } from "react";

export interface ISidebarNavItem {
    icon: string;
    name: string;
    href?: string;
    click?: () => void;
    current?: true;
}

export interface ISidebarProps {
    navs: ISidebarNavItem[];
    main: React.ReactNode;
}

function Sidebar({ navs, main }: ISidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div
            className={cn(
                "hidden min-h-[calc(100vh_-_theme(spacing.16))] w-full transition-all duration-200 ease-in-out md:grid",
                isCollapsed ? "grid-cols-[56px_1fr]" : "md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]"
            )}
        >
            <div className="relative h-full w-full">
                <aside className="flex h-full w-full flex-col items-start border-r px-2 text-sm font-medium lg:px-4">
                    {navs.map((item) => (
                        <a
                            key={item.name}
                            href={item.href}
                            onClick={item.click}
                            aria-current={item.current ? "page" : undefined}
                            className={classNames(
                                item.current ? "bg-muted text-primary" : "text-muted-foreground",
                                "flex cursor-pointer items-center gap-3 rounded-lg py-2 text-base transition-all hover:text-primary",
                                isCollapsed ? "" : "px-3"
                            )}
                        >
                            <IconComponent
                                icon={item.icon}
                                size={isCollapsed ? "6" : "5"}
                                strokeWidth="2"
                                className="transition-all"
                            />
                            {isCollapsed ? "" : item.name}
                        </a>
                    ))}
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
    );
}

export default Sidebar;
