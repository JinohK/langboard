/* eslint-disable @typescript-eslint/no-explicit-any */
import { AuthUser, User } from "@/core/models";
import { IEditorContent } from "@/core/models/Base";
import { useCallback, useEffect, useState } from "react";
import { withProps } from "@udecode/cn";
import { AIPlugin } from "@udecode/plate-ai/react";
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
import { CodeBlockPlugin, CodeLinePlugin, CodeSyntaxPlugin } from "@udecode/plate-code-block/react";
import { ParagraphPlugin, PlateLeaf, PlatePlugin, usePlateEditor } from "@udecode/plate/react";
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
import { AILeaf } from "@/components/plate-ui/ai-leaf";
import { BlockquoteElement } from "@/components/plate-ui/blockquote-element";
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
import { IMentionableUser, MentionInputElement } from "@/components/plate-ui/mention-input-element";
import { ParagraphElement } from "@/components/plate-ui/paragraph-element";
import { withPlaceholders } from "@/components/plate-ui/placeholder";
import { SlashInputElement } from "@/components/plate-ui/slash-input-element";
import { TableCellElement, TableCellHeaderElement } from "@/components/plate-ui/table-cell-element";
import { TableElement } from "@/components/plate-ui/table-element";
import { TableRowElement } from "@/components/plate-ui/table-row-element";
import { TocElement } from "@/components/plate-ui/toc-element";
import { deserializeMd } from "@/components/Editor/plugins/markdown";
import { MediaPlaceholderElement } from "@/components/plate-ui/media-placeholder-element";
import { MediaVideoElement } from "@/components/plate-ui/media-video-element";
import { MediaAudioElement } from "@/components/plate-ui/media-audio-element";
import { MediaFileElement } from "@/components/plate-ui/media-file-element";
import { EquationElement } from "@/components/plate-ui/equation-element";
import { InlineEquationElement } from "@/components/plate-ui/inline-equation-element";
import { PlantUmlElement } from "@/components/plate-ui/plantuml-element";
import { ISocketContext } from "@/core/providers/SocketProvider";

interface IBaseUseCreateEditor {
    currentUser: AuthUser.TModel;
    mentionables: User.TModel[];
    plugins?: PlatePlugin<any>[];
    value?: IEditorContent;
    readOnly?: bool;
    socket?: ISocketContext;
    baseSocketEvent?: string;
    chatEventKey?: string;
    copilotEventKey?: string;
    commonSocketEventData?: Record<string, any>;
    uploadPath?: string;
    uploadedCallback?: (respones: any) => void;
}

export interface IUseReadonlyEditor extends IBaseUseCreateEditor {
    readOnly: true;
    value: IEditorContent;
    socket?: never;
    baseSocketEvent?: never;
    chatEventKey?: never;
    copilotEventKey?: never;
    commonSocketEventData?: never;
    uploadPath?: never;
    uploadedCallback?: never;
}

export interface IUseEditor extends IBaseUseCreateEditor {
    readOnly?: false;
    value?: IEditorContent;
    socket: ISocketContext;
    baseSocketEvent: string;
    chatEventKey: string;
    copilotEventKey: string;
    commonSocketEventData?: Record<string, any>;
    uploadPath: string;
}

export type TUseCreateEditor = IUseReadonlyEditor | IUseEditor;

const createEditorSocketEvents = (baseEvent: string) => ({
    chatEvents: {
        send: `${baseEvent}:editor:chat:send`,
        stream: `${baseEvent}:editor:chat:stream`,
    },
    copilotEvents: {
        abort: `${baseEvent}:editor:copilot:abort`,
        send: `${baseEvent}:editor:copilot:send`,
        receive: `${baseEvent}:editor:copilot:receive`,
    },
});

export const getPlateComponents = ({
    currentUser,
    mentionables,
    uploadPath,
    uploadedCallback,
    readOnly = false,
}: Pick<TUseCreateEditor, "currentUser" | "mentionables" | "uploadPath" | "uploadedCallback" | "readOnly">) => {
    const viewComponents = {
        [AudioPlugin.key]: MediaAudioElement,
        [BlockquotePlugin.key]: BlockquoteElement,
        [BoldPlugin.key]: withProps(PlateLeaf, { as: "strong" }),
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
        [MentionPlugin.key]: withProps(MentionElement, {
            currentUser,
            mentionables,
            prefix: "@",
            renderLabel: (mentionable) => {
                const user = mentionables.find((val) => val.uid === (mentionable as unknown as IMentionableUser).key);
                if (user) {
                    return `${user.firstname} ${user.lastname}`;
                } else {
                    return mentionable.value;
                }
            },
        }),
        [ParagraphPlugin.key]: ParagraphElement,
        [PlaceholderPlugin.key]: withProps(MediaPlaceholderElement, { uploadPath, uploadedCallback }),
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
        [MentionInputPlugin.key]: withProps(MentionInputElement, { currentUser, mentionables }),
        [SlashInputPlugin.key]: SlashInputElement,
    };

    return editorComponents;
};

export const useCreateEditor = (props: TUseCreateEditor) => {
    const { value, readOnly = false, socket, baseSocketEvent, chatEventKey, copilotEventKey, commonSocketEventData, plugins: customPlugins } = props;

    const reloadPlugins = useCallback(() => {
        const pluginList = [...(readOnly ? viewPlugins : editorPlugins), ...(customPlugins ?? [])];
        if (!readOnly) {
            const { chatEvents, copilotEvents } = createEditorSocketEvents(baseSocketEvent!);
            pluginList.push(
                ...createAIPlugins({ socket: socket!, eventKey: chatEventKey!, events: chatEvents, commonEventData: commonSocketEventData }),
                ...createCopilotPlugins({
                    socket: socket!,
                    eventKey: copilotEventKey!,
                    events: copilotEvents,
                    commonEventData: commonSocketEventData,
                })
            );
        }
        return pluginList;
    }, [readOnly]);
    const [components, setComponents] = useState(getPlateComponents(props));
    const [plugins, setPlugins] = useState(reloadPlugins());
    const editor = usePlateEditor(
        {
            override: {
                components: {
                    ...(readOnly ? components : withPlaceholders(components)),
                },
            },
            plugins,
            value: (editor) => {
                if (value) {
                    return deserializeMd(editor, value.content);
                } else {
                    return "";
                }
            },
            autoSelect: "end",
        },
        [components, plugins]
    );

    useEffect(() => {
        const newComponents = getPlateComponents(props);
        if (Object.keys(components).length !== Object.keys(newComponents).length) {
            setComponents(newComponents);
        }

        const pluginList = reloadPlugins();
        if (plugins.length !== pluginList.length) {
            setPlugins(pluginList);
        }

        editor.api.redecorate();
    }, [readOnly]);

    useEffect(() => {
        if (!readOnly || !value) {
            return;
        }

        editor.tf.setValue(deserializeMd(editor, value.content));
    }, [value]);

    return editor;
};
