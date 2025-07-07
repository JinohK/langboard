import { useEffect, useRef } from "react";

interface IUseResizeEventProps {
    doneCallback: () => void;
    timer?: number;
}

const useResizeEvent = ({ doneCallback, timer = 300 }: IUseResizeEventProps, deps?: React.DependencyList) => {
    const isResizingRef = useRef(false);

    useEffect(() => {
        let resizingTimeout: NodeJS.Timeout;

        const resizeDone = () => {
            if (!isResizingRef.current) {
                return;
            }

            doneCallback();
            isResizingRef.current = false;
            clearTimeout(resizingTimeout);
        };

        const resizeEvent = () => {
            clearTimeout(resizingTimeout);
            resizingTimeout = setTimeout(resizeDone, timer);
            isResizingRef.current = true;
        };

        window.addEventListener("resize", resizeEvent);

        return () => {
            clearTimeout(resizingTimeout);
            window.removeEventListener("resize", resizeEvent);
        };
    }, deps);

    return {
        isResizingRef,
    };
};

export default useResizeEvent;
