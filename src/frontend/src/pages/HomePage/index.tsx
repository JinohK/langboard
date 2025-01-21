import { usePageLoader } from "@/core/providers/PageLoaderProvider";
import { useEffect } from "react";

function HomePage(): JSX.Element {
    const { setIsLoadingRef } = usePageLoader();

    useEffect(() => {
        setIsLoadingRef.current(false);
    }, []);

    return <></>;
}

export default HomePage;
