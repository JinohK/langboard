/* eslint-disable @/max-len */
"use client";

import { useTocElement, useTocElementState } from "@udecode/plate-heading/react";
import { cva } from "class-variance-authority";
import { PlateElement, PlateElementProps } from "@udecode/plate/react";
import { Button } from "@/components/base";
import { useTranslation } from "react-i18next";

const headingItemVariants = cva(
    "block h-auto w-full cursor-pointer truncate rounded-none px-0.5 py-1.5 text-left font-medium text-muted-foreground underline decoration-[0.5px] underline-offset-4 hover:bg-accent hover:text-muted-foreground",
    {
        variants: {
            depth: {
                1: "pl-0.5",
                2: "pl-[26px]",
                3: "pl-[50px]",
            },
        },
    }
);

export function TocElement(props: PlateElementProps) {
    const [t] = useTranslation();
    const state = useTocElementState();
    const { props: btnProps } = useTocElement(state);
    const { headingList } = state;

    return (
        <PlateElement {...props} className="mb-1 p-0">
            <div contentEditable={false}>
                {headingList.length > 0 ? (
                    headingList.map((item) => (
                        <Button
                            key={item.id}
                            variant="ghost"
                            className={headingItemVariants({
                                depth: item.depth as 1 | 2 | 3,
                            })}
                            onClick={(e) => btnProps.onClick(e, item, "smooth")}
                            aria-current
                        >
                            {item.title}
                        </Button>
                    ))
                ) : (
                    <div className="text-sm text-gray-500">{t("editor.Create a heading to display the table of contents.")}</div>
                )}
            </div>
            {props.children}
        </PlateElement>
    );
}
