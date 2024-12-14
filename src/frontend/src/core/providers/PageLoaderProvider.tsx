import { createContext, useContext, useRef, useState } from "react";
import { Progress } from "@/components/base";

export interface IPageLoaderContext {
    setIsLoadingRef: React.MutableRefObject<(isLoading: boolean) => void>;
}

interface IPageLoaderProps {
    children: React.ReactNode;
}

const initialContext = {
    setIsLoadingRef: { current: () => {} },
};

const PageLoaderContext = createContext<IPageLoaderContext>(initialContext);

const PageLoader = ({ setIsLoadingRef }: { setIsLoadingRef: IPageLoaderContext["setIsLoadingRef"] }): React.ReactNode => {
    const [isLoading, setIsLoading] = useState(true);
    setIsLoadingRef.current = setIsLoading;

    return <>{isLoading && <Progress indeterminate height="1" className="fixed top-0 z-[9999999]" />}</>;
};

export const PageLoaderdProvider = ({ children }: IPageLoaderProps): React.ReactNode => {
    const setIsLoadingRef = useRef<(isLoading: boolean) => void>(() => {});

    return (
        <PageLoaderContext.Provider
            value={{
                setIsLoadingRef,
            }}
        >
            <PageLoader setIsLoadingRef={setIsLoadingRef} />
            {children}
        </PageLoaderContext.Provider>
    );
};

export const usePageLoader = () => {
    const context = useContext(PageLoaderContext);
    if (!context) {
        throw new Error("usePageLoader must be used within a PageLoaderProvider");
    }
    return context;
};
