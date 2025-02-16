import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Progress } from "@/components/base";
import { StringCase } from "@/core/utils/StringUtils";
import { APP_NAME } from "@/constants";
import TypeUtils from "@/core/utils/TypeUtils";

export interface IPageHeaderContext {
    setIsLoadingRef: React.RefObject<(isLoading: bool) => void>;
    setPageAliasRef: React.RefObject<(alias?: string | string[]) => void>;
}

interface IPageHeaderProps {
    children: React.ReactNode;
}

const initialContext = {
    setIsLoadingRef: { current: () => {} },
    setPageAliasRef: { current: () => {} },
};

const PageHeaderContext = createContext<IPageHeaderContext>(initialContext);

export const PageHeaderProvider = ({ children }: IPageHeaderProps): React.ReactNode => {
    const setIsLoadingRef = useRef<(isLoading: bool) => void>(() => {});
    const setPageAliasRef = useRef<(alias?: string | string[]) => void>(() => {});

    useEffect(() => {
        setPageAliasRef.current();

        const onLocationChange = () => {
            setIsLoadingRef.current(true);
            setPageAliasRef.current();
        };

        window.addEventListener("popstate", onLocationChange);

        return () => {
            window.removeEventListener("popstate", onLocationChange);
        };
    }, []);

    return (
        <PageHeaderContext.Provider
            value={{
                setIsLoadingRef,
                setPageAliasRef,
            }}
        >
            <PageHeader setIsLoadingRef={setIsLoadingRef} setPageAliasRef={setPageAliasRef} />
            {children}
        </PageHeaderContext.Provider>
    );
};

interface IPageHaderProps extends Pick<IPageHeaderContext, "setIsLoadingRef" | "setPageAliasRef"> {}

const PageHeader = ({ setIsLoadingRef, setPageAliasRef }: IPageHaderProps): React.ReactNode => {
    const [isLoading, setIsLoading] = useState(true);
    const pageAliasMap = useRef<Record<string, string[]>>({});
    setIsLoadingRef.current = setIsLoading;
    setPageAliasRef.current = (alias?: string | string[]) => {
        const appName = new StringCase(APP_NAME).toPascal();

        if (!alias) {
            if (!pageAliasMap.current[location.pathname]) {
                setDocumentTitle(appName);
                return;
            }

            alias = pageAliasMap.current[location.pathname];
            setDocumentTitle(`${alias[0]} - ${appName}`);
            return;
        }

        if (TypeUtils.isString(alias)) {
            alias = [alias];
        }

        pageAliasMap.current[location.pathname] = alias;
        setDocumentTitle(`${alias[0]} - ${appName}`);
    };

    const setDocumentTitle = (title: string) => {
        if (document.title === title) {
            return;
        }

        document.title = title;
    };

    return <>{isLoading && <Progress indeterminate height="1" className="fixed top-0 z-[9999999]" />}</>;
};

export const usePageHeader = () => {
    const context = useContext(PageHeaderContext);
    if (!context) {
        throw new Error("usePageHeader must be used within a PageHeaderProvider");
    }
    return context;
};
