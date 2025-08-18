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
    const outTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const onPointerEnter = useCallback(() => {
        if (isOpened) {
            return;
        }

        if (outTimeoutRef.current) {
            clearTimeout(outTimeoutRef.current);
            outTimeoutRef.current = null;
        }

        hoverTimeoutRef.current = setTimeout(() => {
            setIsOpened(true);
            if (!Utils.Type.isNullOrUndefined(hoverTimeoutRef.current)) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
            }
        }, delay);
    }, [isOpened, setIsOpened]);
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

        const mouseOutHandler = (e: MouseEvent) => {
            const elementInScope = (e.target as Element)?.closest?.(`[${scopeAttr}]`);
            const attrValue = elementInScope?.getAttribute(scopeAttr);
            if (!elementInScope || attrValue !== expectedScopeValue) {
                if (!outTimeoutRef.current) {
                    outTimeoutRef.current = setTimeout(() => {
                        setIsOpened(false);
                        if (!Utils.Type.isNullOrUndefined(outTimeoutRef.current)) {
                            clearTimeout(outTimeoutRef.current);
                            outTimeoutRef.current = null;
                        }
                    }, delay);
                }
                return;
            }

            if (outTimeoutRef.current) {
                clearTimeout(outTimeoutRef.current);
                outTimeoutRef.current = null;
            }
        };

        window.addEventListener("mouseover", mouseOutHandler);
        return () => {
            window.removeEventListener("mouseover", mouseOutHandler);
            if (!Utils.Type.isNullOrUndefined(outTimeoutRef.current)) {
                clearTimeout(outTimeoutRef.current);
                outTimeoutRef.current = null;
            }
        };
    }, [isOpened]);

    return {
        onPointerEnter,
        onPointerLeave,
    };
};

export default useHoverEffect;
