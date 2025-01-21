"use client";

import { cn } from "@udecode/cn";
import { useFormInputProps } from "@udecode/plate/react";
import { type UseVirtualFloatingOptions, flip, offset } from "@udecode/plate-floating";
import {
    type LinkFloatingToolbarState,
    FloatingLinkUrlInput,
    LinkOpenButton,
    useFloatingLinkEdit,
    useFloatingLinkEditState,
    useFloatingLinkInsert,
    useFloatingLinkInsertState,
} from "@udecode/plate-link/react";
import { ExternalLink, Link, Text, Unlink } from "lucide-react";
import { ButtonVariants, Popover, Separator } from "@/components/base";
import { InputVariants } from "@/components/base/Input";
import { useTranslation } from "react-i18next";

const floatingOptions: UseVirtualFloatingOptions = {
    middleware: [
        offset(12),
        flip({
            fallbackPlacements: ["bottom-end", "top-start", "top-end"],
            padding: 12,
        }),
    ],
    placement: "bottom-start",
};

export interface LinkFloatingToolbarProps {
    state?: LinkFloatingToolbarState;
}

export function LinkFloatingToolbar({ state }: LinkFloatingToolbarProps) {
    const [t] = useTranslation();
    const insertState = useFloatingLinkInsertState({
        ...state,
        floatingOptions: {
            ...floatingOptions,
            ...state?.floatingOptions,
        },
    });
    const { hidden, props: insertProps, ref: insertRef, textInputProps } = useFloatingLinkInsert(insertState);

    const editState = useFloatingLinkEditState({
        ...state,
        floatingOptions: {
            ...floatingOptions,
            ...state?.floatingOptions,
        },
    });
    const { editButtonProps, props: editProps, ref: editRef, unlinkButtonProps } = useFloatingLinkEdit(editState);
    const inputProps = useFormInputProps({
        preventDefaultOnEnterKeydown: true,
    });

    if (hidden) return null;

    const input = (
        <div className="flex w-[330px] flex-col" {...inputProps}>
            <div className="flex items-center">
                <div className="flex items-center pl-2 pr-1 text-muted-foreground">
                    <Link className="size-4" />
                </div>

                <FloatingLinkUrlInput
                    className={InputVariants({ h: "sm", variant: "ghost" })}
                    placeholder={t("editor.Paste link")}
                    data-plate-focus
                />
            </div>
            <Separator className="my-1" />
            <div className="flex items-center">
                <div className="flex items-center pl-2 pr-1 text-muted-foreground">
                    <Text className="size-4" />
                </div>
                <input
                    className={InputVariants({ h: "sm", variant: "ghost" })}
                    placeholder={t("editor.Text to display")}
                    data-plate-focus
                    {...textInputProps}
                />
            </div>
        </div>
    );

    const editContent = editState.isEditing ? (
        input
    ) : (
        <div className="box-content flex items-center">
            <button className={ButtonVariants({ size: "sm", variant: "ghost" })} type="button" {...editButtonProps}>
                {t("editor.Edit link")}
            </button>

            <Separator orientation="vertical" />

            <LinkOpenButton
                className={ButtonVariants({
                    size: "icon",
                    variant: "ghost",
                })}
            >
                <ExternalLink width={18} />
            </LinkOpenButton>

            <Separator orientation="vertical" />

            <button
                className={ButtonVariants({
                    size: "icon",
                    variant: "ghost",
                })}
                type="button"
                {...unlinkButtonProps}
            >
                <Unlink width={18} />
            </button>
        </div>
    );

    return (
        <>
            <div ref={insertRef} className={cn(Popover.ContentVariants(), "w-auto p-1")} {...insertProps}>
                {input}
            </div>

            <div ref={editRef} className={cn(Popover.ContentVariants(), "w-auto p-1")} {...editProps}>
                {editContent}
            </div>
        </>
    );
}
