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
import { useTranslation } from "react-i18next";
import { createShortUUID } from "@/core/utils/StringUtils";
import { MentionInputComboboxItem } from "@/components/plate-ui/mention-input-combobox-item";
import { TMentionInputElement } from "@udecode/plate-mention";
import { useEditorData } from "@/core/providers/EditorDataProvider";
import { isModel, TUserLikeModel } from "@/core/models/ModelRegistry";

export interface IMentionInputElement extends PlateElementProps<TMentionInputElement> {}

export type TMentionableUser = TUserLikeModel & {
    key: string;
    text: string;
};

export function MentionInputElement(props: IMentionInputElement) {
    const { editor, element } = props;
    const [t] = useTranslation();
    const { currentUser, mentionables: flatMentionables, form } = useEditorData();
    const [search, setSearch] = useState("");
    const mentionables = useMemo(() => {
        const userOrBots: TMentionableUser[] = [];
        for (let i = 0; i < flatMentionables.length; ++i) {
            const userOrBot = flatMentionables[i];
            if (userOrBot.uid === currentUser.uid) {
                continue;
            }

            let username;
            if (isModel(userOrBot, "User")) {
                if (!userOrBot.isValidUser()) {
                    continue;
                }
                username = userOrBot.username;
            } else if (isModel(userOrBot, "BotModel")) {
                username = userOrBot.bot_uname;
            } else {
                continue;
            }

            const fakeUser = userOrBot.asFake() as TMentionableUser;
            fakeUser.text = username;
            fakeUser.key = userOrBot.uid;

            userOrBots.push(fakeUser);
        }
        return userOrBots;
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
                        {mentionables.map((mentionable) => (
                            <MentionInputComboboxItem
                                key={createShortUUID()}
                                search={search}
                                userOrBot={mentionable}
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
