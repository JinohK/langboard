import { Card } from "@/components/base";
import { ProjectColumn } from "@/core/models";
import BoardColumnMoreMenu from "@/pages/BoardPage/components/board/BoardColumnMoreMenu";
import BoardColumnTitle from "@/pages/BoardPage/components/board/BoardColumnTitle";
import { memo } from "react";

export interface IBoardColumnHeaderProps {
    isDragging: bool;
    column: ProjectColumn.TModel;
    headerProps: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
}

const BoardColumnHeader = memo(({ isDragging, column, headerProps }: IBoardColumnHeaderProps) => {
    return (
        <Card.Header className="flex flex-row items-start justify-between space-y-0 pb-1 pr-3 pt-4 text-left font-semibold" {...headerProps}>
            <BoardColumnTitle isDragging={isDragging} column={column} />
            <BoardColumnMoreMenu column={column} />
        </Card.Header>
    );
});
BoardColumnHeader.displayName = "Board.ColumnHeader";

export default BoardColumnHeader;
