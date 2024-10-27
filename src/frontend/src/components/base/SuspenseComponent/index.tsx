import { Suspense } from "react";
import Skeleton from "@/components/base/Skeleton";
import Progress from "@/components/base/Progress";

interface IBaseSuspenseComponentProps {
    children: React.ReactNode;
    className?: string;
    width?: string;
    height?: string;
    shouldWrapChildren?: boolean;
    isPage?: boolean;
}

interface IElementSuspenseComponentProps extends IBaseSuspenseComponentProps {
    className?: string;
    width?: string;
    height?: string;
    shouldWrapChildren?: boolean;
    isPage?: undefined;
}

interface IPageSuspenseComponentProps extends IBaseSuspenseComponentProps {
    className?: undefined;
    width?: undefined;
    height?: undefined;
    shouldWrapChildren?: boolean;
    isPage: boolean;
}

type TElementSuspenseComponentProps = IElementSuspenseComponentProps | IPageSuspenseComponentProps;

function SuspenseComponent({ children, className, width, height, shouldWrapChildren, isPage }: TElementSuspenseComponentProps) {
    const wrappedChildren = shouldWrapChildren ? <div>{children}</div> : children;
    const fallback = isPage ? <Progress indeterminate height="1" /> : <Skeleton style={{ width, height }} className={className} />;

    return (
        <>
            <Suspense fallback={fallback}>{wrappedChildren}</Suspense>
        </>
    );
}

export default SuspenseComponent;
