import { useEffect, useState } from "react";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface IEditorStore {
    currentEditor: string | null;
    setCurrentEditor: (editor: string | null) => void;
    isInCurrentEditor: () => bool;
}

const useEditorStore = create(
    immer<IEditorStore>((set, get) => {
        return {
            currentEditor: null,
            setCurrentEditor: (editor) => {
                set({ currentEditor: editor });
            },
            isInCurrentEditor: () => get().currentEditor !== null,
        };
    })
);

export const getEditorStore = () => useEditorStore.getState();

export const useIsCurrentEditor = (editor: string): bool => {
    const [isCurrentEditor, setIsCurrentEditor] = useState(useEditorStore().currentEditor === editor);

    useEffect(() => {
        const off = useEditorStore.subscribe((state) => {
            setIsCurrentEditor(state.currentEditor === editor);
        });

        return off;
    }, [editor]);

    return isCurrentEditor;
};

export default useEditorStore;
