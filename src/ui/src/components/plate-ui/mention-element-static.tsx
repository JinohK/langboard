import * as React from "react";
import type { SlateElementProps } from "@udecode/plate";
import type { IMentionElement } from "@/components/Editor/plugins/markdown/mention";
import { IS_APPLE, SlateElement } from "@udecode/plate";
import { cn } from "@udecode/cn";
import { useEditorData } from "@/core/providers/EditorDataProvider";
import { User } from "@/core/models";
import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultList from "@/components/UserAvatarDefaultList";
import { isModel } from "@/core/models/ModelRegistry";

export function MentionElementStatic(
    props: SlateElementProps<IMentionElement> & {
        prefix?: string;
    }
) {
    const { mentionables, form } = useEditorData();
    const element = props.element;
    const mentionedUser = mentionables.find((user) => user.uid === element.key) ?? User.Model.createUnknownUser();
    const renderLabel = React.useCallback(() => {
        const mentionable = mentionables.find((val) => val.uid === element.key);
        if (isModel(mentionable, "User")) {
            return `${mentionable.firstname} ${mentionable.lastname}`;
        } else if (isModel(mentionable, "BotModel")) {
            return mentionable.name;
        } else {
            return element.value;
        }
    }, [element, mentionables]);

    let customName;
    if (IS_APPLE) {
        // Mac OS IME https://github.com/ianstormtaylor/slate/issues/3490
        customName = (
            <>
                {props.children}
                {props.prefix}
                {renderLabel()}
            </>
        );
    } else {
        // Others like Android https://github.com/ianstormtaylor/slate/pull/5360
        customName = (
            <>
                {props.prefix}
                {renderLabel()}
                {props.children}
            </>
        );
    }

    return (
        <SlateElement
            className={cn(
                "inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline text-sm font-medium",
                element.children[0].bold === true && "font-bold",
                element.children[0].italic === true && "italic",
                element.children[0].underline === true && "underline"
            )}
            data-slate-value={element.value}
            {...props}
        >
            <UserAvatar.Root
                userOrBot={mentionedUser}
                withNameProps={{
                    noAvatar: true,
                    customName: customName,
                }}
            >
                <UserAvatarDefaultList userOrBot={mentionedUser} projectUID={form?.project_uid} />
            </UserAvatar.Root>
        </SlateElement>
    );
}
