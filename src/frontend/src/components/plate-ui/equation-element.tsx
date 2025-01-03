/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { cn, withRef } from "@udecode/cn";
import { useEquationElement } from "@udecode/plate-math/react";
import { PlateElement } from "@/components/plate-ui/plate-element";
import { Flex, Popover } from "@/components/base";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { TEquationElement } from "@udecode/plate-math";
import { EquationInput } from "@/components/plate-ui/equation-input";
import { RadicalIcon } from "lucide-react";

export const EquationElement = withRef<typeof PlateElement, { element: TEquationElement }>(({ children, className, ...props }, ref) => {
    const [t] = useTranslation();
    const { element } = props;
    const [isOpened, setIsOpened] = useState(false);
    const katexRef = useRef<HTMLDivElement | null>(null);
    const shouldNotOpenInitRef = useRef((element as any).shouldNotOpenInit);
    useEquationElement({ element, katexRef, options: { displayMode: true, throwOnError: false, trust: true } });

    useEffect(() => {
        if (shouldNotOpenInitRef.current) {
            return;
        }

        setTimeout(() => {
            setIsOpened(true);
        }, 0);
    }, []);

    const triggerClassNames = cn(
        "flex cursor-pointer select-none items-center justify-center rounded-sm transition-bg-ease hover:bg-primary/10",
        element.texExpression ? "px-2 py-1" : "bg-muted p-3 pr-9"
    );

    return (
        <PlateElement ref={ref} className={cn("py-2.5", className)} {...props}>
            <Popover.Root open={isOpened} onOpenChange={setIsOpened}>
                <Popover.Trigger asChild className={triggerClassNames}>
                    {element.texExpression ? (
                        <span ref={katexRef} />
                    ) : (
                        <div>
                            <Flex items="center" gap="2" h="7" w="full" textSize="sm" className="whitespace-nowrap text-muted-foreground">
                                <RadicalIcon className="size-6 text-muted-foreground/80" />
                                {t("editor.Add an equation")}
                            </Flex>
                        </div>
                    )}
                </Popover.Trigger>
                <Popover.Content className="w-auto p-2">
                    <EquationInput isOpened={isOpened} setIsOpened={setIsOpened} />
                </Popover.Content>
            </Popover.Root>
            {children}
        </PlateElement>
    );
});
