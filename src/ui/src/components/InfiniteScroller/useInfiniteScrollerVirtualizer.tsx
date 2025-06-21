import { IUseInfiniteScrollerLoaderObserverProps } from "@/components/InfiniteScroller/types";
import useInfiniteScrollerLoaderObserver from "@/components/InfiniteScroller/useInfiniteScrollerLoaderObserver";
import TypeUtils from "@/core/utils/TypeUtils";
import { useVirtualizer } from "@tanstack/react-virtual";

export interface IUseInfiniteScrollerVirtualizerProps extends IUseInfiniteScrollerLoaderObserverProps {
    scrollable: () => HTMLElement | null;
    loader: React.ReactNode;
    children: React.ReactNode;
}

const useInfiniteScrollerVirtualizer = ({ scrollable, loader, children, hasMore, gap, ...props }: IUseInfiniteScrollerVirtualizerProps) => {
    const { setLoaderRef, items } = useInfiniteScrollerLoaderObserver({
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
        gap: TypeUtils.isString(gap) ? parseInt(gap) : gap,
        overscan: 5,
    });

    return {
        setLoaderRef,
        virtualizer,
        items,
    };
};

export default useInfiniteScrollerVirtualizer;
