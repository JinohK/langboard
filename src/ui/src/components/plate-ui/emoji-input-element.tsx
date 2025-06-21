"use client";

import * as React from "react";
import { EmojiInlineIndexSearch, insertEmoji } from "@udecode/plate-emoji";
import { useDebounce } from "@/core/hooks/useDebounce";
import {
    InlineCombobox,
    InlineComboboxContent,
    InlineComboboxEmpty,
    InlineComboboxGroup,
    InlineComboboxInput,
    InlineComboboxItem,
} from "@/components/plate-ui/inline-combobox";
import { PlateElement, PlateElementProps, usePluginOption } from "@udecode/plate/react";
import { useTranslation } from "react-i18next";
import { EmojiPlugin } from "@udecode/plate-emoji/react";

export function EmojiInputElement(props: PlateElementProps) {
    const [t] = useTranslation();
    const { children, editor, element } = props;
    const data = usePluginOption(EmojiPlugin, "data")!;
    const [value, setValue] = React.useState("");
    const debouncedValue = useDebounce(value, 100);
    const isPending = value !== debouncedValue;

    const filteredEmojis = React.useMemo(() => {
        if (debouncedValue.trim().length === 0) return [];

        return EmojiInlineIndexSearch.getInstance(data).search(debouncedValue.replace(/:$/, "")).get();
    }, [data, debouncedValue]);

    return (
        <PlateElement as="span" data-slate-value={element.value} {...props}>
            <InlineCombobox value={value} element={element} filter={false} setValue={setValue} trigger=":" hideWhenNoValue>
                <InlineComboboxInput />

                <InlineComboboxContent>
                    {!isPending && <InlineComboboxEmpty>{t("editor.No results")}</InlineComboboxEmpty>}

                    <InlineComboboxGroup>
                        {filteredEmojis.map((emoji) => (
                            <InlineComboboxItem key={emoji.id} value={emoji.name} onClick={() => insertEmoji(editor, emoji)}>
                                {emoji.skins[0].native} {emoji.name}
                            </InlineComboboxItem>
                        ))}
                    </InlineComboboxGroup>
                </InlineComboboxContent>
            </InlineCombobox>

            {children}
        </PlateElement>
    );
}
