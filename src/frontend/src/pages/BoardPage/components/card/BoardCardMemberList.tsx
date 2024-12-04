import { Button, IconComponent } from "@/components/base";
import UserAvatarList from "@/components/UserAvatarList";
import { User } from "@/core/models";
import { memo } from "react";
import { useTranslation } from "react-i18next";

const BoardCardMemberList = memo(({ members }: { members: User.Interface[] }) => {
    const [t] = useTranslation();

    return (
        <>
            {members.length > 0 && (
                <UserAvatarList users={members} maxVisible={6} spacing="none" size={{ initial: "sm", lg: "default" }} className="space-x-1" />
            )}
            <Button variant="outline" size="icon" className="size-8 lg:size-10" title={t("card.Assign members")}>
                <IconComponent icon="plus" size="6" />
            </Button>
        </>
    );
});

export default BoardCardMemberList;
