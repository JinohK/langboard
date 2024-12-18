import { usePageLoader } from "@/core/providers/PageLoaderProvider";
import { memo, useEffect } from "react";

export function SkeletonSettingsList() {
    return <></>;
}

const BoardSettingsList = memo(() => {
    const { setIsLoadingRef } = usePageLoader();

    useEffect(() => {
        setIsLoadingRef.current(false);
    }, []);

    return <></>;
});

export default BoardSettingsList;
