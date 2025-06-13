import { forwardRef } from "react";
import { cn } from "@/core/utils/ComponentUtils";
import useInfiniteScrollerVirtualizer from "@/components/InfiniteScroller/useInfiniteScrollerVirtualizer";
import { TSharedInfiniteScrollerProps } from "@/components/InfiniteScroller/types";
import { Box, composeRefs } from "@udecode/cn";

export interface IDefaultInfiniteScrollerProps extends TSharedInfiniteScrollerProps<React.ReactElement> {
    as?: React.ElementType;
    row?: React.ElementType;
    rowClassName?: string;
}

const DefaultInfiniteScroller = forwardRef<HTMLElement, IDefaultInfiniteScrollerProps>(
    (
        { hasMore, initialLoad, loadMore, pageStart, loader, scrollable, as = "div", row = "div", rowClassName, className, children, ...props },
        ref
    ) => {
        const { loaderRef, items, virtualizer } = useInfiniteScrollerVirtualizer({
            hasMore,
            initialLoad,
            loadMore,
            pageStart,
            loader,
            scrollable,
            children,
        });

        const virtualItems = virtualizer.getVirtualItems();
        const loaderIndex = hasMore ? (virtualItems[virtualItems.length - 1]?.index ?? "-1") : "-1";
        const loaderY = hasMore ? (virtualItems[virtualItems.length - 1]?.start ?? -99999) : -99999;

        const Comp = as;
        const RowComp = row;
        return (
            <Comp {...props} className={cn(className, "relative")} style={{ ...props.style, height: `${virtualizer.getTotalSize()}px` }} ref={ref}>
                {virtualItems.map((virtualRow, index) => {
                    if (hasMore && index === virtualItems.length - 1) {
                        return null;
                    }

                    return (
                        <RowComp
                            key={virtualRow.index}
                            className={cn(rowClassName, "absolute left-0 top-0")}
                            data-index={virtualRow.index}
                            style={{ transform: `translateY(${virtualRow.start}px)` }}
                            ref={virtualizer.measureElement}
                        >
                            {items[virtualRow.index]}
                        </RowComp>
                    );
                })}
                <Box
                    className={cn(rowClassName, "absolute left-0 top-0", !hasMore && "hidden")}
                    data-index={loaderIndex}
                    style={{
                        transform: `translateY(${loaderY}px)`,
                    }}
                    ref={composeRefs(loaderRef, virtualizer.measureElement)}
                >
                    {loader}
                </Box>
            </Comp>
        );
    }
);

export default DefaultInfiniteScroller;
