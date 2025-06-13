import { Box } from "@/components/base";
import { TSharedInfiniteScrollerProps } from "@/components/InfiniteScroller/types";
import useInfiniteScrollerLoaderObserver from "@/components/InfiniteScroller/useInfiniteScrollerLoaderObserver";
import { createShortUUID } from "@/core/utils/StringUtils";
import { forwardRef } from "react";

export interface INoVirtualInfiniteScrollerProps extends TSharedInfiniteScrollerProps<React.ReactElement> {
    as?: React.ElementType;
}

const NoVirtualInfiniteScroller = forwardRef<HTMLElement, INoVirtualInfiniteScrollerProps>(
    ({ hasMore, initialLoad, loadMore, pageStart, loader, scrollable, as = "div", children, ...props }, ref) => {
        const { loaderRef, items } = useInfiniteScrollerLoaderObserver({
            hasMore,
            initialLoad,
            loadMore,
            pageStart,
            loader,
            scrollable,
            children,
        });

        const Comp = as;
        return (
            <Comp {...props} ref={ref}>
                {items.map((item, index) => (hasMore && index === items.length - 1 ? null : item))}
                <Box key={createShortUUID()} className={hasMore ? "" : "hidden"} ref={loaderRef}>
                    {loader}
                </Box>
            </Comp>
        );
    }
);

export default NoVirtualInfiniteScroller;
