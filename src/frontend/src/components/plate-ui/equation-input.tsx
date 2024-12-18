"use client";

import React from "react";
import { useEquationInput } from "@udecode/plate-math/react";
import { Button, Flex, Textarea } from "@/components/base";

export interface EquationInputProps {
    isInline?: bool;
    isOpened: bool;
    setIsOpened: (isOpened: bool) => void;
}

export function EquationInput({ isInline, isOpened, setIsOpened }: EquationInputProps) {
    const {
        props: textareaProps,
        ref,
        onSubmit,
    } = useEquationInput({
        isInline,
        open: isOpened,
        onClose: () => setIsOpened(false),
    });
    const [height, setHeight] = React.useState(0);

    React.useEffect(() => {
        if (!ref.current) {
            setHeight(0);
            return;
        }

        const cloned = ref.current.cloneNode(true) as HTMLTextAreaElement;
        cloned.style.width = `${ref.current.clientWidth}px`;
        cloned.style.height = "0px";
        document.body.appendChild(cloned);
        if (cloned.scrollHeight !== height) {
            setHeight(cloned.scrollHeight);
        }
        document.body.removeChild(cloned);
    }, [textareaProps.value]);

    return (
        <Flex items="start" justify="between" gap="2" w="80" className="max-w-[calc(100vw-24px)]">
            <Textarea
                className="max-h-[50vh] min-h-[60px] resize-none border-none p-0 font-mono text-sm focus-visible:ring-transparent"
                placeholder="E = mc^2"
                style={{ height: `${height}px` }}
                {...textareaProps}
                ref={ref}
            />
            <Button type="button" onClick={onSubmit} size="sm">
                Done
            </Button>
        </Flex>
    );
}
