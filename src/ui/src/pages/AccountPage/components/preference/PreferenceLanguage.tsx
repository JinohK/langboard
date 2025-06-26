import { useTranslation } from "react-i18next";
import { Flex, Toast } from "@/components/base";
import useUpdatePreferredLanguage from "@/controllers/api/account/useUpdatePreferredLanguage";
import { useAccountSetting } from "@/core/providers/AccountSettingProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";

function PreferenceLanguage() {
    const { currentUser, isValidating, setIsValidating } = useAccountSetting();
    const [t, i18n] = useTranslation();
    const { mutateAsync } = useUpdatePreferredLanguage({ interceptToast: true });
    const preferredLang = currentUser.useField("preferred_lang");

    const handleUpdate = (lang: string) => {
        if (isValidating || lang === preferredLang) {
            return;
        }

        setIsValidating(true);

        const promise = mutateAsync({ lang });

        Toast.Add.promise(promise, {
            loading: t("common.Updating..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("successes.Preferred language updated successfully.");
            },
            finally: () => {
                setIsValidating(false);
                currentUser.preferred_lang = lang;
                i18n.changeLanguage(lang);
            },
        });
    };

    return (
        <Flex items="center" pb="3" gap="3">
            <h4 className="text-lg font-semibold tracking-tight">{t("myAccount.Language")}</h4>
            <LanguageSwitcher
                variant="outline"
                asForm={{
                    initialValue: preferredLang,
                    disabled: isValidating,
                    onChange: handleUpdate,
                }}
            />
        </Flex>
    );
}

export default PreferenceLanguage;
