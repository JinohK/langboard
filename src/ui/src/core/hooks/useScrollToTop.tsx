import { useCallback, useEffect, useRef, useState } from "react";

export interface IUseScrollToTopProps {
    offset?: number;
}

const useScrollToTop = ({ offset = 20 }: IUseScrollToTopProps) => {
    const [isAtTop, setIsAtTop] = useState(true);
    const scrollableRef = useRef<HTMLDivElement>(null);
    const handleScroll = useCallback(() => {
        if (!scrollableRef.current) {
            return;
        }

        const checkIsAtTop = scrollableRef.current.scrollTop <= offset;
        if (isAtTop !== checkIsAtTop) {
            setIsAtTop(checkIsAtTop);
        }
    }, [offset, isAtTop, setIsAtTop]);

    const scrollToTop = () => {
        if (!scrollableRef.current) {
            return;
        }

        scrollableRef.current.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    useEffect(() => {
        if (!scrollableRef.current) {
            return;
        }

        scrollableRef.current.addEventListener("scroll", handleScroll);
        return () => {
            scrollableRef.current?.removeEventListener("scroll", handleScroll);
        };
    }, [handleScroll]);

    return {
        scrollableRef,
        isAtTop,
        scrollToTop,
    };
};

export default useScrollToTop;
