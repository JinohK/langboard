import TypeUtils from "@/core/utils/TypeUtils";
import { useCallback, useRef } from "react";
import { NavigateOptions, To, useNavigate } from "react-router";

export interface INavigationFunction {
    (to: To | number, options?: IPageNavigateOptions): void;
    (delta: number): void;
}

export interface IPageNavigateOptions extends Omit<NavigateOptions, "viewTransition" | "flushSync"> {
    smooth?: bool;
}

export const usePageNavigate = () => {
    const baseNavigate = useNavigate();
    const navigate: INavigationFunction = useCallback(
        (to: To | number, options?: IPageNavigateOptions) => {
            if (TypeUtils.isNumber(to)) {
                return baseNavigate(to);
            }

            const navigateOptions = { ...options } as NavigateOptions;
            if (!options) {
                options = {};
            }

            if (TypeUtils.isNullOrUndefined(options.smooth)) {
                navigateOptions.viewTransition = false;
                navigateOptions.flushSync = true;
            } else if (options.smooth) {
                navigateOptions.viewTransition = true;
            }

            return baseNavigate(to, navigateOptions);
        },
        [baseNavigate]
    );

    return navigate;
};

export const usePageNavigateRef = () => {
    const navigations = useRef(usePageNavigate());

    return navigations.current;
};
