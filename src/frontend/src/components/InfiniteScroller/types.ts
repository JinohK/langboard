export interface IUseInfiniteScrollerLoaderObserverProps {
    hasMore?: bool;
    initialLoad?: bool;
    loadMore: (page: number) => Promise<bool> | bool;
    pageStart?: number;
    loader: React.ReactNode;
    scrollable: () => HTMLElement | null;
    children: React.ReactNode;
}

export type TSharedInfiniteScrollerProps<TComp extends React.ReactElement | HTMLElement> = React.HTMLAttributes<TComp> &
    IUseInfiniteScrollerLoaderObserverProps;
