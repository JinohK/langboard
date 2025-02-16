import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import TypeUtils from "@/core/utils/TypeUtils";
import { NavigateFunction, NavigateOptions, To, useNavigate } from "react-router-dom";

const usePageNavigate = (): NavigateFunction => {
    const { setIsLoadingRef } = usePageHeader();
    const navigate = useNavigate();

    const navigateWithLoader = (to: To | number, options?: NavigateOptions) => {
        if (TypeUtils.isNumber(to)) {
            setIsLoadingRef.current(true);
            navigate(to);
            return;
        }

        if (isSameURL(to)) {
            navigate(to, options);
            return;
        }

        setIsLoadingRef.current(true);
        navigate(to, options);
    };

    return navigateWithLoader;
};

const isSameURL = (to: To): bool => {
    const current = new URL(window.location.href);
    let toUrl: URL;
    if (TypeUtils.isString(to)) {
        toUrl = new URL(to, current.origin);
    } else {
        toUrl = new URL(to.pathname ?? current.pathname, current.origin);
    }

    return current.pathname === toUrl.pathname;
};

export default usePageNavigate;
