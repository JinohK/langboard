import type { Edge, Side } from "@/core/helpers/dnd/auto-scroll/internal-types";

export const mainAxisSideLookup: { [Key in Edge]: Side } = {
    top: "start",
    right: "end",
    bottom: "end",
    left: "start",
};
