"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/core/utils/ComponentUtils";
import { heightSizeMap, TDimensionSize } from "@/core/utils/SizeMap";

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
    indeterminate?: boolean;
    height?: TDimensionSize;
}

const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
    ({ className, value, indeterminate = false, height = "4", ...props }, ref) => (
        <ProgressPrimitive.Root
            ref={ref}
            className={cn("relative w-full overflow-hidden rounded-full bg-secondary", heightSizeMap[height], className)}
            {...props}
        >
            <ProgressPrimitive.Indicator
                className={cn("h-full w-full flex-1 bg-primary transition-all", indeterminate && "origin-left animate-progress")}
                style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
            />
        </ProgressPrimitive.Root>
    )
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export default Progress;
