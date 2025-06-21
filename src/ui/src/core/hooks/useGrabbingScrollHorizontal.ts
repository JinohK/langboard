const useGrabbingScrollHorizontal = (scrollAreaId: string) => {
    const onPointerDown = (originalEvent: React.PointerEvent<HTMLElement>) => {
        if (originalEvent.target !== originalEvent.currentTarget) {
            return;
        }

        document.documentElement.style.cursor = "grabbing";
        document.documentElement.style.userSelect = "none";
        const target = originalEvent.currentTarget;
        const scrollArea = target.closest<HTMLDivElement>(`#${scrollAreaId}`)!;
        const originalMouseX = originalEvent.pageX;
        const originalScrollLeft = scrollArea.scrollLeft;

        const moveEvent = (event: PointerEvent) => {
            const x = event.pageX;
            const walkX = x - originalMouseX;
            scrollArea.scrollLeft = originalScrollLeft - walkX;
        };

        const upEvent = () => {
            document.documentElement.style.cursor = "";
            document.documentElement.style.userSelect = "";
            window.removeEventListener("pointermove", moveEvent);
            window.removeEventListener("pointerup", upEvent);
        };

        window.addEventListener("pointermove", moveEvent);
        window.addEventListener("pointerup", upEvent);
    };

    return { onPointerDown };
};

export default useGrabbingScrollHorizontal;
