import { forwardRef, useCallback, useEffect, useRef, useState } from "react";

export interface IInfiniteScrollerProps extends React.HTMLAttributes<React.ElementType> {
    as?: React.ElementType;
    hasMore?: bool;
    initialLoad?: bool;
    loadMore: ((page: number) => Promise<bool>) | ((page: number) => bool) | ((page: number) => Promise<bool> | bool);
    scrollable: () => HTMLElement | null;
    pageStart?: number;
    threshold?: number;
    loader?: React.ReactElement;
}

const InfiniteScroller = forwardRef<HTMLElement, IInfiniteScrollerProps>(
    (
        { as = "div", hasMore = false, initialLoad = true, loadMore, pageStart = 1, threshold = 250, loader = null, scrollable, children, ...props },
        ref
    ) => {
        const isPassiveSupportedRef = useRef(isPassiveSupported());
        const listenerOptions = useRef<EventListenerOptions | AddEventListenerOptions>({ passive: isPassiveSupportedRef.current });
        const [pageLoaded, setPageLoaded] = useState(pageStart);
        const canScrollRef = useRef(true);
        const handleScroll = useCallback(() => {
            if (!canScrollRef.current || !hasMore) {
                return;
            }

            const scrollableTarget = scrollable();
            if (!scrollableTarget) {
                return;
            }

            const offset = scrollableTarget.scrollHeight - scrollableTarget.scrollTop - scrollableTarget.clientHeight;
            if (offset >= threshold || !scrollableTarget.offsetParent) {
                return;
            }

            canScrollRef.current = false;
            const beforeScrollHeight = scrollableTarget.scrollHeight;
            const beforeScrollTop = scrollableTarget.scrollTop;
            const nextPage = pageLoaded + 1;
            setTimeout(async () => {
                const isLoaded = await loadMore(nextPage);
                if (!isLoaded) {
                    canScrollRef.current = true;
                    return;
                }

                setPageLoaded(nextPage);
                scrollableTarget.scrollTop = scrollableTarget.scrollHeight - beforeScrollHeight + beforeScrollTop;
                canScrollRef.current = true;
            }, 0);
        }, [pageLoaded, hasMore, loadMore, setPageLoaded]);

        useEffect(() => {
            if (!scrollable() || !hasMore) {
                return;
            }

            const target = scrollable();
            target?.addEventListener("wheel", handleScroll, listenerOptions.current);
            target?.addEventListener("scroll", handleScroll, listenerOptions.current);
            target?.addEventListener("resize", handleScroll, listenerOptions.current);

            return () => {
                target?.removeEventListener("wheel", handleScroll, listenerOptions.current);
                target?.removeEventListener("scroll", handleScroll, listenerOptions.current);
                target?.removeEventListener("resize", handleScroll, listenerOptions.current);
            };
        }, [handleScroll]);

        const Comp = as;
        return (
            <Comp {...props} ref={ref}>
                {children}
                {hasMore && loader}
            </Comp>
        );
    }
);

const isPassiveSupported = () => {
    let passive = false;

    const testOptions = {
        get passive() {
            passive = true;
            return passive;
        },
    };

    try {
        document.addEventListener("test", null!, testOptions);
        document.removeEventListener("test", null!, testOptions as EventListenerOptions);
    } catch (e) {
        // ignore
    }
    return passive;
};

export default InfiniteScroller;
