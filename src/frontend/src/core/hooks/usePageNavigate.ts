import { usePageLoader } from "@/core/providers/PageLoaderProvider";
import { NavigateFunction, NavigateOptions, To, useNavigate } from "react-router-dom";

const usePageNavigate = (): NavigateFunction => {
    const { setIsLoadingRef } = usePageLoader();
    const navigate = useNavigate();

    const navigateWithLoader = (to: To | number, options?: NavigateOptions) => {
        setIsLoadingRef.current(true);
        navigate(to as To, options);
    };

    return navigateWithLoader;
};

export default usePageNavigate;
