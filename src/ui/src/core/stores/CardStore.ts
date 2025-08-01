import { useEffect, useState } from "react";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface ICardStore {
    collapsedMap: Record<string, bool>;
    updateCollapsed: (cardUID: string, collapsed: bool) => void;
}

const CARD_STORE_STORAGE_KEY = "card-store";

const useCardStore = create(
    immer<ICardStore>((set, get) => {
        return {
            collapsedMap: JSON.parse(localStorage.getItem(CARD_STORE_STORAGE_KEY) || "{}"),
            updateCollapsed: (cardUID: string, collapsed: bool) => {
                const currentMap = get().collapsedMap;
                currentMap[cardUID] = collapsed;
                set({ collapsedMap: currentMap });
                setTimeout(() => {
                    localStorage.setItem(CARD_STORE_STORAGE_KEY, JSON.stringify(currentMap));
                }, 0);
            },
        };
    })
);

export const getCardStore = () => useCardStore.getState();

export const useCardIsCollapsed = (cardUID: string): bool => {
    const [isCollapsed, setIsCollapsed] = useState(!!getCardStore().collapsedMap[cardUID]);

    useEffect(() => {
        const off = useCardStore.subscribe((state) => {
            const collapsed = !!state.collapsedMap[cardUID];
            if (collapsed !== isCollapsed) {
                setIsCollapsed(collapsed);
            }
        });

        return off;
    }, [isCollapsed, setIsCollapsed, cardUID]);

    return isCollapsed;
};

export default useCardStore;
