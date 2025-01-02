import { Flex } from "@/components/base";
import { UserGroup } from "@/core/models";
import { useAccountSetting } from "@/core/providers/AccountSettingProvider";
import AccountUserGroup, { SkeletonAccountUserGroup } from "@/pages/AccountPage/components/AccountUserGroup";
import AccountUserGroupAddButton from "@/pages/AccountPage/components/AccountUserGroupAddButton";

export function SkeletonAccountUserGroupList(): JSX.Element {
    return (
        <Flex direction="col" gap="5">
            <SkeletonAccountUserGroup />
            <SkeletonAccountUserGroup />
        </Flex>
    );
}

function AccountUserGroupList(): JSX.Element {
    const { currentUser } = useAccountSetting();
    const groups = currentUser.useForeignField<UserGroup.TModel>("user_groups");

    return (
        <Flex direction="col" gap="5">
            {groups.map((group) => (
                <AccountUserGroup key={`account-user-group-${group.uid}`} group={group} />
            ))}
            <AccountUserGroupAddButton />
        </Flex>
    );
}

export default AccountUserGroupList;
