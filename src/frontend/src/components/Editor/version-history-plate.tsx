"use client";

import React from "react";
import { type Value } from "@udecode/plate";
import { type PlateProps, createPlateEditor, Plate, PlateContent, usePlateEditor } from "@udecode/plate/react";
import { computeDiff } from "@udecode/plate-diff";
import { getPlateComponents } from "@/components/Editor/useCreateEditor";
import { IEditorContent } from "@/core/models/Base";
import { diffPlugins } from "@/components/Editor/plugins/diff-plugins";
import { viewPlugins } from "@/components/Editor/plugins/editor-plugins";
import { MarkdownPlugin } from "@udecode/plate-markdown";
import { cloneDeep } from "lodash";
import { EditorDataProvider, TEditorDataProviderProps } from "@/core/providers/EditorDataProvider";

function VersionHistory(props: Omit<PlateProps, "children">) {
    return (
        <Plate {...props}>
            <PlateContent />
        </Plate>
    );
}

interface DiffProps {
    current: Value;
    previous: Value;
}

const plugins = [...viewPlugins, ...diffPlugins];

function Diff({ current, previous }: DiffProps) {
    const diffValue = React.useMemo(() => {
        const revision = createPlateEditor({
            plugins,
        })!;

        return computeDiff(cloneDeep(previous), cloneDeep(current), {
            isInline: revision.api.isInline,
            lineBreakChar: "¶",
        }) as Value;
    }, [previous, current]);

    const editor = usePlateEditor(
        {
            override: {
                components: getPlateComponents({ readOnly: true }),
            },
            plugins,
            value: cloneDeep(diffValue),
        },
        [diffValue]
    );

    return <VersionHistory readOnly editor={editor} />;
}

export interface IVersionHistoryPlateProps extends Pick<TEditorDataProviderProps, "form" | "mentionables" | "currentUser"> {
    oldValue?: IEditorContent;
    newValue?: IEditorContent;
}

export default function VersionHistoryPlate({ oldValue, newValue, ...props }: IVersionHistoryPlateProps) {
    const revision = usePlateEditor({
        override: {
            components: getPlateComponents({ readOnly: true }),
        },
        plugins,
    });

    return (
        <EditorDataProvider editorType="view" {...props}>
            <Diff
                current={revision.getApi(MarkdownPlugin).markdown.deserialize(newValue?.content ?? "")}
                previous={revision.getApi(MarkdownPlugin).markdown.deserialize(oldValue?.content ?? "")}
            />
        </EditorDataProvider>
    );
}
