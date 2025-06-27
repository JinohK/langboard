import { useTranslation } from "react-i18next";
import { Toast } from "@/components/base";
import useUpdatePreferredLanguage from "@/controllers/api/account/useUpdatePreferredLanguage";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { AuthUser } from "@/core/models";
import { useState } from "react";

export interface IUserPreferenceLanguageSwitcherProps extends Omit<React.ComponentProps<typeof LanguageSwitcher>, "asForm"> {
    currentUser: AuthUser.TModel;
}

function UserPreferenceLanguageSwitcher({ currentUser, ...props }: IUserPreferenceLanguageSwitcherProps): JSX.Element {
    const [isValidating, setIsValidating] = useState(false);
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
        <LanguageSwitcher
            {...props}
            asForm={{
                initialValue: preferredLang,
                disabled: isValidating,
                onChange: handleUpdate,
            }}
        />
    );
}

export default UserPreferenceLanguageSwitcher;
