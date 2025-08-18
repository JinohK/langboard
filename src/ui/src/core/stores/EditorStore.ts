import { useEffect, useState } from "react";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface IEditorStore {
    currentEditor: string | null;
    setCurrentEditor: (editor: string | null) => void;
}

const useEditorStore = create(
    immer<IEditorStore>((set) => {
        return {
            currentEditor: null,
            setCurrentEditor: (editor) => {
                set({ currentEditor: editor });
            },
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
