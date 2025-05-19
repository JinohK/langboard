"use client";

import { useMemo, useState } from "react";
import {
    InlineCombobox,
    InlineComboboxContent,
    InlineComboboxEmpty,
    InlineComboboxGroup,
    InlineComboboxInput,
} from "@/components/plate-ui/inline-combobox";
import { PlateElement, PlateElementProps } from "@udecode/plate/react";
import { User } from "@/core/models";
import { useTranslation } from "react-i18next";
import { createShortUUID } from "@/core/utils/StringUtils";
import { MentionInputComboboxItem } from "@/components/plate-ui/mention-input-combobox-item";
import { TMentionInputElement } from "@udecode/plate-mention";
import { useEditorData } from "@/core/providers/EditorDataProvider";

export interface IMentionInputElement extends PlateElementProps<TMentionInputElement> {}

export interface IMentionableUser extends User.TModel {
    key: string;
    text: string;
}

export function MentionInputElement(props: IMentionInputElement) {
    const { editor, element } = props;
    const [t] = useTranslation();
    const { currentUser, mentionables: flatMentionables, form } = useEditorData();
    const [search, setSearch] = useState("");
    const mentionables = useMemo(() => {
        const userList: IMentionableUser[] = [];
        for (let i = 0; i < flatMentionables.length; ++i) {
            const user = flatMentionables[i];
            if (user.uid === currentUser.uid || (!user.isValidUser() && !user.isBot())) {
                continue;
            }

            const fakeUser = user.asFake() as IMentionableUser;
            fakeUser.text = user.uid;
            fakeUser.key = user.uid;

            userList.push(fakeUser);
        }
        return userList;
    }, [flatMentionables]);

    return (
        <PlateElement {...props} as="span" data-slate-value={element.value}>
            <InlineCombobox value={search} element={element} setValue={setSearch} showTrigger={false} trigger="@">
                <span className="inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline text-sm ring-ring focus-within:ring-2">
                    <InlineComboboxInput />
                </span>

                <InlineComboboxContent className="my-1.5">
                    <InlineComboboxEmpty>{t("editor.No results")}</InlineComboboxEmpty>

                    <InlineComboboxGroup>
                        {mentionables.map((user) => (
                            <MentionInputComboboxItem
                                key={createShortUUID()}
                                search={search}
                                user={user}
                                editor={editor}
                                projectUID={form?.project_uid}
                            />
                        ))}
                    </InlineComboboxGroup>
                </InlineComboboxContent>
            </InlineCombobox>

            {props.children}
        </PlateElement>
    );
}
