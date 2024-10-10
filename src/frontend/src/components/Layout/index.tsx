import Header, { IHeaderNavItem } from "@/components/Header";
import Sidebar, { ISidebarNavItem } from "@/components/Sidebar";
import { classNames } from "@/core/utils/ComponentUtils";

export interface ILayoutProps {
    children: React.ReactNode;
    headerNavs?: IHeaderNavItem[];
    sidebarNavs?: ISidebarNavItem[];
}

function Layout({ children, headerNavs, sidebarNavs }: ILayoutProps) {
    return (
        <div className="flex min-h-screen w-full flex-col">
            {headerNavs && <Header navs={headerNavs} />}
            <div
                className={classNames(
                    "min-h-[calc(100vh_-_theme(spacing.16))] w-full",
                    headerNavs ? "grid md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]" : ""
                )}
            >
                {sidebarNavs && <Sidebar navs={sidebarNavs} />}
                <main className="p-4 md:p-6 lg:p-8">{children}</main>
            </div>
        </div>
    );
}

export default Layout;
