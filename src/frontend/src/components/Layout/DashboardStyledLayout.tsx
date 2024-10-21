import Header from "@/components/Header";
import { IHeaderNavItem } from "@/components/Header/types";
import Sidebar from "@/components/Sidebar";
import { ISidebarNavItem } from "@/components/Sidebar/types";
import { forwardRef } from "react";

export interface IDashboardStyledLayoutProps {
    children: React.ReactNode;
    headerNavs?: IHeaderNavItem[];
    sidebarNavs?: ISidebarNavItem[];
}

const DashboardStyledLayout = forwardRef<HTMLDivElement, IDashboardStyledLayoutProps>(({ children, headerNavs, sidebarNavs, ...props }, ref) => {
    const main = (
        <main id="main" className="relative overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
        </main>
    );

    return (
        <div className="flex min-h-screen w-full flex-col" ref={ref} {...props}>
            {headerNavs && <Header navs={headerNavs} />}
            <div className="min-h-[calc(100vh_-_theme(spacing.16))] w-full overflow-y-auto" id="mobile-main">
                {sidebarNavs ? <Sidebar navs={sidebarNavs} main={main} /> : main}
            </div>
        </div>
    );
});

export default DashboardStyledLayout;
