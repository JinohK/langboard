import { Suspense } from "react";
import Skeleton from "@/components/base/Skeleton";
import { Progress } from "@/components/base";

interface IBaseSuspenseComponentProps {
    children: React.ReactNode;
    className?: string;
    width?: string;
    height?: string;
    shouldWrapChildren?: bool;
    isPage?: bool;
}

interface IElementSuspenseComponentProps extends IBaseSuspenseComponentProps {
    className?: string;
    width?: string;
    height?: string;
    shouldWrapChildren?: bool;
    isPage?: undefined;
}

interface IPageSuspenseComponentProps extends IBaseSuspenseComponentProps {
    className?: undefined;
    width?: undefined;
    height?: undefined;
    shouldWrapChildren?: bool;
    isPage: bool;
}

type TElementSuspenseComponentProps = IElementSuspenseComponentProps | IPageSuspenseComponentProps;

function SuspenseComponent({ children, className, width, height, shouldWrapChildren, isPage }: TElementSuspenseComponentProps) {
    const wrappedChildren = shouldWrapChildren ? <div>{children}</div> : children;
    const fallback = isPage ? (
        <Progress indeterminate height="1" className="fixed top-0 z-[9999999]" />
    ) : (
        <Skeleton style={{ width, height }} className={className} />
    );

    return <Suspense fallback={fallback}>{wrappedChildren}</Suspense>;
}

export default SuspenseComponent;
