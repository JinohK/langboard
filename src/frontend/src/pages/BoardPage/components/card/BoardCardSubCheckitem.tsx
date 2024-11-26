import { IBoardCardSubCheckitem } from "@/controllers/board/useGetCardDetails";
import { cn } from "@/core/utils/ComponentUtils";
import ShardBoardCardCheckitem from "@/pages/BoardPage/components/card/ShardBoardCardCheckitem";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { tv } from "tailwind-variants";

export interface IBoardCardSubCheckitemProps {
    checkitem: IBoardCardSubCheckitem;
    orderable: bool;
    isOverlay?: bool;
}

interface IBoardCardCheckitemDragData {
    type: "SubCheckitem";
    data: IBoardCardSubCheckitem;
}

function BoardCardSubCheckitem({ checkitem, orderable, isOverlay }: IBoardCardSubCheckitemProps): JSX.Element {
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

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    const variants = tv({
        base: cn(
            "ml-4 relative border-accent",
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
    if (orderable) {
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
        <div {...props}>
            <ShardBoardCardCheckitem checkitem={checkitem} attributes={attributes} listeners={listeners} orderable={orderable} className="ml-2" />
        </div>
    );
}

export default BoardCardSubCheckitem;
