import { Flex } from "@/components/base";
import { IGroupComponentProps } from "@/pages/AccountPage/components/types";
import { UserGroup } from "@/core/models";
import AccountUserGroup from "@/pages/AccountPage/components/AccountUserGroup";

function AccountUserGroupList({ user, updatedUser }: IGroupComponentProps): JSX.Element {
    const groups = user.useForeignField<UserGroup.TModel>("user_groups");

    return (
        <Flex direction="col" gap="5">
            {groups.map((group) => (
                <AccountUserGroup key={`account-user-group-${group.uid}`} group={group} updatedUser={updatedUser} />
            ))}
        </Flex>
    );
}

export default AccountUserGroupList;
