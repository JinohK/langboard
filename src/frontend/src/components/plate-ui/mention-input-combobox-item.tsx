"use client";

import { getMentionOnSelectItem } from "@udecode/plate-mention";
import { InlineComboboxItem } from "@/components/plate-ui/inline-combobox";
import { User } from "@/core/models";
import UserAvatar from "@/components/UserAvatar";
import { createShortUUID } from "@/core/utils/StringUtils";
import { PlateEditor } from "@udecode/plate/react";
import { IMentionableUser } from "@/components/plate-ui/mention-input-element";
import UserAvatarDefaultList from "@/components/UserAvatarDefaultList";

const onSelectItem = getMentionOnSelectItem();

export interface IMentionInputComboboxItem {
    search: string;
    user: IMentionableUser;
    editor: PlateEditor;
    projectUID?: string;
}

export const MentionInputComboboxItem = ({ user, ...props }: IMentionInputComboboxItem) => {
    const userModels = User.Model.useModels((model) => model.uid === user.uid);
    const userModel = userModels[0];

    if (!userModel) {
        return null;
    }

    return <MentionInputComboboxUserItem key={createShortUUID()} user={user} userModel={userModel} {...props} />;
};

interface IMentionInputComboboxUserItem extends IMentionInputComboboxItem {
    userModel: User.TModel;
}

const MentionInputComboboxUserItem = ({ search, user, userModel, editor, projectUID }: IMentionInputComboboxUserItem) => {
    const firstname = userModel.useField("firstname");
    const lastname = userModel.useField("lastname");
    const username = userModel.useField("username");

    return (
        <InlineComboboxItem
            key={createShortUUID()}
            value={`${firstname} ${lastname} ${username}`}
            onClick={() => onSelectItem(editor, user, search)}
            className="h-auto p-0"
        >
            <UserAvatar.Root
                user={User.Model.getModel(user.uid)!}
                withName
                labelClassName="gap-1 p-1 w-full"
                customName={
                    <div>
                        <div className="text-sm leading-none">
                            {firstname} {lastname}
                        </div>
                        <div className="text-xs text-muted-foreground/50">@{username}</div>
                    </div>
                }
            >
                <UserAvatarDefaultList user={userModel} projectUID={projectUID} />
            </UserAvatar.Root>
        </InlineComboboxItem>
    );
};
