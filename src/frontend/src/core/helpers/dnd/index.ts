import createDndColumnEvents from "@/core/helpers/dnd/createDndColumnEvents";
import createDndRootEvents from "@/core/helpers/dnd/createDndRootEvents";
import createDndRowEvents from "@/core/helpers/dnd/createDndRowEvents";

export const dndHelpers = {
    root: createDndRootEvents,
    column: createDndColumnEvents,
    row: createDndRowEvents,
};
