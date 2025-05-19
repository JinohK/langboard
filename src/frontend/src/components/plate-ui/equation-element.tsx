/* eslint-disable @/max-len */
"use client";

import type { TEquationElement } from "@udecode/plate-math";
import { cn } from "@udecode/cn";
import { useEquationElement } from "@udecode/plate-math/react";
import { PlateElement, PlateElementProps, useElement, useSelected } from "@udecode/plate/react";
import { Popover } from "@/components/base";
import { useTranslation } from "react-i18next";
import { useRef, useState } from "react";
import { EquationPopoverContent } from "@/components/plate-ui/equation-popover";
import { RadicalIcon } from "lucide-react";

export function EquationElement(props: PlateElementProps<TEquationElement>) {
    const [t] = useTranslation();
    const element = useElement<TEquationElement>();

    const selected = useSelected();
    const [open, setOpen] = useState(selected);
    const katexRef = useRef<HTMLDivElement | null>(null);

    useEquationElement({
        element,
        katexRef: katexRef,
        options: {
            displayMode: true,
            errorColor: "#cc0000",
            fleqn: false,
            leqno: false,
            macros: { "\\f": "#1f(#2)" },
            output: "htmlAndMathml",
            strict: "warn",
            throwOnError: false,
            trust: false,
        },
    });

    return (
        <PlateElement className="my-1" {...props}>
            <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
                <Popover.Trigger asChild>
                    <div
                        className={cn(
                            "group flex cursor-pointer select-none items-center justify-center rounded-sm hover:bg-primary/10 data-[selected=true]:bg-primary/10",
                            element.texExpression.length === 0 ? "bg-muted p-3 pr-9" : "px-2 py-1"
                        )}
                        data-selected={selected}
                        contentEditable={false}
                        role="button"
                    >
                        {element.texExpression.length > 0 ? (
                            <span ref={katexRef} />
                        ) : (
                            <div className="flex h-7 w-full items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
                                <RadicalIcon className="size-6 text-muted-foreground/80" />
                                <div>{t("editor.Add a Tex equation")}</div>
                            </div>
                        )}
                    </div>
                </Popover.Trigger>

                <EquationPopoverContent
                    open={open}
                    placeholder={"f(x) = \\begin{cases}\n  x^2, &\\quad x > 0 \\\\\n  0, &\\quad x = 0 \\\\\n  -x^2, &\\quad x < 0\n\\end{cases}"}
                    isInline={false}
                    setOpen={setOpen}
                />
            </Popover.Root>

            {props.children}
        </PlateElement>
    );
}
