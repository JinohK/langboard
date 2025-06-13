import { IUseInfiniteScrollerLoaderObserverProps } from "@/components/InfiniteScroller/types";
import useInfiniteScrollerLoaderObserver from "@/components/InfiniteScroller/useInfiniteScrollerLoaderObserver";
import { useVirtualizer } from "@tanstack/react-virtual";

export interface IUseInfiniteScrollerVirtualizerProps extends IUseInfiniteScrollerLoaderObserverProps {
    scrollable: () => HTMLElement | null;
    loader: React.ReactNode;
    children: React.ReactNode;
}

const useInfiniteScrollerVirtualizer = ({ scrollable, loader, children, hasMore, ...props }: IUseInfiniteScrollerVirtualizerProps) => {
    const { loaderRef, items } = useInfiniteScrollerLoaderObserver({
        scrollable,
        loader,
        hasMore,
        children,
        ...props,
    });

    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: scrollable,
        estimateSize: () => 0,
        measureElement: (el: HTMLElement) => el.getBoundingClientRect().height,
        overscan: 5,
    });

    return {
        loaderRef,
        virtualizer,
        items,
    };
};

export default useInfiniteScrollerVirtualizer;
