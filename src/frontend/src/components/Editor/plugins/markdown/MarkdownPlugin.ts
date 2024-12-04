import { type OmitFirst, type PluginConfig, bindFirst, createTSlatePlugin, isUrl } from "@udecode/plate-common";

import { deserializeMd } from "@/components/Editor/plugins/markdown/deserializer/utils";
import {
    RemarkDataTextRules,
    type RemarkElementRules,
    type RemarkTextRules,
    remarkDefaultElementRules,
    remarkDefaultTextRules,
} from "@/components/Editor/plugins/markdown/remark-slate";
import { serializeMd } from "@/components/Editor/plugins/markdown/serializer";
import { remarkDefaultDataTextRules } from "@/components/Editor/plugins/markdown/remark-slate/remarkDefaultDataTextRules";
import { serializeSelectionMd } from "@/components/Editor/plugins/markdown/serializer/serializeSelectionMd";

// export type MarkdownDeserializer = {
//   elementRules?: Partial<Record<MdastElementType, RemarkElementRule>>;
//   textRules?: Partial<Record<MdastTextType, RemarkTextRule>>;
// } & Deserializer;

export type MarkdownConfig = PluginConfig<
    "markdown",
    {
        /** Override element rules. */
        elementRules?: RemarkElementRules;
        indentList?: bool;
        /**
         * When the text contains \n, split the text into a separate paragraph.
         *
         * Line breaks between paragraphs will also be converted into separate
         * paragraphs.
         *
         * @default false
         */
        splitLineBreaks?: bool;

        /** Override text rules. */
        textRules?: RemarkTextRules;

        dataTextRules?: RemarkDataTextRules;
    },
    {
        markdown: {
            deserialize: OmitFirst<typeof deserializeMd>;
            serialize: OmitFirst<typeof serializeMd>;
        };
    }
>;

export const MarkdownPlugin = createTSlatePlugin<MarkdownConfig>({
    key: "markdown",
    options: {
        elementRules: remarkDefaultElementRules,
        indentList: false,
        splitLineBreaks: false,
        textRules: remarkDefaultTextRules,
        dataTextRules: remarkDefaultDataTextRules,
    },
})
    .extendApi(({ editor }) => ({
        deserialize: bindFirst(deserializeMd, editor),
        serialize: bindFirst(serializeMd, editor),
        serializeSelection: bindFirst(serializeSelectionMd, editor),
    }))
    .extend(({ api }) => ({
        parser: {
            deserialize: ({ data }) => api.markdown.deserialize(data),
            format: "text/plain",
            query: ({ data, dataTransfer }) => {
                const htmlData = dataTransfer.getData("text/html");

                if (htmlData) return false;

                const { files } = dataTransfer;

                if (
                    !files?.length && // if content is simply a URL pass through to not break LinkPlugin
                    isUrl(data)
                ) {
                    return false;
                }

                return true;
            },
        },
    }));
