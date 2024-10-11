import { IHeaderNavItem } from "@/components/Header";
import Layout from "@/components/Layout";
import { ISidebarNavItem } from "@/components/Sidebar";

function DashboardPage(): JSX.Element {
    const headerNavs: IHeaderNavItem[] = [
        {
            name: "Projects",
            active: true,
        },
        {
            name: "Tasks",
        },
        {
            name: "Starred",
            subNavs: [],
        },
        {
            name: "Tracking",
        },
    ];
    const sidebarNavs: ISidebarNavItem[] = [
        {
            icon: "circle-plus",
            name: "Create New Project",
        },
    ];

    return (
        <Layout headerNavs={headerNavs} sidebarNavs={sidebarNavs}>
            Hi
        </Layout>
    );
}

export default DashboardPage;
