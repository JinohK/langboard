import { monitorForTextSelection } from "@atlaskit/pragmatic-drag-and-drop/text-selection/adapter";
import { makeApi } from "@/core/helpers/dnd/auto-scroll/unsafe-overflow/make-api";

const api = makeApi({ monitor: monitorForTextSelection });

export const unsafeOverflowAutoScrollForTextSelection = api.unsafeOverflowAutoScroll;
