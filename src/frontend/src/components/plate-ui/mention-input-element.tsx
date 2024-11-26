"use client";

import { useMemo, useState } from "react";
import { cn, withRef } from "@udecode/cn";
import { getMentionOnSelectItem } from "@udecode/plate-mention";
import {
    InlineCombobox,
    InlineComboboxContent,
    InlineComboboxEmpty,
    InlineComboboxGroup,
    InlineComboboxInput,
    InlineComboboxItem,
} from "./inline-combobox";
import { PlateElement } from "./plate-element";
import { User } from "@/core/models";
import UserAvatar from "@/components/UserAvatar";
import { IAuthUser } from "@/core/providers/AuthProvider";
import { useTranslation } from "react-i18next";

const onSelectItem = getMentionOnSelectItem();

export interface IMentionInputElement {
    currentUser: IAuthUser;
    mentionableUsers: User.Interface[];
}

export const MentionInputElement = withRef<typeof PlateElement, IMentionInputElement>(
    ({ className, currentUser, mentionableUsers, ...props }, ref) => {
        const { children, editor, element } = props;
        const [t] = useTranslation();
        const [search, setSearch] = useState("");
        const users = useMemo(() => {
            const userList: (User.Interface & { key: string; text: string })[] = [];
            for (let i = 0; i < mentionableUsers.length; ++i) {
                const user = mentionableUsers[i];
                if (user.id === currentUser.id) {
                    continue;
                }

                userList.push({
                    ...user,
                    text: user.username,
                    key: user.id.toString(),
                });
            }
            return userList;
        }, [mentionableUsers]);

        return (
            <PlateElement ref={ref} as="span" data-slate-value={element.value} {...props}>
                <InlineCombobox value={search} element={element} setValue={setSearch} showTrigger={false} trigger="@">
                    <span
                        className={cn(
                            "inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline text-sm ring-ring focus-within:ring-2",
                            className
                        )}
                    >
                        <InlineComboboxInput />
                    </span>

                    <InlineComboboxContent className="my-1.5">
                        <InlineComboboxEmpty>{t("editor.No results")}</InlineComboboxEmpty>

                        <InlineComboboxGroup>
                            {users.map((user) => (
                                <InlineComboboxItem
                                    key={user.key}
                                    value={`${user.firstname} ${user.lastname} ${user.username}`}
                                    onClick={() => onSelectItem(editor, user, search)}
                                    className="h-auto p-0"
                                >
                                    <UserAvatar.Root
                                        user={user}
                                        withName
                                        labelClassName="gap-1 p-1 w-full"
                                        customName={
                                            <div>
                                                <div className="text-sm leading-none">
                                                    {user.firstname} {user.lastname}
                                                </div>
                                                <div className="text-xs text-muted-foreground/50">@{user.username}</div>
                                            </div>
                                        }
                                    >
                                        <UserAvatar.List>
                                            <UserAvatar.ListLabel>test</UserAvatar.ListLabel>
                                        </UserAvatar.List>
                                    </UserAvatar.Root>
                                </InlineComboboxItem>
                            ))}
                        </InlineComboboxGroup>
                    </InlineComboboxContent>
                </InlineCombobox>

                {children}
            </PlateElement>
        );
    }
);
