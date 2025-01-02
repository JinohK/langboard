import { Box } from "@/components/base";
import { ISortableDragData } from "@/core/hooks/useColumnRowSortable";
import { Project, ProjectCheckitem } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import SharedBoardCardCheckitem from "@/pages/BoardPage/components/card/checkitem/SharedBoardCardCheckitem";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { tv } from "tailwind-variants";

export interface IBoardCardSubCheckitemProps {
    checkitem: ProjectCheckitem.TModel;
    isOverlay?: bool;
}

interface IBoardCardCheckitemDragData extends ISortableDragData<ProjectCheckitem.TModel> {
    type: "SubCheckitem";
}

function BoardCardSubCheckitem({ checkitem, isOverlay }: IBoardCardSubCheckitemProps): JSX.Element {
    const { hasRoleAction } = useBoardCard();
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: checkitem.uid,
        data: {
            type: "SubCheckitem",
            data: checkitem,
        } satisfies IBoardCardCheckitemDragData,
        attributes: {
            roleDescription: "SubCheckitem",
        },
    });
    const canReorder = hasRoleAction(Project.ERoleAction.CARD_UPDATE);

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    const variants = tv({
        base: cn(
            "ml-2 sm:ml-4 relative border-accent",
            "after:content-[''] after:absolute after:-top-1/2 after:left-0",
            "after:border-l after:border-b after:border-accent after:h-full after:w-3"
        ),
        variants: {
            dragging: {
                over: "border-b-2 border-primary/50 [&>div]:opacity-30",
                overlay: "",
            },
        },
    });

    let props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
    if (canReorder) {
        props = {
            style,
            className: variants({
                dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
            }),
            ref: setNodeRef,
        };
    } else {
        props = {
            className: variants(),
        };
    }

    return (
        <Box {...props}>
            <SharedBoardCardCheckitem checkitem={checkitem} attributes={attributes} listeners={listeners} className="ml-2" />
        </Box>
    );
}

export default BoardCardSubCheckitem;
