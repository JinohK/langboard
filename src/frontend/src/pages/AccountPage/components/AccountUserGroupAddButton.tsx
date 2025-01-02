import { SubmitButton, Toast } from "@/components/base";
import useCreateUserGroup from "@/controllers/api/account/useCreateUserGroup";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { UserGroup } from "@/core/models";
import { useAccountSetting } from "@/core/providers/AccountSettingProvider";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

function AccountUserGroupAddButton(): JSX.Element {
    const { currentUser } = useAccountSetting();
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const lastCreatedGroupUIDRef = useRef<string | null>(null);
    const { mutate, createRevertToastButton } = useCreateUserGroup(() => {
        if (!lastCreatedGroupUIDRef.current) {
            return;
        }

        UserGroup.Model.deleteModel(lastCreatedGroupUIDRef.current);
    });

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
                    lastCreatedGroupUIDRef.current = data.user_group.uid;
                    currentUser.user_groups = currentUser.user_groups.concat(data.user_group);
                    setTimeout(() => {
                        const toastId = Toast.Add.success(t("myAccount.successes.User group created successfully."), {
                            actions: [createRevertToastButton(data.revert_key, () => toastId)],
                            onAutoClose: () => {
                                lastCreatedGroupUIDRef.current = null;
                            },
                            onDismiss: () => {
                                lastCreatedGroupUIDRef.current = null;
                            },
                        });
                    }, 0);
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                            Toast.Add.error(t("errors.Malformed request"));
                        },
                    });

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
