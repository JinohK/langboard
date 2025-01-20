import { MultiSelectAssigneesForm, TMultiSelectAssigneeItem } from "@/components/MultiSelectPopoverForm";
import { Box, Card, Flex, Skeleton, Toast } from "@/components/base";
import useUpdateUserGroupAssignedEmails from "@/controllers/api/account/useUpdateUserGroupAssignedEmails";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { User, UserGroup } from "@/core/models";
import { useAccountSetting } from "@/core/providers/AccountSettingProvider";
import AccountUserGroupDeleteButton from "@/pages/AccountPage/components/AccountUserGroupDeleteButton";
import AccountUserGroupName from "@/pages/AccountPage/components/AccountUserGroupName";
import { memo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export function SkeletonAccountUserGroup(): JSX.Element {
    return (
        <Card.Root>
            <Card.Header className="relative">
                <Skeleton h="6" w="28" />
            </Card.Header>
            <Card.Content>
                <Flex gap="3" w="full" wrap="wrap" rounded="md" border px="3" py="2" className="border-input">
                    <Skeleton w="24" className="h-[calc(theme(spacing.5)_+_2px)]" />
                    <Skeleton w="20" className="h-[calc(theme(spacing.5)_+_2px)]" />
                    <Skeleton w="32" className="h-[calc(theme(spacing.5)_+_2px)]" />
                </Flex>
                <Box p="1" />
            </Card.Content>
        </Card.Root>
    );
}

export interface IAccountUserGroupProps {
    group: UserGroup.TModel;
}

const AccountUserGroup = memo(({ group }: IAccountUserGroupProps): JSX.Element => {
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const { currentUser } = useAccountSetting();
    const groups = currentUser.useForeignField<UserGroup.TModel>("user_groups");
    const setSelectedItemsRef = useRef<React.Dispatch<React.SetStateAction<TMultiSelectAssigneeItem[]>>>(() => {});
    const { mutate } = useUpdateUserGroupAssignedEmails(group);
    const users = group.useForeignField<User.TModel>("users");

    const onValueChange = (values: TMultiSelectAssigneeItem[]) => {
        if (values.length === users.length || isValidating) {
            return;
        }

        setIsValidating(true);

        mutate(
            {
                emails: (values as User.TModel[]).map((u) => u.email),
            },
            {
                onSuccess: () => {
                    Toast.Add.success(t("myAccount.successes.User group emails updated successfully."));
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
            <Card.Header className="relative">
                <AccountUserGroupName group={group} />
                <AccountUserGroupDeleteButton group={group} />
            </Card.Header>
            <Card.Content>
                <MultiSelectAssigneesForm
                    multiSelectProps={{
                        placeholder: t("myAccount.Add an email..."),
                        className: "w-full",
                        inputClassName: "ml-1 placeholder:text-gray-500 placeholder:font-medium",
                        commandItemForNew: (values) => t("myAccount.Add '{emails}'", { emails: values }),
                    }}
                    allItems={users}
                    groups={groups.filter((g) => g.uid !== group.uid)}
                    newItemFilter={() => true}
                    initialSelectedItems={users}
                    isValidating={isValidating}
                    canAssignNonMembers
                    onValueChange={onValueChange}
                    setSelectedItemsRef={setSelectedItemsRef}
                />
            </Card.Content>
        </Card.Root>
    );
});

export default AccountUserGroup;
