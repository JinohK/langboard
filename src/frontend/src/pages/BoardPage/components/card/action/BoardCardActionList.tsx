import { Skeleton } from "@/components/base";
import BoardCardActionActivity from "@/pages/BoardPage/components/card/action/BoardCardActionActivity";
import BoardCardActionAttachFile from "@/pages/BoardPage/components/card/action/file/BoardCardActionAttachFile";
import BoardCardActionShare from "@/pages/BoardPage/components/card/action/BoardCardActionShare";
import { memo } from "react";
import BoardCardActionSetLabel from "@/pages/BoardPage/components/card/action/label/BoardCardActionSetLabel";

const sharedButtonClassName = "mb-2 w-full justify-start gap-2 rounded-none px-2 py-1 sm:h-7";

export function SkeletonBoardCardActionList() {
    return (
        <>
            <Skeleton className={sharedButtonClassName} />
            <Skeleton className={sharedButtonClassName} />
            <Skeleton className={sharedButtonClassName} />
            <Skeleton className={sharedButtonClassName} />
        </>
    );
}

const BoardCardActionList = memo(() => {
    return (
        <>
            <BoardCardActionSetLabel buttonClassName={sharedButtonClassName} />
            <BoardCardActionAttachFile buttonClassName={sharedButtonClassName} />
            <BoardCardActionActivity buttonClassName={sharedButtonClassName} />
            <BoardCardActionShare buttonClassName={sharedButtonClassName} />
        </>
    );
});

export default BoardCardActionList;
