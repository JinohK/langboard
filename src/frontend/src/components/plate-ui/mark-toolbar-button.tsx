"use client";

import { withRef } from "@udecode/cn";
import { useMarkToolbarButton, useMarkToolbarButtonState } from "@udecode/plate-common/react";
import { ToolbarButton } from "@/components/plate-ui/toolbar";

export const MarkToolbarButton = withRef<
    typeof ToolbarButton,
    {
        nodeType: string;
        clear?: string[] | string;
    }
>(({ clear, nodeType, ...rest }, ref) => {
    const state = useMarkToolbarButtonState({ clear, nodeType });
    const { props } = useMarkToolbarButton(state);

    return <ToolbarButton ref={ref} {...props} {...rest} />;
});
