import BoardCardActionActivity from "@/pages/BoardPage/components/card/action/BoardCardActionActivity";
import BoardCardActionAttachFile from "@/pages/BoardPage/components/card/action/BoardCardActionAttachFile";
import BoardCardActionShare from "@/pages/BoardPage/components/card/action/BoardCardActionShare";
import { memo } from "react";

const BoardCardActionList = memo(() => {
    const sharedButtonClassName = "mb-2 w-full justify-start gap-2 rounded-none px-2 py-1 sm:h-7";

    return (
        <>
            <BoardCardActionAttachFile buttonClassName={sharedButtonClassName} />
            <BoardCardActionActivity buttonClassName={sharedButtonClassName} />
            <BoardCardActionShare buttonClassName={sharedButtonClassName} />
        </>
    );
});

export default BoardCardActionList;
