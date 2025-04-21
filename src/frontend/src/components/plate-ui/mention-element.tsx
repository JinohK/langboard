/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type { TMentionElement } from "@udecode/plate-mention";
import { cn, withRef } from "@udecode/cn";
import { IS_APPLE, getHandler } from "@udecode/plate";
import { useElement, useReadOnly } from "@udecode/plate/react";
import { useFocused, useSelected } from "slate-react";
import { useMounted } from "@/core/hooks/useMounted";
import { PlateElement } from "@/components/plate-ui/plate-element";
import { AuthUser, User } from "@/core/models";
import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultList from "@/components/UserAvatarDefaultList";

export const MentionElement = withRef<
    typeof PlateElement,
    {
        currentUser: AuthUser.TModel;
        mentionables: User.TModel[];
        prefix?: string;
        renderLabel?: (mentionable: TMentionElement) => string;
        onClick?: (mentionNode: any) => void;
        projectUID?: string;
    }
>(({ children, className, currentUser, mentionables, prefix, renderLabel, onClick, projectUID, ...props }, ref) => {
    const element = useElement<TMentionElement>();
    const selected = useSelected();
    const focused = useFocused();
    const mounted = useMounted();
    const mentionedUser = mentionables.find((user) => user.uid === element.key) ?? User.Model.createUnknownUser();

    const readOnly = useReadOnly();

    return (
        <PlateElement
            ref={ref}
            className={cn(
                "inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline text-sm font-medium",
                !readOnly && "cursor-pointer",
                selected && focused && "ring-2 ring-ring",
                element.children[0].bold === true && "font-bold",
                element.children[0].italic === true && "italic",
                element.children[0].underline === true && "underline",
                className
            )}
            onClick={getHandler(onClick, element)}
            data-slate-value={element.value}
            contentEditable={false}
            draggable
            {...props}
        >
            {mounted && IS_APPLE ? (
                // Mac OS IME https://github.com/ianstormtaylor/slate/issues/3490
                <UserAvatar.Root
                    user={mentionedUser}
                    withName
                    noAvatar
                    customName={
                        <>
                            {children}
                            {prefix}
                            {renderLabel ? renderLabel(element) : element.value}
                        </>
                    }
                >
                    <UserAvatarDefaultList user={mentionedUser} projectUID={projectUID} />
                </UserAvatar.Root>
            ) : (
                // Others like Android https://github.com/ianstormtaylor/slate/pull/5360
                <UserAvatar.Root
                    user={mentionedUser}
                    withName
                    noAvatar
                    customName={
                        <>
                            {prefix}
                            {renderLabel ? renderLabel(element) : element.value}
                            {children}
                        </>
                    }
                >
                    <UserAvatarDefaultList user={mentionedUser} projectUID={projectUID} />
                </UserAvatar.Root>
            )}
        </PlateElement>
    );
});
