"use client";

import React from "react";
import { type EmojiDropdownMenuOptions, useEmojiDropdownMenuState } from "@udecode/plate-emoji/react";
import { Smile } from "lucide-react";
import { emojiCategoryIcons, emojiSearchIcons } from "./emoji-icons";
import { EmojiPicker } from "./emoji-picker";
import { EmojiToolbarDropdown } from "./emoji-toolbar-dropdown";
import { ToolbarButton } from "./toolbar";
import { useTranslation } from "react-i18next";
import { i18nProps } from "@udecode/plate-emoji";

type EmojiDropdownMenuProps = {
    options?: EmojiDropdownMenuOptions;
} & React.ComponentPropsWithoutRef<typeof ToolbarButton>;

export function EmojiDropdownMenu({ options, ...props }: EmojiDropdownMenuProps) {
    const [t] = useTranslation();
    const { emojiPickerState, isOpen, setIsOpen } = useEmojiDropdownMenuState(options);

    emojiPickerState.i18n = t("editor.emoji", { returnObjects: true }) as i18nProps;

    return (
        <EmojiToolbarDropdown
            control={
                <ToolbarButton pressed={isOpen} tooltip={t("editor.Emoji")} isDropdown {...props}>
                    <Smile />
                </ToolbarButton>
            }
            isOpen={isOpen}
            setIsOpen={setIsOpen}
        >
            <EmojiPicker
                {...emojiPickerState}
                icons={{
                    categories: emojiCategoryIcons,
                    search: emojiSearchIcons,
                }}
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                settings={options?.settings}
            />
        </EmojiToolbarDropdown>
    );
}
