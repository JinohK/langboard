import { Button, Flex, IconComponent } from "@/components/base";
import UserAvatarList from "@/components/UserAvatarList";
import { User } from "@/core/models";
import { memo } from "react";
import { useTranslation } from "react-i18next";

const BoardMemberList = memo(({ members }: { members: User.Interface[] }) => {
    const [t] = useTranslation();

    return (
        <Flex items="center" gap="1">
            <UserAvatarList users={members} maxVisible={6} size={{ initial: "sm", xs: "default" }} spacing="3" listAlign="start" />
            <Button variant="outline" size="icon" className="size-8 xs:size-10" title={t("project.Assign members")}>
                <IconComponent icon="plus" size="6" />
            </Button>
        </Flex>
    );
});

export default BoardMemberList;
