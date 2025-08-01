import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { makeApi } from "@/core/helpers/dnd/auto-scroll/over-element/make-api";

const api = makeApi({ monitor: monitorForElements });

export const autoScrollForElements = api.autoScroll;
export const autoScrollWindowForElements = api.autoScrollWindow;
