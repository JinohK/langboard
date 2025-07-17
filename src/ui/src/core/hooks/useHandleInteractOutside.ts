import { useCallback } from "react";
import type { DismissableLayerProps } from "@radix-ui/react-dismissable-layer";
import { Utils } from "@langboard/core/utils";

export interface IUseInteractOutsideProps {
    interactOutside?: DismissableLayerProps["onInteractOutside"];
    pointerDownOutside?: DismissableLayerProps["onPointerDownOutside"];
}

const useHandleInteractOutside = ({ interactOutside, pointerDownOutside }: IUseInteractOutsideProps, deps?: React.DependencyList) => {
    const onInteractOutside = useCallback<Exclude<DismissableLayerProps["onInteractOutside"], undefined>>(
        (e) => {
            e.preventDefault();
            interactOutside?.(e);
        },
        [interactOutside, ...(deps ?? [])]
    );
    const onPointerDownOutside = useCallback<Exclude<DismissableLayerProps["onPointerDownOutside"], undefined>>(
        (e) => {
            e.preventDefault();
            const target = e.target;
            if (!Utils.Type.isElement(target) || target.closest(".toaster")) {
                return;
            }

            pointerDownOutside?.(e);
        },
        [pointerDownOutside, ...(deps ?? [])]
    );

    return {
        onInteractOutside,
        onPointerDownOutside,
    };
};

export default useHandleInteractOutside;
