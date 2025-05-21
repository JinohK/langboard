import * as React from "react";
import type { SlateElementProps } from "@udecode/plate";
import type { IMentionElement } from "@/components/Editor/plugins/markdown/mention";
import { IS_APPLE, SlateElement } from "@udecode/plate";
import { cn } from "@udecode/cn";
import { useEditorData } from "@/core/providers/EditorDataProvider";
import { User } from "@/core/models";
import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultList from "@/components/UserAvatarDefaultList";

export function MentionElementStatic(
    props: SlateElementProps<IMentionElement> & {
        prefix?: string;
    }
) {
    const { mentionables, form } = useEditorData();
    const { prefix } = props;
    const element = props.element;
    const mentionedUser = mentionables.find((user) => user.uid === element.key) ?? User.Model.createUnknownUser();
    const renderLabel = React.useCallback(() => {
        const user = mentionables.find((val) => val.uid === element.key);
        if (user) {
            return `${user.firstname} ${user.lastname}`;
        } else {
            return element.value;
        }
    }, [element, mentionables]);

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
            {IS_APPLE ? (
                // Mac OS IME https://github.com/ianstormtaylor/slate/issues/3490
                <UserAvatar.Root
                    user={mentionedUser}
                    withName
                    noAvatar
                    customName={
                        <>
                            {props.children}
                            {prefix}
                            {renderLabel()}
                        </>
                    }
                >
                    <UserAvatarDefaultList user={mentionedUser} projectUID={form?.project_uid} />
                </UserAvatar.Root>
            ) : (
                // Others like Android https://github.com/ianstormtaylor/slate/pull/5360
                <UserAvatar.Root
                    user={mentionedUser}
                    withName
                    noAvatar
                    customName={
                        <>
                            {props.prefix}
                            {renderLabel()}
                            {props.children}
                        </>
                    }
                >
                    <UserAvatarDefaultList user={mentionedUser} projectUID={form?.project_uid} />
                </UserAvatar.Root>
            )}
        </SlateElement>
    );
}
