import { Card } from "@/components/base";
import { ProjectColumn } from "@/core/models";
import { cn } from "@/core/utils/ComponentUtils";
import BoardColumnMore from "@/pages/BoardPage/components/board/BoardColumnMore";
import BoardColumnTitle from "@/pages/BoardPage/components/board/BoardColumnTitle";
import { memo, useState } from "react";

export interface IBoardColumnHeaderProps {
    isDragging: bool;
    column: ProjectColumn.TModel;
    headerProps: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
}

const BoardColumnHeader = memo(({ isDragging, column, headerProps }: IBoardColumnHeaderProps) => {
    const isEditingState = useState(false);
    const [isEditing] = isEditingState;

    return (
        <Card.Header
            className={cn("flex flex-row items-start justify-between space-y-0 pb-1 pt-4 text-left font-semibold", !isEditing && "pr-3")}
            {...headerProps}
        >
            <BoardColumnTitle isDragging={isDragging} column={column} isEditingState={isEditingState} />
            <BoardColumnMore column={column} isEditingState={isEditingState} />
        </Card.Header>
    );
});

export default BoardColumnHeader;
