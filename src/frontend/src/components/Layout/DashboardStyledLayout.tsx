import { forwardRef } from "react";
import Header from "@/components/Header";
import { IHeaderNavItem } from "@/components/Header/types";
import ResizableSidebar, { IResizableSidebarProps } from "@/components/ResizableSidebar";
import Sidebar from "@/components/Sidebar";
import { ISidebarNavItem } from "@/components/Sidebar/types";
import { cn } from "@/core/utils/ComponentUtils";
import { Box, Flex, ScrollArea } from "@/components/base";

interface IBaseDashboardStyledLayoutProps {
    children: React.ReactNode;
    headerNavs?: IHeaderNavItem[];
    sidebarNavs?: ISidebarNavItem[];
    resizableSidebar?: Omit<IResizableSidebarProps, "main">;
    noPadding?: bool;
    scrollAreaMutable?: React.ComponentPropsWithoutRef<typeof ScrollArea.Root>["mutable"];
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
    ({ children, headerNavs, sidebarNavs, resizableSidebar, noPadding, scrollAreaMutable, ...props }, ref) => {
        const main = (
            <ScrollArea.Root viewportId="main" className="relative size-full overflow-y-auto">
                <main className={cn("relative size-full overflow-y-auto", noPadding ? "" : "p-4 md:p-6 lg:p-8")}>{children}</main>
                <ScrollArea.Bar mutable={scrollAreaMutable} />
            </ScrollArea.Root>
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
            <Flex direction="col" w="full" minH="screen" ref={ref} {...props}>
                {headerNavs && <Header navs={headerNavs} />}
                <Box w="full" className="min-h-[calc(100vh_-_theme(spacing.16))] overflow-y-auto">
                    {sidebar}
                </Box>
            </Flex>
        );
    }
);

export default DashboardStyledLayout;
