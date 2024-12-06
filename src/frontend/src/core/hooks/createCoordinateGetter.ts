import { closestCorners, DroppableContainer, getFirstCollision, KeyboardCode, KeyboardCoordinateGetter } from "@dnd-kit/core";

const DIRECTIONS: string[] = [KeyboardCode.Down, KeyboardCode.Right, KeyboardCode.Up, KeyboardCode.Left];
const createCoordinateGetter = (columnDragDataType: string) => {
    const coordinateGetter: KeyboardCoordinateGetter = (event, { context: { active, droppableRects, droppableContainers, collisionRect } }) => {
        if (!DIRECTIONS.includes(event.code)) {
            return;
        }

        event.preventDefault();

        if (!active || !collisionRect) {
            return;
        }

        const filteredContainers: DroppableContainer[] = [];

        droppableContainers.getEnabled().forEach((entry) => {
            if (!entry || entry?.disabled) {
                return;
            }

            const rect = droppableRects.get(entry.id);
            if (!rect) {
                return;
            }

            const data = entry.data.current;

            if (data) {
                const { type, children } = data;

                if (type === columnDragDataType && children?.length > 0) {
                    if (active.data.current?.type !== columnDragDataType) {
                        return;
                    }
                }
            }

            switch (event.code) {
                case KeyboardCode.Down:
                    if (active.data.current?.type === columnDragDataType) {
                        return;
                    }
                    if (collisionRect.top < rect.top) {
                        filteredContainers.push(entry);
                    }
                    break;
                case KeyboardCode.Up:
                    if (active.data.current?.type === columnDragDataType) {
                        return;
                    }
                    if (collisionRect.top > rect.top) {
                        filteredContainers.push(entry);
                    }
                    break;
                case KeyboardCode.Left:
                    if (collisionRect.left >= rect.left + rect.width) {
                        filteredContainers.push(entry);
                    }
                    break;
                case KeyboardCode.Right:
                    if (collisionRect.left + collisionRect.width <= rect.left) {
                        filteredContainers.push(entry);
                    }
                    break;
            }
        });

        const collisions = closestCorners({
            active,
            collisionRect: collisionRect,
            droppableRects,
            droppableContainers: filteredContainers,
            pointerCoordinates: null,
        });

        const closestId = getFirstCollision(collisions, "id");

        if (closestId != null) {
            const newDroppable = droppableContainers.get(closestId);
            const newNode = newDroppable?.node.current;
            const newRect = newDroppable?.rect.current;

            if (newNode && newRect) {
                return {
                    x: newRect.left,
                    y: newRect.top,
                };
            }
        }
    };

    return coordinateGetter;
};

export default createCoordinateGetter;
