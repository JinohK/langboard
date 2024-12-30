import { MultiSelectMemberForm } from "@/components/MultiSelectMemberPopover";
import { Card, Toast } from "@/components/base";
import useUpdateUserGroupAssignedEmails from "@/controllers/api/account/useUpdateUserGroupAssignedEmails";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { User, UserGroup } from "@/core/models";
import AccountUserGroupName from "@/pages/AccountPage/components/AccountUserGroupName";
import { IGroupComponentProps } from "@/pages/AccountPage/components/types";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IAccountUserGroupProps extends Omit<IGroupComponentProps, "user"> {
    group: UserGroup.TModel;
}

function AccountUserGroup({ group, updatedUser }: IAccountUserGroupProps): JSX.Element {
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const { mutate, createRevertToastButton } = useUpdateUserGroupAssignedEmails(group.uid, () => {
        User.Model.deleteModels(group.users.filter((emailUser) => !emailUser.isValidUser()).map((emailUser) => emailUser.uid));
        updatedUser();
    });
    const users = group.useForeignField<User.TModel>("users");
    const appUsers = users.filter((u) => u.isValidUser());
    const invitedMembers = users.filter((u) => !u.isValidUser());
    const setSelectedRef = useRef<React.Dispatch<React.SetStateAction<string[]>>>(() => {});

    const onValueChange = (values: string[]) => {
        if (values.length === users.length || isValidating) {
            return;
        }

        setIsValidating(true);

        mutate(
            {
                emails: values,
            },
            {
                onSuccess: (data) => {
                    User.Model.deleteModels(users.filter((emailUser) => !emailUser.isValidUser()).map((emailUser) => emailUser.uid));
                    group.users = data.users;
                    setSelectedRef.current?.(() => data.users.map((u) => u.email));
                    setTimeout(() => {
                        const toastId = Toast.Add.success(t("myAccount.successes.User group emails updated successfully."), {
                            actions: [createRevertToastButton(data.revert_key, () => toastId)],
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
        <Card.Root>
            <Card.Header>
                <AccountUserGroupName group={group} />
            </Card.Header>
            <Card.Content>
                <MultiSelectMemberForm
                    multiSelectProps={{
                        placeholder: t("myAccount.Add an email..."),
                        className: "w-full",
                        inputClassName: "ml-1 placeholder:text-gray-500 placeholder:font-medium",
                        commandItemForNew: (values) => t("myAccount.Add '{emails}'", { emails: values }),
                    }}
                    onValueChange={onValueChange}
                    isValidating={isValidating}
                    allUsers={appUsers}
                    assignedUsers={appUsers}
                    newUsers={invitedMembers}
                    canControlAssignedUsers
                    canAssignNonMembers
                    setSelectedRef={setSelectedRef}
                />
            </Card.Content>
        </Card.Root>
    );
}

export default AccountUserGroup;
