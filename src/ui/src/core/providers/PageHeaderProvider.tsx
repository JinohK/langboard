import { createContext, useContext, useEffect, useReducer, useRef } from "react";
import { Utils } from "@langboard/core/utils";
import { APP_NAME } from "@/constants";

export interface IPageHeaderContext {
    setPageAliasRef: React.RefObject<(alias?: string | string[]) => void>;
    locationPopped: number;
}

interface IPageHeaderProps {
    children: React.ReactNode;
}

const initialContext = {
    setPageAliasRef: { current: () => {} },
    locationPopped: 0,
};

const PageHeaderContext = createContext<IPageHeaderContext>(initialContext);

export const PageHeaderProvider = ({ children }: IPageHeaderProps): React.ReactNode => {
    const [locationPopped, forceUpdate] = useReducer((x) => x + 1, 0);
    const pageAliasMap = useRef<Record<string, string[]>>({});

    const setDocumentTitle = (title: string) => {
        if (document.title === title) {
            return;
        }

        document.title = title;
    };
    const setPageAliasRef = useRef((alias?: string | string[]) => {
        const appName = new Utils.String.Case(APP_NAME).toPascal();

        if (!alias) {
            if (!pageAliasMap.current[location.pathname]) {
                setDocumentTitle(appName);
                return;
            }

            alias = pageAliasMap.current[location.pathname];
            setDocumentTitle(`${alias[0]} - ${appName}`);
            return;
        }

        if (Utils.Type.isString(alias)) {
            alias = [alias];
        }

        pageAliasMap.current[location.pathname] = alias;
        setDocumentTitle(`${alias[0]} - ${appName}`);
    });

    const onLocationChange = (e: PopStateEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setPageAliasRef.current();
        forceUpdate();
    };

    useEffect(() => {
        setPageAliasRef.current();

        window.addEventListener("popstate", onLocationChange);

        return () => {
            window.removeEventListener("popstate", onLocationChange);
        };
    }, [locationPopped]);

    return (
        <PageHeaderContext.Provider
            value={{
                setPageAliasRef,
                locationPopped,
            }}
        >
            {children}
        </PageHeaderContext.Provider>
    );
};

export const usePageHeader = () => {
    const context = useContext(PageHeaderContext);
    if (!context) {
        throw new Error("usePageHeader must be used within a PageHeaderProvider");
    }
    return context;
};
