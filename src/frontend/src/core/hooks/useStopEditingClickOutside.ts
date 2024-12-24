import TypeUtils from "@/core/utils/TypeUtils";
import { useCallback } from "react";

const useStopEditingClickOutside = (boxAttr: string, callback: () => void, isEditing?: bool) => {
    const stopEditing = useCallback(
        (event: React.MouseEvent | CustomEvent | MouseEvent) => {
            const target = event.target as HTMLElement;
            if (
                (TypeUtils.isBool(isEditing) && !isEditing) ||
                target.hasAttribute("data-scroll-area-scrollbar") ||
                target.closest("[data-scroll-area-scrollbar]") ||
                target.closest("[data-sonner-toast]") ||
                target.closest(`${boxAttr}`) ||
                target.closest("[data-radix-popper-content-wrapper") || // Editor's dropdown menu
                target.closest("[data-radix-alert-dialog-content-wrapper]") // Editor's alert dialog
            ) {
                return;
            }

            callback();
        },
        [callback, isEditing]
    );

    return { stopEditing };
};

export default useStopEditingClickOutside;
