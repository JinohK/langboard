import { SubmitButton, Toast } from "@/components/base";
import useCreateUserGroup from "@/controllers/api/account/useCreateUserGroup";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function AccountUserGroupAddButton(): JSX.Element {
    const [t] = useTranslation();
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
                onSuccess: () => {
                    Toast.Add.success(t("successes.User group created successfully."));
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
