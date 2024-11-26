"use client";

import { cn, withRef } from "@udecode/cn";
import { setNodes } from "@udecode/plate-common";
import { findNodePath } from "@udecode/plate-common/react";
import { PlateElement } from "./plate-element";
import { Popover, Calendar } from "@/components/base";
import { useTranslation } from "react-i18next";

export const DateElement = withRef<typeof PlateElement>(({ children, className, ...props }, ref) => {
    const [t] = useTranslation();
    const { editor, element } = props;

    return (
        <PlateElement ref={ref} className={cn("inline-block", className)} contentEditable={false} {...props}>
            <Popover.Root>
                <Popover.Trigger asChild>
                    <span className={cn("w-fit cursor-pointer rounded-sm bg-muted px-1 text-muted-foreground")} contentEditable={false} draggable>
                        {element.date ? (
                            (() => {
                                const today = new Date();
                                const elementDate = new Date(element.date as string);
                                const isToday =
                                    elementDate.getDate() === today.getDate() &&
                                    elementDate.getMonth() === today.getMonth() &&
                                    elementDate.getFullYear() === today.getFullYear();

                                const isYesterday = new Date(today.setDate(today.getDate() - 1)).toDateString() === elementDate.toDateString();
                                const isTomorrow = new Date(today.setDate(today.getDate() + 2)).toDateString() === elementDate.toDateString();

                                if (isToday) return t("editor.Today");
                                if (isYesterday) return t("editor.Yesterday");
                                if (isTomorrow) return t("editor.Tomorrow");

                                return elementDate.toLocaleDateString(undefined, {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                });
                            })()
                        ) : (
                            <span>{t("editor.Pick a date")}</span>
                        )}
                    </span>
                </Popover.Trigger>
                <Popover.Content className="w-auto">
                    <Calendar
                        value={new Date(element.date as string)}
                        onChange={(date) => {
                            if (!date) return;

                            setNodes(editor, { date: date.toDateString() }, { at: findNodePath(editor, element) });
                        }}
                        hideTime
                        initialFocus
                    />
                </Popover.Content>
            </Popover.Root>
            {children}
        </PlateElement>
    );
});
