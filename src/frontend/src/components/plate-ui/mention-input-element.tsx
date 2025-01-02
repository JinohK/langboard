"use client";

import { useMemo, useState } from "react";
import { cn, withRef } from "@udecode/cn";
import { InlineCombobox, InlineComboboxContent, InlineComboboxEmpty, InlineComboboxGroup, InlineComboboxInput } from "./inline-combobox";
import { PlateElement } from "./plate-element";
import { AuthUser, User } from "@/core/models";
import { useTranslation } from "react-i18next";
import { createShortUUID } from "@/core/utils/StringUtils";
import { MentionInputComboboxItem } from "@/components/plate-ui/mention-input-combobox-item";

export interface IMentionInputElement {
    currentUser: AuthUser.TModel;
    mentionableUsers: User.TModel[];
}

export interface IMentionableUser extends User.TModel {
    key: string;
    text: string;
}

export const MentionInputElement = withRef<typeof PlateElement, IMentionInputElement>(
    ({ className, currentUser, mentionableUsers, ...props }, ref) => {
        const { children, editor, element } = props;
        const [t] = useTranslation();
        const [search, setSearch] = useState("");
        const users = useMemo(() => {
            const userList: IMentionableUser[] = [];
            for (let i = 0; i < mentionableUsers.length; ++i) {
                const user = mentionableUsers[i];
                if (user.uid === currentUser.uid || !user.isValidUser()) {
                    continue;
                }

                const fakeUser = user.asFake() as IMentionableUser;
                fakeUser.text = user.username;
                fakeUser.key = user.uid;

                userList.push(fakeUser);
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
                                <MentionInputComboboxItem key={createShortUUID()} search={search} user={user} editor={editor} />
                            ))}
                        </InlineComboboxGroup>
                    </InlineComboboxContent>
                </InlineCombobox>

                {children}
            </PlateElement>
        );
    }
);
