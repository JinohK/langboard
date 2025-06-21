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
import { Box, Collapsible } from "@/components/base";
import { cn } from "@/core/utils/ComponentUtils";
import { useTranslation } from "react-i18next";

function VersionHistory(props: Omit<PlateProps, "children">) {
    return (
        <Plate {...props}>
            <PlateContent className="[&_table]:w-full [&_table]:max-w-full [&_table_td]:w-auto" />
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

interface IBaseVersionHistoryPlateProps extends Pick<TEditorDataProviderProps, "form" | "mentionables" | "currentUser"> {
    oldValue?: IEditorContent;
    newValue?: IEditorContent;
}

export interface IDefaultVersionHistoryPlateProps extends IBaseVersionHistoryPlateProps {}

export function VersionHistoryPlate({ oldValue, newValue, ...props }: IDefaultVersionHistoryPlateProps) {
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

export interface ICollapsibleVersionHistoryPlateProps extends IBaseVersionHistoryPlateProps {
    maxShowLines?: number;
}

const rendered = 0;
export const CollapsibleVersionHistoryPlate = ({ oldValue, newValue, maxShowLines = 5, ...props }: ICollapsibleVersionHistoryPlateProps) => {
    const [t] = useTranslation();
    const revisionRef = React.useRef(
        usePlateEditor({
            override: {
                components: getPlateComponents({ readOnly: true }),
            },
            plugins,
        })
    );
    const deserialize = (content: string = "") => revisionRef.current.getApi(MarkdownPlugin).markdown.deserialize(content);
    const slice = (start: number, end: number, content: string = "") => content.split("\n").slice(start, end).join("\n");
    const previewCurrentValueRef = React.useRef(deserialize(slice(0, maxShowLines, newValue?.content)));
    const previewPreviousValueRef = React.useRef(deserialize(slice(0, maxShowLines, oldValue?.content)));
    const currentValurRef = React.useRef(deserialize(slice(maxShowLines, newValue?.content.split("\n").length ?? 0, newValue?.content)));
    const previousValueRef = React.useRef(deserialize(slice(maxShowLines, oldValue?.content.split("\n").length ?? 0, oldValue?.content)));
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [loadedDiff, setLoadedDiff] = React.useState<React.ReactNode>();
    const isFirstExpandedRef = React.useRef(true);
    const changeExpanded = React.useCallback(
        (state: bool) => {
            setIsExpanded(state);
            if (isFirstExpandedRef.current && state) {
                isFirstExpandedRef.current = false;
                setLoadedDiff(
                    <EditorDataProvider editorType="view" {...props}>
                        <Diff current={currentValurRef.current} previous={previousValueRef.current} />
                    </EditorDataProvider>
                );
            }
        },
        [setIsExpanded]
    );

    if (rendered > 200) {
        throw new Error("Too many renders in CollapsibleVersionHistoryPlate");
    }

    return (
        <Collapsible.Root
            open={isExpanded}
            onOpenChange={changeExpanded}
            className="w-full [&_.slate-editor>:first-child]:pt-0 [&_.slate-editor>:last-child]:pb-0"
        >
            <EditorDataProvider editorType="view" {...props}>
                <Diff current={previewCurrentValueRef.current} previous={previewPreviousValueRef.current} />
            </EditorDataProvider>
            <Box className={cn(isExpanded ? "block" : "hidden")}>{loadedDiff}</Box>
            <Collapsible.Trigger className="w-full text-left text-sm font-semibold text-muted-foreground hover:text-foreground">
                {t(`editor.${isExpanded ? "Show less" : "Show more"}`)}
            </Collapsible.Trigger>
        </Collapsible.Root>
    );
};
