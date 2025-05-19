/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSocket } from "@/core/providers/SocketProvider";
import { useEditorData } from "@/core/providers/EditorDataProvider";
import { IEditorContent } from "@/core/models/Base";
import { useCallback, useEffect, useMemo } from "react";
import { withProps } from "@udecode/cn";
import { AIChatPlugin, AIPlugin } from "@udecode/plate-ai/react";
import {
    BoldPlugin,
    CodePlugin,
    ItalicPlugin,
    StrikethroughPlugin,
    SubscriptPlugin,
    SuperscriptPlugin,
    UnderlinePlugin,
} from "@udecode/plate-basic-marks/react";
import { createCopilotPlugins } from "@/components/Editor/plugins/copilot-plugins";
import { createAIPlugins } from "@/components/Editor/plugins/ai-plugins";
import { BlockquotePlugin } from "@udecode/plate-block-quote/react";
import { CalloutPlugin } from "@udecode/plate-callout/react";
import { CodeBlockPlugin, CodeLinePlugin, CodeSyntaxPlugin } from "@udecode/plate-code-block/react";
import { ParagraphPlugin, PlateEditor, PlateLeaf, PlatePlugin, usePlateEditor } from "@udecode/plate/react";
import { DatePlugin } from "@udecode/plate-date/react";
import { EmojiInputPlugin } from "@udecode/plate-emoji/react";
import { EquationPlugin, InlineEquationPlugin } from "@udecode/plate-math/react";
import { HEADING_KEYS } from "@udecode/plate-heading";
import { TocPlugin } from "@udecode/plate-heading/react";
import { HighlightPlugin } from "@udecode/plate-highlight/react";
import { HorizontalRulePlugin } from "@udecode/plate-horizontal-rule/react";
import { KbdPlugin } from "@udecode/plate-kbd/react";
import { LinkPlugin } from "@udecode/plate-link/react";
import { AudioPlugin, FilePlugin, ImagePlugin, MediaEmbedPlugin, PlaceholderPlugin, VideoPlugin } from "@udecode/plate-media/react";
import { MentionInputPlugin, MentionPlugin } from "@udecode/plate-mention/react";
import { SlashInputPlugin } from "@udecode/plate-slash-command/react";
import { TableCellHeaderPlugin, TableCellPlugin, TablePlugin, TableRowPlugin } from "@udecode/plate-table/react";
import { PlantUmlPlugin } from "@/components/Editor/plugins/plantuml-plugin";
import { editorPlugins, viewPlugins } from "@/components/Editor/plugins/editor-plugins";
import { AIAnchorElement } from "@/components/plate-ui/ai-anchor-element";
import { AILeaf } from "@/components/plate-ui/ai-leaf";
import { BlockquoteElement } from "@/components/plate-ui/blockquote-element";
import { CalloutElement } from "@/components/plate-ui/callout-element";
import { CodeBlockElement } from "@/components/plate-ui/code-block-element";
import { CodeLeaf } from "@/components/plate-ui/code-leaf";
import { CodeLineElement } from "@/components/plate-ui/code-line-element";
import { CodeSyntaxLeaf } from "@/components/plate-ui/code-syntax-leaf";
import { DateElement } from "@/components/plate-ui/date-element";
import { EmojiInputElement } from "@/components/plate-ui/emoji-input-element";
import { HeadingElement } from "@/components/plate-ui/heading-element";
import { HighlightLeaf } from "@/components/plate-ui/highlight-leaf";
import { HrElement } from "@/components/plate-ui/hr-element";
import { ImageElement } from "@/components/plate-ui/image-element";
import { KbdLeaf } from "@/components/plate-ui/kbd-leaf";
import { LinkElement } from "@/components/plate-ui/link-element";
import { MediaEmbedElement } from "@/components/plate-ui/media-embed-element";
import { MentionElement } from "@/components/plate-ui/mention-element";
import { MentionInputElement } from "@/components/plate-ui/mention-input-element";
import { ParagraphElement } from "@/components/plate-ui/paragraph-element";
import { withPlaceholders } from "@/components/plate-ui/placeholder";
import { SlashInputElement } from "@/components/plate-ui/slash-input-element";
import { TableCellElement, TableCellHeaderElement } from "@/components/plate-ui/table-cell-element";
import { TableElement } from "@/components/plate-ui/table-element";
import { TableRowElement } from "@/components/plate-ui/table-row-element";
import { TocElement } from "@/components/plate-ui/toc-element";
import { MarkdownPlugin } from "@udecode/plate-markdown";
import { MediaPlaceholderElement } from "@/components/plate-ui/media-placeholder-element";
import { MediaVideoElement } from "@/components/plate-ui/media-video-element";
import { MediaAudioElement } from "@/components/plate-ui/media-audio-element";
import { MediaFileElement } from "@/components/plate-ui/media-file-element";
import { EquationElement } from "@/components/plate-ui/equation-element";
import { InlineEquationElement } from "@/components/plate-ui/inline-equation-element";
import { PlantUmlElement } from "@/components/plate-ui/plantuml-element";

interface IBaseUseCreateEditor {
    plugins?: PlatePlugin<any>[];
    value?: IEditorContent;
    readOnly?: bool;
}

export interface IUseReadonlyEditor extends IBaseUseCreateEditor {
    readOnly: true;
    value: IEditorContent;
}

export interface IUseEditor extends IBaseUseCreateEditor {
    readOnly?: false;
    value?: IEditorContent;
}

export type TUseCreateEditor = IUseReadonlyEditor | IUseEditor;

export const getPlateComponents = ({ readOnly = false }: { readOnly: bool }): Record<string, any> => {
    const viewComponents = {
        [AIChatPlugin.key]: AIAnchorElement,
        [AudioPlugin.key]: MediaAudioElement,
        [BlockquotePlugin.key]: BlockquoteElement,
        [BoldPlugin.key]: withProps(PlateLeaf, { as: "strong" }),
        [CalloutPlugin.key]: CalloutElement,
        [CodeBlockPlugin.key]: CodeBlockElement,
        [CodeLinePlugin.key]: CodeLineElement,
        [CodePlugin.key]: CodeLeaf,
        [CodeSyntaxPlugin.key]: CodeSyntaxLeaf,
        [DatePlugin.key]: DateElement,
        [EquationPlugin.key]: EquationElement,
        [FilePlugin.key]: MediaFileElement,
        [HEADING_KEYS.h1]: withProps(HeadingElement, { variant: "h1" }),
        [HEADING_KEYS.h2]: withProps(HeadingElement, { variant: "h2" }),
        [HEADING_KEYS.h3]: withProps(HeadingElement, { variant: "h3" }),
        [HEADING_KEYS.h4]: withProps(HeadingElement, { variant: "h4" }),
        [HEADING_KEYS.h5]: withProps(HeadingElement, { variant: "h5" }),
        [HEADING_KEYS.h6]: withProps(HeadingElement, { variant: "h6" }),
        [HighlightPlugin.key]: HighlightLeaf,
        [HorizontalRulePlugin.key]: HrElement,
        [ImagePlugin.key]: ImageElement,
        [InlineEquationPlugin.key]: InlineEquationElement,
        [ItalicPlugin.key]: withProps(PlateLeaf, { as: "em" }),
        [KbdPlugin.key]: KbdLeaf,
        [LinkPlugin.key]: LinkElement,
        [MediaEmbedPlugin.key]: MediaEmbedElement,
        [MentionPlugin.key]: withProps(MentionElement, { prefix: "@" }),
        [ParagraphPlugin.key]: ParagraphElement,
        [PlaceholderPlugin.key]: MediaPlaceholderElement,
        [PlantUmlPlugin.key]: PlantUmlElement,
        [StrikethroughPlugin.key]: withProps(PlateLeaf, { as: "s" }),
        [SubscriptPlugin.key]: withProps(PlateLeaf, { as: "sub" }),
        [SuperscriptPlugin.key]: withProps(PlateLeaf, { as: "sup" }),
        [TableCellHeaderPlugin.key]: TableCellHeaderElement,
        [TableCellPlugin.key]: TableCellElement,
        [TablePlugin.key]: TableElement,
        [TableRowPlugin.key]: TableRowElement,
        [TocPlugin.key]: TocElement,
        [UnderlinePlugin.key]: withProps(PlateLeaf, { as: "u" }),
        [VideoPlugin.key]: MediaVideoElement,
    };

    if (readOnly) {
        return viewComponents;
    }

    const editorComponents = {
        ...viewComponents,
        [AIPlugin.key]: AILeaf,
        [EmojiInputPlugin.key]: EmojiInputElement,
        [MentionInputPlugin.key]: MentionInputElement,
        [SlashInputPlugin.key]: SlashInputElement,
    };

    return editorComponents;
};

export const useCreateEditor = (props: TUseCreateEditor) => {
    const socket = useSocket();
    const { value, readOnly = false, plugins: customPlugins } = props;
    const editorData = useEditorData();
    const { socketEvents, chatEventKey, copilotEventKey, commonSocketEventData } = editorData;

    const components = useMemo(
        () =>
            getPlateComponents({
                readOnly,
            }),
        [props, editorData, readOnly]
    );
    const plugins = useMemo(() => {
        const pluginList = [...(readOnly ? viewPlugins : editorPlugins), ...(customPlugins ?? [])];
        if (!readOnly && socketEvents) {
            const { chatEvents, copilotEvents } = socketEvents;
            pluginList.push(
                ...createAIPlugins({ socket, eventKey: chatEventKey!, events: chatEvents, commonEventData: commonSocketEventData }),
                ...createCopilotPlugins({
                    socket,
                    eventKey: copilotEventKey!,
                    events: copilotEvents,
                    commonEventData: commonSocketEventData,
                })
            );
        }
        return pluginList;
    }, [readOnly]);
    const convertValue = useCallback(
        (editor: PlateEditor) => {
            if (value) {
                return editor.getApi(MarkdownPlugin).markdown.deserialize(value.content);
            } else {
                return "";
            }
        },
        [value]
    );
    const editor = usePlateEditor(
        {
            override: {
                components: {
                    ...(readOnly ? components : withPlaceholders(components)),
                },
            },
            plugins,
            value: convertValue,
            autoSelect: "end",
        },
        [readOnly, components, plugins, convertValue]
    );

    useEffect(() => {
        if (!readOnly) {
            return;
        }

        editor.tf.setValue(convertValue(editor));
    }, [value]);

    return editor;
};
