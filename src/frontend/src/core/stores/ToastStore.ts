import { createUUID } from "@/core/utils/StringUtils";
import { create } from "zustand";

export interface IToastAction {
    act: () => void;
    alt?: string;
    asIcon: boolean;
    name: string;
}

export interface IToast {
    id: string;
    type: "success" | "error" | "warning" | "info";
    message: string;
    duration?: number;
    details?: string;
    icon?: string;
    actions?: IToastAction[];
}

export type TNewToast = Omit<IToast, "id">;

export interface IToastStore {
    list: Record<string, IToast>;
    addToast: (alert: IToast) => string;
    removeToast: (id: string) => void;
}

const useToastStore = create<IToastStore>((set) => ({
    list: {},
    addToast: (alert: TNewToast) => {
        const createdAlert: IToast = {
            id: createUUID(),
            ...alert,
        };

        set((state) => ({ list: { ...state.list, [createdAlert.id]: createdAlert } }));
        return createdAlert.id;
    },
    removeToast: (id: string) =>
        set((state) => {
            delete state.list[id];
            return { list: state.list };
        }),
}));

export default useToastStore;
