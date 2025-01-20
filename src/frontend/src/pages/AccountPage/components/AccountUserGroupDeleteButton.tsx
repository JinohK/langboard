import { Button, IconComponent, Toast } from "@/components/base";
import useDeleteUserGroup from "@/controllers/api/account/useDeleteUserGroup";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { UserGroup } from "@/core/models";
import { useAccountSetting } from "@/core/providers/AccountSettingProvider";
import { useTranslation } from "react-i18next";

export interface IAccountUserGroupDeleteButtonProps {
    group: UserGroup.TModel;
}

function AccountUserGroupDeleteButton({ group }: IAccountUserGroupDeleteButtonProps): JSX.Element {
    const { isValidating, setIsValidating } = useAccountSetting();
    const [t] = useTranslation();
    const { mutate } = useDeleteUserGroup(group);
    const deleteGroup = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        mutate(
            {},
            {
                onSuccess: () => {
                    Toast.Add.success(t("myAccount.successes.User group deleted successfully."));
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
        <Button variant="destructive" size="icon-sm" disabled={isValidating} className="absolute right-3 top-2 size-7" onClick={deleteGroup}>
            <IconComponent icon="trash-2" size="4" />
        </Button>
    );
}

export default AccountUserGroupDeleteButton;
