import { SubmitButton, Toast } from "@/components/base";
import useCreateUserGroup from "@/controllers/api/account/useCreateUserGroup";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { useAccountSetting } from "@/core/providers/AccountSettingProvider";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function AccountUserGroupAddButton(): JSX.Element {
    const [t] = useTranslation();
    const { currentUser } = useAccountSetting();
    const [isValidating, setIsValidating] = useState(false);
    const { mutate } = useCreateUserGroup();

    const createLabel = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        mutate(
            {
                name: "New Group",
            },
            {
                onSuccess: (data) => {
                    Toast.Add.success(t("successes.User group created successfully."));

                    currentUser.user_groups = [...currentUser.user_groups, data.user_group];
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({});

                    handle(error);
                },
                onSettled: () => {
                    setIsValidating(false);
                },
            }
        );
    };

    return (
        <SubmitButton type="button" isValidating={isValidating} variant="outline" className="w-full border-2 border-dashed" onClick={createLabel}>
            {t("myAccount.Add new group")}
        </SubmitButton>
    );
}

export default AccountUserGroupAddButton;
