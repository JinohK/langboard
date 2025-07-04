"use client";

import { getMentionOnSelectItem } from "@platejs/mention";
import { InlineComboboxItem } from "@/components/plate-ui/inline-combobox";
import { BotModel, User } from "@/core/models";
import UserAvatar from "@/components/UserAvatar";
import { Utils } from "@langboard/core/utils";
import { PlateEditor } from "platejs/react";
import type { TMentionableUser } from "@/components/plate-ui/mention-node";
import UserAvatarDefaultList from "@/components/UserAvatarDefaultList";
import UserLikeComponent from "@/components/UserLikeComponent";

const onSelectItem = getMentionOnSelectItem();

export interface IMentionInputComboboxItem {
    search: string;
    userOrBot: TMentionableUser;
    editor: PlateEditor;
    projectUID?: string;
}

export const MentionInputComboboxItem = ({ userOrBot, ...props }: IMentionInputComboboxItem) => {
    return (
        <UserLikeComponent
            userOrBot={userOrBot}
            userComp={MentionInputComboboxUserItem}
            botComp={MentionInputComboboxBotItem}
            props={props}
            shouldReturnNull
        />
    );
};

const MentionInputComboboxUserItem = ({ user, ...props }: Omit<IMentionInputComboboxItem, "userOrBot"> & { user: User.TModel }) => {
    const firstname = user.useField("firstname");
    const lastname = user.useField("lastname");
    const username = user.useField("username");

    return (
        <MentionInputComboboxItemInner
            {...props}
            value={`${firstname} ${lastname} ${username}`}
            username={username}
            names={`${firstname} ${lastname}`}
            userOrBot={user as TMentionableUser}
        />
    );
};

const MentionInputComboboxBotItem = ({ bot, ...props }: Omit<IMentionInputComboboxItem, "userOrBot"> & { bot: BotModel.TModel }) => {
    const name = bot.useField("name");
    const username = bot.useField("bot_uname");

    return (
        <MentionInputComboboxItemInner
            {...props}
            value={`${name} ${username}`}
            username={username}
            names={name}
            userOrBot={bot as TMentionableUser}
        />
    );
};

interface IMentionInputComboboxItemInnerProps extends IMentionInputComboboxItem {
    value: string;
    username: string;
    names: string;
}

const MentionInputComboboxItemInner = ({ search, value, username, names, userOrBot, editor, projectUID }: IMentionInputComboboxItemInnerProps) => {
    return (
        <InlineComboboxItem
            key={Utils.String.Token.shortUUID()}
            value={value}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelectItem(editor, userOrBot, search);
            }}
            className="h-auto p-0"
        >
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
