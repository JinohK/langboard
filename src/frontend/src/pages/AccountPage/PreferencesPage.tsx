import { useTranslation } from "react-i18next";
import { Box } from "@/components/base";
import PreferenceLanguage from "@/pages/AccountPage/components/preference/PreferenceLanguage";
import PreferenceNotification from "@/pages/AccountPage/components/preference/PreferenceNotification";

function PreferencesPage(): JSX.Element {
    const [t] = useTranslation();

    return (
        <>
            <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">{t("myAccount.Preferences")}</h2>
            <Box mt="11">
                <PreferenceNotification />
                <PreferenceLanguage />
            </Box>
        </>
    );
}

export default PreferencesPage;
