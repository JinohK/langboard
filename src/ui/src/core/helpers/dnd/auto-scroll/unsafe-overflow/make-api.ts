import type { AllDragTypes, BaseEventPayload, CleanupFn, MonitorArgs } from "@atlaskit/pragmatic-drag-and-drop/types";
import { getScheduler } from "@/core/helpers/dnd/auto-scroll/shared/scheduler";
import { tryOverflowScrollElements } from "@/core/helpers/dnd/auto-scroll/unsafe-overflow/try-overflow-scroll";
import { type UnsafeOverflowAutoScrollArgs } from "@/core/helpers/dnd/auto-scroll/unsafe-overflow/types";

export function makeApi<DragType extends AllDragTypes>({ monitor }: { monitor: (args: MonitorArgs<DragType>) => CleanupFn }) {
    const ledger: Map<Element, UnsafeOverflowAutoScrollArgs<DragType>> = new Map();

    function unsafeOverflowAutoScroll(args: UnsafeOverflowAutoScrollArgs<DragType>): CleanupFn {
        ledger.set(args.element, args);

        return () => ledger.delete(args.element);
    }

    function onFrame({
        latestArgs,
        underUsersPointer,
        timeSinceLastFrame,
    }: {
        latestArgs: BaseEventPayload<DragType>;
        timeSinceLastFrame: number;
        underUsersPointer: Element | null;
    }) {
        tryOverflowScrollElements({
            input: latestArgs.location.current.input,
            source: latestArgs.source,
            entries: Array.from(ledger).map(([_, args]) => args),
            underUsersPointer,
            timeSinceLastFrame,
        });
    }

    // scheduler is never cleaned up
    getScheduler(monitor).onFrame(onFrame);

    return {
        unsafeOverflowAutoScroll,
    };
}
