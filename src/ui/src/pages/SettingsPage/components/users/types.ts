import { useVirtualizer } from "@tanstack/react-virtual";

export interface ISettingsUserContext {
    virtualizerRef: React.RefObject<ReturnType<typeof useVirtualizer> | undefined>;
}
