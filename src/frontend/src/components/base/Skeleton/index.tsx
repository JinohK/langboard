import Box, { TBoxProps } from "@/components/base/Box";
import { cn } from "@/core/utils/ComponentUtils";
import { forwardRef } from "react";

const Skeleton = forwardRef<React.ComponentRef<"div">, TBoxProps>(({ as = "div", className, ...props }, ref) => {
    return <Box as={as} className={cn("animate-pulse rounded-md bg-primary/10", className)} {...props} ref={ref} />;
});

export default Skeleton;
