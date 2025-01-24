import { useTranslation } from "react-i18next";
import AccountUserGroupList, { SkeletonAccountUserGroupList } from "@/pages/AccountPage/components/group/AccountUserGroupList";

export function SkeletonGroupsPage(): JSX.Element {
    const [t] = useTranslation();

    return (
        <>
            <h2 className="mb-11 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">{t("myAccount.Groups")}</h2>
            <SkeletonAccountUserGroupList />
        </>
    );
}

function GroupsPage(): JSX.Element {
    const [t] = useTranslation();

    return (
        <>
            <h2 className="mb-11 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">{t("myAccount.Groups")}</h2>
            <AccountUserGroupList />
        </>
    );
}

export default GroupsPage;
