import { cn } from "@/core/utils/ComponentUtils";

interface IBaseSkeletonProps {
    as?: "div" | "span";
}

interface IDivSkeletonProps extends IBaseSkeletonProps, React.HTMLAttributes<HTMLDivElement> {
    as?: "div";
}

interface ISpanSkeletonProps extends IBaseSkeletonProps, React.HTMLAttributes<HTMLSpanElement> {
    as: "span";
}

export type TSkeletonProps = IDivSkeletonProps | ISpanSkeletonProps;

function Skeleton({ as = "div", className, ...props }: TSkeletonProps) {
    const classNames = cn("animate-pulse rounded-md bg-primary/10", className);
    if (as === "span") {
        return <span className={classNames} {...props} />;
    } else {
        return <div className={classNames} {...props} />;
    }
}

export default Skeleton;
