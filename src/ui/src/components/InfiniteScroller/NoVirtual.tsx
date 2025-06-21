import { Box } from "@/components/base";
import { TSharedInfiniteScrollerProps } from "@/components/InfiniteScroller/types";
import useInfiniteScrollerLoaderObserver from "@/components/InfiniteScroller/useInfiniteScrollerLoaderObserver";
import { createShortUUID } from "@/core/utils/StringUtils";
import { forwardRef, memo } from "react";

export interface INoVirtualInfiniteScrollerProps extends Omit<TSharedInfiniteScrollerProps<React.ReactElement>, "loaderClassName"> {
    as?: React.ElementType;
}

const NoVirtualInfiniteScroller = memo(
    forwardRef<HTMLElement, INoVirtualInfiniteScrollerProps>(
        ({ hasMore, initialLoad, loadMore, pageStart, loader, scrollable, gap, as = "div", children, ...props }, ref) => {
            const { setLoaderRef, items } = useInfiniteScrollerLoaderObserver({
                hasMore,
                initialLoad,
                loadMore,
                pageStart,
                loader,
                scrollable,
                gap,
                children,
            });

            const Comp = as;
            return (
                <Comp {...props} ref={ref}>
                    {items.map((item, index) => (hasMore && index === items.length - 1 ? null : item))}
                    <Box key={createShortUUID()} className={hasMore ? "" : "hidden"} ref={setLoaderRef}>
                        {loader}
                    </Box>
                </Comp>
            );
        }
    )
);

export default NoVirtualInfiniteScroller;
