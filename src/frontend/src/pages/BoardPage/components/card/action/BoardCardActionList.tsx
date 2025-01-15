import { Skeleton } from "@/components/base";
import BoardCardActionActivity from "@/pages/BoardPage/components/card/action/BoardCardActionActivity";
import BoardCardActionAttachFile from "@/pages/BoardPage/components/card/action/file/BoardCardActionAttachFile";
import BoardCardActionShare from "@/pages/BoardPage/components/card/action/BoardCardActionShare";
import BoardCardActionSetLabel from "@/pages/BoardPage/components/card/action/label/BoardCardActionSetLabel";
import BoardCardActionRelationship from "@/pages/BoardPage/components/card/action/relationship/BoardCardActionRelationship";
import BoardCardActionAddCheckGroup from "@/pages/BoardPage/components/card/action/checkgroup/BoardCardActionAddCheckGroup";
import { memo } from "react";

const sharedButtonClassName = "mb-2 w-full justify-start gap-2 rounded-none px-2 py-1 sm:h-7";

export function SkeletonBoardCardActionList() {
    return (
        <>
            <Skeleton className={sharedButtonClassName} />
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
            <BoardCardActionRelationship buttonClassName={sharedButtonClassName} />
            <BoardCardActionAttachFile buttonClassName={sharedButtonClassName} />
            <BoardCardActionAddCheckGroup buttonClassName={sharedButtonClassName} />
            <BoardCardActionActivity buttonClassName={sharedButtonClassName} />
            <BoardCardActionShare buttonClassName={sharedButtonClassName} />
        </>
    );
});

export default BoardCardActionList;
