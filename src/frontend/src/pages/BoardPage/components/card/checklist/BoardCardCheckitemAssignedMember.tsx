import UserAvatar from "@/components/UserAvatar";
import { User } from "@/core/models";
import { memo } from "react";

export interface IBoardCardCheckitemAssignedMemberProps {
    assignedUser: User.TModel;
}

const BoardCardCheckitemAssignedMember = memo(({ assignedUser }: IBoardCardCheckitemAssignedMemberProps): JSX.Element => {
    return (
        <UserAvatar.Root user={assignedUser} avatarSize="xs">
            <UserAvatar.List>
                <UserAvatar.ListLabel>test</UserAvatar.ListLabel>
            </UserAvatar.List>
        </UserAvatar.Root>
    );
});

export default BoardCardCheckitemAssignedMember;
