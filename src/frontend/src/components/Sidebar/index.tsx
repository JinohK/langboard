import { IconComponent } from "@/components/base";
import { classNames } from "@/core/utils/ComponentUtils";

export interface ISidebarNavItem {
    icon: string;
    name: string;
    href?: string;
    click?: () => void;
    current?: true;
}

export interface ISidebarProps {
    navs: ISidebarNavItem[];
}

function Sidebar({ navs }: ISidebarProps) {
    return (
        <div>
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                {navs.map((item) => (
                    <a
                        key={item.name}
                        href={item.href}
                        onClick={item.click}
                        aria-current={item.current ? "page" : undefined}
                        className={classNames(
                            item.current ? "bg-muted text-primary" : "text-muted-foreground",
                            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary"
                        )}
                    >
                        <IconComponent icon={item.icon} size="4" />
                        {item.name}
                    </a>
                ))}
            </nav>
        </div>
    );
}

export default Sidebar;
