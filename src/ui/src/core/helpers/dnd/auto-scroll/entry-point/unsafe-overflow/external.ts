import { monitorForExternal } from "@atlaskit/pragmatic-drag-and-drop/external/adapter";
import { makeApi } from "@/core/helpers/dnd/auto-scroll/unsafe-overflow/make-api";

const api = makeApi({ monitor: monitorForExternal });

export const unsafeOverflowAutoScrollForExternal = api.unsafeOverflowAutoScroll;
