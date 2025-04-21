import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultList from "@/components/UserAvatarDefaultList";
import { User } from "@/core/models";
import { memo } from "react";

export interface IBoardCardCheckitemAssignedMemberProps {
    projectUID: string;
    assignedUser: User.TModel;
}

const BoardCardCheckitemAssignedMember = memo(({ projectUID, assignedUser }: IBoardCardCheckitemAssignedMemberProps): JSX.Element => {
    return (
        <UserAvatar.Root user={assignedUser} avatarSize="xs">
            <UserAvatarDefaultList user={assignedUser} projectUID={projectUID} />
        </UserAvatar.Root>
    );
});

export default BoardCardCheckitemAssignedMember;
