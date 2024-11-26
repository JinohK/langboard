"use client";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Plate } from "@udecode/plate-common/react";
import { TUseCreateEditor, useCreateEditor } from "@/components/Editor/useCreateEditor";
import { Editor, EditorContainer } from "@/components/plate-ui/editor";
import { IEditorContent } from "@/core/models/Base";
import { useRef } from "react";

export type TEditor = ReturnType<typeof useCreateEditor>;

interface IBasePlateEditorProps extends Omit<TUseCreateEditor, "plugins"> {
    setValue?: (value: IEditorContent) => void;
    variant?: React.ComponentProps<typeof Editor>["variant"];
    className?: string;
    editorRef?: React.MutableRefObject<TEditor | undefined>;
    editorElementRef?: React.MutableRefObject<HTMLDivElement | null>;
}

interface IPlateViewerProps extends IBasePlateEditorProps {
    setValue?: never;
    readOnly: true;
}

interface IPlateEditorProps extends IBasePlateEditorProps {
    setValue: (value: IEditorContent) => void;
    readOnly?: bool;
}

export type TPlateEditorProps = IPlateViewerProps | IPlateEditorProps;

export function PlateEditor({
    value,
    readOnly,
    currentUser,
    mentionableUsers,
    variant = "ai",
    className,
    setValue,
    editorRef,
    editorElementRef,
    ...props
}: TPlateEditorProps) {
    if (!editorRef) {
        editorRef = useRef<TEditor>();
    }

    const editor = useCreateEditor({
        currentUser,
        mentionableUsers,
        plugins: [],
        value,
        readOnly,
        ...props,
    } as TUseCreateEditor);

    editorRef.current = editor;

    return (
        <DndProvider backend={HTML5Backend}>
            <Plate
                editor={editor}
                readOnly={readOnly}
                onValueChange={(opts) => {
                    if (readOnly) {
                        return;
                    }

                    setValue?.({
                        content: opts.editor.api.markdown.serialize(),
                    });
                }}
            >
                <EditorContainer readOnly={readOnly}>
                    <Editor variant={variant} className={className} ref={editorElementRef} />
                </EditorContainer>
            </Plate>
        </DndProvider>
    );
}
