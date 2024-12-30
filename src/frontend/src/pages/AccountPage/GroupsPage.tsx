import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/core/providers/AuthProvider";
import { usePageLoader } from "@/core/providers/PageLoaderProvider";
import AccountUserGroupList from "@/pages/AccountPage/components/AccountUserGroupList";

function GroupsPage(): JSX.Element {
    const { setIsLoadingRef } = usePageLoader();
    const [t] = useTranslation();
    const { aboutMe, updatedUser, updated } = useAuth();
    const [user, setUser] = useState(aboutMe());

    useEffect(() => {
        setUser(aboutMe());
    }, [updated]);

    useEffect(() => {
        setIsLoadingRef.current(false);
    }, []);

    return (
        <>
            <h2 className="mb-11 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">{t("myAccount.Groups")}</h2>
            {!user ? <div>{t("loading")}</div> : <AccountUserGroupList user={user} updatedUser={updatedUser} />}
        </>
    );
}

export default GroupsPage;
