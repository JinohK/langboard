"use client";

import type { IMentionElement } from "@/components/Editor/plugins/markdown/mention";
import { cn } from "@udecode/cn";
import { IS_APPLE } from "@udecode/plate";
import { PlateElement, PlateElementProps, useFocused, useReadOnly, useSelected } from "@udecode/plate/react";
import { useMounted } from "@/core/hooks/useMounted";
import { User } from "@/core/models";
import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultList from "@/components/UserAvatarDefaultList";
import { useEditorData } from "@/core/providers/EditorDataProvider";
import { useCallback } from "react";

export interface IMentionElementProps extends PlateElementProps<IMentionElement> {
    prefix?: string;
}

export function MentionElement(props: IMentionElementProps) {
    const element = props.element as IMentionElement;
    const { mentionables, form } = useEditorData();
    const selected = useSelected();
    const focused = useFocused();
    const mounted = useMounted();
    const mentionedUser = mentionables.find((user) => user.uid === element.key) ?? User.Model.createUnknownUser();
    const renderLabel = useCallback(() => {
        const user = mentionables.find((val) => val.uid === element.key);
        if (user) {
            return `${user.firstname} ${user.lastname}`;
        } else {
            return element.value;
        }
    }, [element, mentionables]);

    const readOnly = useReadOnly();

    return (
        <PlateElement
            {...props}
            className={cn(
                "inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline text-sm font-medium",
                !readOnly && "cursor-pointer",
                selected && focused && "ring-2 ring-ring",
                element.children[0].bold === true && "font-bold",
                element.children[0].italic === true && "italic",
                element.children[0].underline === true && "underline"
            )}
            attributes={{
                ...props.attributes,
                contentEditable: false,
                "data-slate-value": element.value,
                draggable: true,
            }}
        >
            {mounted && IS_APPLE ? (
                // Mac OS IME https://github.com/ianstormtaylor/slate/issues/3490
                <UserAvatar.Root
                    user={mentionedUser}
                    withName
                    noAvatar
                    customName={
                        <>
                            {props.children}
                            {props.prefix}
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
        </PlateElement>
    );
}
