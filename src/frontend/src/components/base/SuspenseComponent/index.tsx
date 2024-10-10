import { Suspense } from "react";
import Skeleton from "@/components/base/Skeleton";

interface ISuspenseComponentProps {
    children: React.ReactNode;
    className?: string;
    width?: string;
    height?: string;
    shouldWrapChildren?: boolean;
}

function SuspenseComponent({ children, className, width, height, shouldWrapChildren }: ISuspenseComponentProps) {
    const wrappedChildren = shouldWrapChildren ? <div>{children}</div> : children;

    return (
        <>
            <Suspense fallback={<Skeleton style={{ width, height }} className={className} />}>
                {wrappedChildren}
            </Suspense>
        </>
    );
}

export default SuspenseComponent;
