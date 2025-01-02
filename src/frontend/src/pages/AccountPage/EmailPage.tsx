import { useTranslation } from "react-i18next";
import AddSubEmailForm, { SkeletonAddSubEmailForm } from "@/pages/AccountPage/components/AddSubEmailForm";
import EmailList, { SkeletonEmails } from "@/pages/AccountPage/components/EmailList";
import PrimaryEmailForm, { SkeletonPrimaryEmailForm } from "@/pages/AccountPage/components/PrimaryEmailForm";
import { Flex } from "@/components/base";

export function SkeletonEmailPage(): JSX.Element {
    const [t] = useTranslation();

    return (
        <>
            <h2 className="mb-11 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">{t("myAccount.Emails")}</h2>
            <Flex direction="col" gap="6">
                <SkeletonEmails />
                <SkeletonAddSubEmailForm />
                <SkeletonPrimaryEmailForm />
            </Flex>
        </>
    );
}

function EmailPage(): JSX.Element {
    const [t] = useTranslation();

    return (
        <>
            <h2 className="mb-11 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">{t("myAccount.Emails")}</h2>
            <Flex direction="col" gap="6">
                <EmailList />
                <AddSubEmailForm />
                <PrimaryEmailForm />
            </Flex>
        </>
    );
}

export default EmailPage;
