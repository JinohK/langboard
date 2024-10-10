import { IHeaderNavItem } from "@/components/Header";
import Layout from "@/components/Layout";
import { ISidebarNavItem } from "@/components/Sidebar";

function DashboardPage(): JSX.Element {
    const headerNavs: IHeaderNavItem[] = [];
    const sidebarNavs: ISidebarNavItem[] = [];

    return (
        <Layout headerNavs={headerNavs} sidebarNavs={sidebarNavs}>
            Hi
        </Layout>
    );
}

export default DashboardPage;
