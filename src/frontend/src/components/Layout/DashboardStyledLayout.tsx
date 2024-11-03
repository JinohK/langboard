import { forwardRef } from "react";
import Header from "@/components/Header";
import { IHeaderNavItem } from "@/components/Header/types";
import ResizableSidebar, { IResizableSidebarProps } from "@/components/ResizableSidebar";
import Sidebar from "@/components/Sidebar";
import { ISidebarNavItem } from "@/components/Sidebar/types";

interface IBaseDashboardStyledLayoutProps {
    children: React.ReactNode;
    headerNavs?: IHeaderNavItem[];
    sidebarNavs?: ISidebarNavItem[];
    resizableSidebar?: Omit<IResizableSidebarProps, "main">;
}

interface ISidebarDashboardStyledLayoutProps extends IBaseDashboardStyledLayoutProps {
    sidebarNavs: ISidebarNavItem[];
    resizableSidebar?: undefined;
}

interface IResizableSidebarDashboardStyledLayoutProps extends IBaseDashboardStyledLayoutProps {
    sidebarNavs?: undefined;
    resizableSidebar: Omit<IResizableSidebarProps, "main">;
}

export type TDashboardStyledLayoutProps =
    | ISidebarDashboardStyledLayoutProps
    | IResizableSidebarDashboardStyledLayoutProps
    | IBaseDashboardStyledLayoutProps;

const DashboardStyledLayout = forwardRef<HTMLDivElement, TDashboardStyledLayoutProps>(
    ({ children, headerNavs, sidebarNavs, resizableSidebar, ...props }, ref) => {
        const main = (
            <main id="main" className="relative size-full overflow-y-auto p-4 md:p-6 lg:p-8">
                {children}
            </main>
        );

        let sidebar;
        if (sidebarNavs) {
            sidebar = <Sidebar navs={sidebarNavs} main={main} />;
        } else if (resizableSidebar) {
            sidebar = <ResizableSidebar main={main} {...resizableSidebar} />;
        } else {
            sidebar = main;
        }

        return (
            <div className="flex min-h-screen w-full flex-col" ref={ref} {...props}>
                {headerNavs && <Header navs={headerNavs} />}
                <div className="min-h-[calc(100vh_-_theme(spacing.16))] w-full overflow-y-auto">{sidebar}</div>
            </div>
        );
    }
);

export default DashboardStyledLayout;
