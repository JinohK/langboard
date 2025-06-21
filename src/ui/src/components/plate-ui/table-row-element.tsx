"use client";

import { TTableRowElement } from "@udecode/plate-table";
import { PlateElement, PlateElementProps, useSelected } from "@udecode/plate/react";

export function TableRowElement(props: PlateElementProps<TTableRowElement>) {
    const selected = useSelected();

    return (
        <PlateElement
            {...props}
            as="tr"
            className="group/row"
            attributes={{
                ...props.attributes,
                "data-selected": selected ? "true" : undefined,
            }}
        >
            {props.children}
        </PlateElement>
    );
}
