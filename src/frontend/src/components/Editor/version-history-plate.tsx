"use client";

import React from "react";
import { type Value } from "@udecode/plate";
import { type PlateProps, createPlateEditor, Plate, PlateContent, usePlateEditor } from "@udecode/plate/react";
import { computeDiff } from "@udecode/plate-diff";
import { getPlateComponents, IUseReadonlyEditor } from "@/components/Editor/useCreateEditor";
import { IEditorContent } from "@/core/models/Base";
import { diffPlugins } from "@/components/Editor/plugins/diff-plugins";
import { viewPlugins } from "@/components/Editor/plugins/editor-plugins";
import { deserializeMd } from "@/components/Editor/plugins/markdown";
import { cloneDeep } from "lodash";

function VersionHistory(props: Omit<PlateProps, "children">) {
    return (
        <Plate {...props}>
            <PlateContent />
        </Plate>
    );
}

interface DiffProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    components: () => any;
    current: Value;
    previous: Value;
}

const plugins = [...viewPlugins, ...diffPlugins];

function Diff({ components, current, previous }: DiffProps) {
    const diffValue = React.useMemo(() => {
        const revision = createPlateEditor({
            plugins,
        })!;

        return computeDiff(cloneDeep(previous), cloneDeep(current), {
            isInline: revision.api.isInline,
            lineBreakChar: "¶",
        }) as Value;
    }, [previous, current]);

    const editor = createPlateEditor({
        override: {
            components: {
                ...components(),
            },
        },
        plugins,
        value: diffValue,
    });

    return <VersionHistory readOnly editor={editor} />;
}

export interface IVersionHistoryPlateProps extends Omit<IUseReadonlyEditor, "readOnly" | "value"> {
    oldValue?: IEditorContent;
    newValue?: IEditorContent;
}

export default function VersionHistoryPlate({ oldValue, newValue, ...props }: IVersionHistoryPlateProps) {
    const components = () => getPlateComponents({ ...props, readOnly: true });
    const revision = usePlateEditor({
        override: {
            components: {
                ...components(),
            },
        },
        plugins,
    });

    return (
        <Diff
            components={components}
            current={[...deserializeMd(revision, newValue?.content ?? "")]}
            previous={[...deserializeMd(revision, oldValue?.content ?? "")]}
        />
    );
}
