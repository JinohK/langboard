/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { cn, withRef } from "@udecode/cn";
import { useEquationElement } from "@udecode/plate-math/react";
import { PlateElement } from "./plate-element";
import { Popover } from "@/components/base";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { TEquationElement } from "@udecode/plate-math";
import { EquationInput } from "@/components/plate-ui/equation-input";
import { RadicalIcon } from "lucide-react";

export const InlineEquationElement = withRef<typeof PlateElement, { element: TEquationElement }>(({ children, className, ...props }, ref) => {
    const [t] = useTranslation();
    const { element } = props;
    const [isOpened, setIsOpened] = useState(false);
    const katexRef = useRef<HTMLDivElement | null>(null);
    const shouldNotOpenInitRef = useRef((element as any).shouldNotOpenInit);
    useEquationElement({ element, katexRef, options: { throwOnError: false, trust: true } });

    useEffect(() => {
        if (shouldNotOpenInitRef.current) {
            return;
        }

        setTimeout(() => {
            setIsOpened(true);
        }, 0);
    }, []);

    const triggerClassNames = cn(
        "h-6 text-muted-foreground",
        "after:absolute after:inset-0 after:-left-1 after:-top-0.5 after:z-[1] after:h-[calc(100%)+4px] after:w-[calc(100%+8px)]",
        // eslint-disable-next-line quotes
        'after:rounded-sm after:content-[""]',
        isOpened ? "after:bg-brand/15" : "after:bg-neutral-500/10"
    );

    return (
        <PlateElement ref={ref} className={cn("inline-block", className)} {...props}>
            <Popover.Root open={isOpened} onOpenChange={setIsOpened}>
                <Popover.Trigger asChild className={triggerClassNames}>
                    {element.texExpression ? (
                        <span ref={katexRef} />
                    ) : (
                        <span>
                            <RadicalIcon className="mr-1 inline-block h-[19px] w-4 py-[1.5px] align-text-bottom" />
                            {t("editor.New equation")}
                        </span>
                    )}
                </Popover.Trigger>
                <Popover.Content className="w-auto p-2">
                    <EquationInput isInline isOpened={isOpened} setIsOpened={setIsOpened} />
                </Popover.Content>
            </Popover.Root>
            {children}
        </PlateElement>
    );
});
