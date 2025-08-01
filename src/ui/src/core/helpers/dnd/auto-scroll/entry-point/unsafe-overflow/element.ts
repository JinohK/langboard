import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { makeApi } from "@/core/helpers/dnd/auto-scroll/unsafe-overflow/make-api";

const api = makeApi({ monitor: monitorForElements });

export const unsafeOverflowAutoScrollForElements = api.unsafeOverflowAutoScroll;
