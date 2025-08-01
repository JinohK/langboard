"use client";

import * as React from "react";
import type { TLinkElement } from "platejs";
import type { PlateElementProps } from "platejs/react";
import { useLink } from "@platejs/link/react";
import { PlateElement } from "platejs/react";
import LinkElementDialog from "@/components/plate-ui/link-node-dialog";

export function LinkElement(props: PlateElementProps<TLinkElement>) {
    const { props: linkProps } = useLink({ element: props.element });
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const handleClick = React.useCallback(() => {
        if (!linkProps.href) {
            return;
        }

        setDialogOpen(true);
    }, [linkProps.href, setDialogOpen]);

    return (
        <>
            <PlateElement
                {...props}
                as="a"
                className="cursor-pointer font-medium text-primary underline decoration-primary underline-offset-4"
                attributes={{
                    ...props.attributes,
                    onMouseOver: linkProps.onMouseOver,
                    href: undefined,
                    onClick: handleClick,
                }}
            >
                {props.children}
            </PlateElement>
            <LinkElementDialog isOpened={dialogOpen} setIsOpened={setDialogOpen} href={linkProps.href} />
        </>
    );
}
