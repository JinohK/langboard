import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/core/providers/AuthProvider";
import AddSubEmailForm from "@/pages/AccountPage/components/AddSubEmailForm";
import EmailList from "@/pages/AccountPage/components/EmailList";
import PrimaryEmailForm from "@/pages/AccountPage/components/PrimaryEmailForm";
import { Flex } from "@/components/base";
import { usePageLoader } from "@/core/providers/PageLoaderProvider";

function EmailPage(): JSX.Element {
    const { setIsLoadingRef } = usePageLoader();
    const [t] = useTranslation();
    const { aboutMe, updatedUser } = useAuth();
    const [isValidating, setIsValidating] = useState(false);
    const [user, setUser] = useState(aboutMe());

    useEffect(() => {
        let isMounted = true;
        let aboutMeTimeout: NodeJS.Timeout;

        const getUser = () => {
            if (!isMounted) {
                clearTimeout(aboutMeTimeout);
                return;
            }

            const curUser = aboutMe();
            if (!curUser) {
                aboutMeTimeout = setTimeout(getUser, 50);
                return;
            }

            setUser(curUser);
        };

        aboutMeTimeout = setTimeout(getUser, 50);

        return () => {
            isMounted = false;
        };
    }, [aboutMe, aboutMe()]);

    useEffect(() => {
        setIsLoadingRef.current(false);
    }, []);

    return (
        <>
            <h2 className="mb-11 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">{t("myAccount.Emails")}</h2>
            <Flex direction="col" gap="6">
                <EmailList updatedUser={updatedUser} user={user} isValidating={isValidating} setIsValidating={setIsValidating} />
                <AddSubEmailForm updatedUser={updatedUser} user={user} isValidating={isValidating} setIsValidating={setIsValidating} />
                <PrimaryEmailForm updatedUser={updatedUser} user={user} isValidating={isValidating} setIsValidating={setIsValidating} />
            </Flex>
        </>
    );
}

export default EmailPage;
