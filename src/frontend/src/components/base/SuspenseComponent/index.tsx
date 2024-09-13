import { Skeleton } from "@radix-ui/themes";
import { Suspense } from "react";

interface ISuspenseComponentProps {
    children: React.ReactNode;
    width?: string;
    height?: string;
    isLoading?: boolean;
    fallback?: React.ReactNode;
    shouldWrapChildren?: boolean;
}

function SuspenseComponent({
    children,
    width,
    height,
    isLoading,
    fallback,
    shouldWrapChildren,
}: ISuspenseComponentProps) {
    const wrappedChildren = shouldWrapChildren ? <div>{children}</div> : children;

    return (
        <>
            <Suspense fallback={fallback}>
                <Skeleton loading={isLoading} width={width} height={height}>
                    {wrappedChildren}
                </Skeleton>
            </Suspense>
        </>
    );
}

export default SuspenseComponent;
