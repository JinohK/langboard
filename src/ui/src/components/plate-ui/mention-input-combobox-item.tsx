"use client";

import { getMentionOnSelectItem } from "@platejs/mention";
import { InlineComboboxItem } from "@/components/plate-ui/inline-combobox";
import { BotModel, User } from "@/core/models";
import UserAvatar from "@/components/UserAvatar";
import { createShortUUID } from "@/core/utils/StringUtils";
import { PlateEditor } from "platejs/react";
import type { TMentionableUser } from "@/components/plate-ui/mention-node";
import UserAvatarDefaultList from "@/components/UserAvatarDefaultList";
import { isModel } from "@/core/models/ModelRegistry";

const onSelectItem = getMentionOnSelectItem();

export interface IMentionInputComboboxItem {
    search: string;
    userOrBot: TMentionableUser;
    editor: PlateEditor;
    projectUID?: string;
}

export const MentionInputComboboxItem = ({ userOrBot, ...props }: IMentionInputComboboxItem) => {
    if (isModel(userOrBot, "User")) {
        return <MentionInputComboboxUserItem userOrBot={userOrBot} {...props} />;
    } else if (isModel(userOrBot, "BotModel")) {
        return <MentionInputComboboxBotItem userOrBot={userOrBot} {...props} />;
    } else {
        return null;
    }
};

const MentionInputComboboxUserItem = ({ userOrBot, ...props }: IMentionInputComboboxItem & { userOrBot: User.TModel }) => {
    const firstname = userOrBot.useField("firstname");
    const lastname = userOrBot.useField("lastname");
    const username = userOrBot.useField("username");

    return (
        <MentionInputComboboxItemInner
            {...props}
            value={`${firstname} ${lastname} ${username}`}
            username={username}
            names={`${firstname} ${lastname}`}
            userOrBot={userOrBot}
        />
    );
};

const MentionInputComboboxBotItem = ({ userOrBot, ...props }: IMentionInputComboboxItem & { userOrBot: BotModel.TModel }) => {
    const name = userOrBot.useField("name");
    const username = userOrBot.useField("bot_uname");

    return <MentionInputComboboxItemInner {...props} value={`${name} ${username}`} username={username} names={name} userOrBot={userOrBot} />;
};

interface IMentionInputComboboxItemInnerProps extends IMentionInputComboboxItem {
    value: string;
    username: string;
    names: string;
}

const MentionInputComboboxItemInner = ({ search, value, username, names, userOrBot, editor, projectUID }: IMentionInputComboboxItemInnerProps) => {
    return (
        <InlineComboboxItem key={createShortUUID()} value={value} onClick={() => onSelectItem(editor, userOrBot, search)} className="h-auto p-0">
            <UserAvatar.Root
                userOrBot={userOrBot}
                withNameProps={{
                    className: "gap-1 p-1 w-full",
                    customName: (
                        <div>
                            <div className="text-sm leading-none">{names}</div>
                            <div className="text-xs text-muted-foreground/50">@{username}</div>
                        </div>
                    ),
                }}
            >
                <UserAvatarDefaultList userOrBot={userOrBot} projectUID={projectUID} />
            </UserAvatar.Root>
        </InlineComboboxItem>
    );
};
