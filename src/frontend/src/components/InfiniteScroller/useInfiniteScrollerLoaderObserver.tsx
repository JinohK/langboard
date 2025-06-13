import { IUseInfiniteScrollerLoaderObserverProps } from "@/components/InfiniteScroller/types";
import { useCallback, useEffect, useRef } from "react";

const useInfiniteScrollerLoaderObserver = ({
    hasMore = false,
    initialLoad = true,
    loadMore,
    pageStart = 1,
    loader,
    scrollable,
    children,
}: IUseInfiniteScrollerLoaderObserverProps) => {
    const pageRef = useRef(pageStart);
    const loaderRef = useRef<HTMLDivElement | null>(null);
    const canLoadRef = useRef(true);
    const isFirstLoadedRef = useRef(!initialLoad);

    const triggerLoad = useCallback(async () => {
        if (!canLoadRef.current || !hasMore) {
            return;
        }
        canLoadRef.current = false;
        const next = pageRef.current + 1;
        const isLoaded = await loadMore(next);
        setTimeout(() => {
            canLoadRef.current = true;
        }, 0);

        if (isLoaded) {
            pageRef.current = next;
        }
    }, [hasMore, loadMore]);

    useEffect(() => {
        if (initialLoad && pageRef.current === pageStart) {
            triggerLoad().finally(() => {
                isFirstLoadedRef.current = true;
            });
        }
    }, []);

    useEffect(() => {
        const rootElem = scrollable();
        if (!rootElem || !loaderRef.current || !hasMore || !isFirstLoadedRef.current) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (!isFirstLoadedRef.current) {
                    return;
                }

                if (entries[0].isIntersecting) {
                    triggerLoad();
                }
            },
            { root: rootElem, threshold: 0.1 }
        );
        observer.observe(loaderRef.current);

        return () => {
            observer.disconnect();
        };
    }, [triggerLoad, scrollable, hasMore]);

    let items = Array.isArray(children) ? children : [children];
    if (hasMore) {
        items = [...items, loader];
    }

    return {
        loaderRef,
        items,
    };
};

export default useInfiniteScrollerLoaderObserver;
