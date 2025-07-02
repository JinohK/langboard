import { Utils } from "@langboard/core/utils";
import { useCallback, useEffect, useRef } from "react";

export interface IUseHoverEffectProps {
    isOpened: bool;
    setIsOpened: (opened: bool) => void;
    scopeAttr: string;
    expectedScopeValue: string;
    delay?: number;
}

const useHoverEffect = ({ isOpened, setIsOpened, scopeAttr, expectedScopeValue, delay = 500 }: IUseHoverEffectProps) => {
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const onPointerEnter = useCallback(() => {
        if (isOpened) {
            return;
        }

        hoverTimeoutRef.current = setTimeout(() => {
            setIsOpened(true);
            if (!Utils.Type.isNullOrUndefined(hoverTimeoutRef.current)) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
            }
        }, delay);
    }, [isOpened]);
    const onPointerLeave = () => {
        if (!Utils.Type.isNullOrUndefined(hoverTimeoutRef.current)) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
    };

    useEffect(() => {
        if (!isOpened) {
            return;
        }

        let outTimeout: NodeJS.Timeout;
        const mouseOutHandler = (e: MouseEvent) => {
            const elementInScope = (e.target as Element)?.closest?.(`[${scopeAttr}]`);
            const attrValue = elementInScope?.getAttribute(scopeAttr);
            if (e.target !== document.documentElement && (!elementInScope || attrValue !== expectedScopeValue)) {
                if (!outTimeout) {
                    outTimeout = setTimeout(() => {
                        setIsOpened(false);
                        if (!Utils.Type.isNullOrUndefined(outTimeout)) {
                            clearTimeout(outTimeout);
                            outTimeout = undefined!;
                        }
                    }, delay);
                }
                return;
            }

            if (outTimeout) {
                clearTimeout(outTimeout);
                outTimeout = undefined!;
            }
        };

        window.addEventListener("mouseover", mouseOutHandler);
        return () => {
            window.removeEventListener("mouseover", mouseOutHandler);
            if (!Utils.Type.isNullOrUndefined(outTimeout)) {
                clearTimeout(outTimeout);
                outTimeout = undefined!;
            }
        };
    }, [isOpened]);

    return {
        onPointerEnter,
        onPointerLeave,
    };
};

export default useHoverEffect;
