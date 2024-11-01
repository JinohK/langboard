import { MutableRefObject } from "react";

interface ICreateResizeEventProps {
    resizingRef: MutableRefObject<bool>;
    doneCallback: () => void;
    timer?: number;
}

const setupResizeEvent = ({ resizingRef, doneCallback, timer = 300 }: ICreateResizeEventProps) => {
    let resizingTimeout: NodeJS.Timeout;

    const resizeDone = () => {
        if (!resizingRef.current) {
            return;
        }

        doneCallback();
        resizingRef.current = false;
        clearTimeout(resizingTimeout);
    };

    const resizeEvent = () => {
        clearTimeout(resizingTimeout);
        resizingTimeout = setTimeout(resizeDone, timer);
        resizingRef.current = true;
    };

    window.addEventListener("resize", resizeEvent);

    return {
        destroy: () => {
            window.removeEventListener("resize", resizeEvent);
        },
    };
};

export default setupResizeEvent;
