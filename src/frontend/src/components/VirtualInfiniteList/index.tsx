import { IconComponent } from "@/components/base";
import { createShortUUID, StringCase } from "@/core/utils/StringUtils";
import { useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useVirtualizer, Virtualizer } from "@tanstack/react-virtual";
import { cn } from "@/core/utils/ComponentUtils";
import setupResizeEvent from "@/core/events/setupResizeEvent";

export interface IVirtualInfiniteListProps<T> {
    status: "pending" | "error" | "success";
    items: T[];
    scrollable: () => HTMLElement | null;
    fetchNextPage: () => Promise<unknown>;
    createItem: (item: T) => JSX.Element;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    horizontal?: boolean;
    overscan?: number;
    itemClassName?: string;
    className?: string;
    isReverse?: boolean;
    gap?: number;
    noItemsElement?: JSX.Element;
    virtualizerRef?: React.MutableRefObject<Virtualizer<HTMLElement, Element> | null>;
}

const measureElementHeight = (list: HTMLElement, className: string | undefined, element: JSX.Element) => {
    if (!list.clientWidth) {
        return 0;
    }

    const root = document.createElement("div");
    root.className = className ?? "";
    const styles = {
        position: "absolute",
        visibility: "hidden",
        zIndex: "-1",
        width: `${list.clientWidth}px`,
        top: "0",
        height: "1px",
        fontSize: window.getComputedStyle(list).fontSize,
        lineHeight: window.getComputedStyle(list).lineHeight,
        fontWeight: window.getComputedStyle(list).fontWeight,
    };
    root.style.cssText = Object.entries(styles)
        .map(([key, value]) => {
            return `${new StringCase(key).toKebab()}: ${value} !important`;
        })
        .join(";");
    document.body.appendChild(root);

    root.insertAdjacentHTML("beforeend", renderToStaticMarkup(element));

    const height = root.firstElementChild!.clientHeight;

    document.body.removeChild(root);

    return height;
};

function VirtualInfiniteList<T>({
    status,
    items,
    scrollable,
    fetchNextPage,
    createItem,
    hasNextPage,
    isFetchingNextPage,
    overscan,
    isReverse,
    itemClassName,
    className,
    gap = 0,
    noItemsElement,
    virtualizerRef,
}: IVirtualInfiniteListProps<T>) {
    const isLoading = useRef(false);
    const loader = useRef(
        <div className="my-3 flex justify-center" key={createShortUUID()}>
            <IconComponent icon="loader" size="8" className="animate-spin text-gray-500" />
        </div>
    );

    const virtualizer = useVirtualizer({
        count: hasNextPage ? items.length + 1 : items.length,
        getScrollElement: scrollable,
        estimateSize: (i) => {
            const scrollElement = scrollable();
            if (!scrollElement || !items.length) {
                return 0;
            }

            const isLoader = i !== 0 && !items[i];

            return measureElementHeight(scrollElement, className, isLoader ? loader.current : createItem(items[i]));
        },
        overscan,
    });

    if (virtualizerRef) {
        virtualizerRef.current = virtualizer;
    }

    useEffect(() => {
        virtualizer.measure();
        const { destroy: destroyResizeEvent } = setupResizeEvent({
            resizingRef: isLoading,
            doneCallback: () => {
                virtualizer.measure();
            },
        });

        return () => {
            destroyResizeEvent();
        };
    }, []);

    useEffect(() => {
        const scrollElement = scrollable();
        if (!isReverse || status !== "success" || !scrollElement) {
            return;
        }

        scrollElement.style.transform = "scaleY(-1)";
        const handleScroll = (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();

            const currentTarget = e.currentTarget as HTMLElement;

            if (currentTarget) {
                currentTarget.scrollTop -= e.deltaY;
            }
        };
        scrollElement.addEventListener("wheel", handleScroll, {
            passive: false,
        });

        return () => {
            scrollElement?.removeEventListener("wheel", handleScroll);
        };
    }, [status]);

    useEffect(() => {
        const lastItem = virtualizer.getVirtualItems().at(-1);
        const scrollElement = scrollable();
        if (
            !lastItem ||
            !items.length ||
            !scrollElement ||
            lastItem.end > scrollElement.scrollTop + scrollElement.clientHeight ||
            isLoading.current
        ) {
            return;
        }

        if (lastItem.index >= items.length - 1 && hasNextPage && !isFetchingNextPage) {
            isLoading.current = true;
            fetchNextPage();
        }
    }, [scrollable()?.scrollTop]);

    useEffect(() => {
        isLoading.current = isFetchingNextPage;
    }, [isFetchingNextPage]);

    return (
        <>
            {!items.length && noItemsElement ? (
                <div className="-scale-y-100">{noItemsElement}</div>
            ) : (
                <div
                    className={cn("relative flex", isReverse ? "flex-col-reverse" : "flex-col", className)}
                    style={{ height: `${virtualizer.getTotalSize()}px` }}
                >
                    {virtualizer.getVirtualItems().map((row) => {
                        const isLoader = row.index > items.length - 1;
                        const item = items[row.index];
                        const translateY = `translateY(calc(${row.start}px + ${(gap * row.index * 0.25) / 2}rem))`;
                        const style = {
                            transform: isReverse ? `${translateY} scaleY(-1)` : translateY,
                        };

                        return (
                            <div
                                className={cn("absolute left-0 top-0 w-full", itemClassName)}
                                style={style}
                                key={row.key}
                                data-index={row.index}
                                ref={virtualizer.measureElement}
                            >
                                {isLoader && hasNextPage ? loader.current : createItem(item)}
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}

export default VirtualInfiniteList;
