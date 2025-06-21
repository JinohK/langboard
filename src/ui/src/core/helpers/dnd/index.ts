import createDndColumnEvents from "@/core/helpers/dnd/createDndColumnEvents";
import createDndRootEvents from "@/core/helpers/dnd/createDndRootEvents";
import createDndRowEvents from "@/core/helpers/dnd/createDndRowEvents";
import createDndSingleRootEvents from "@/core/helpers/dnd/createDndSingleRootEvents";
import createDndSingleRowEvents from "@/core/helpers/dnd/createDndSingleRowEvents";

export const columnRowDndHelpers = {
    root: createDndRootEvents,
    column: createDndColumnEvents,
    row: createDndRowEvents,
};

export const singleDndHelpers = {
    root: createDndSingleRootEvents,
    row: createDndSingleRowEvents,
};
