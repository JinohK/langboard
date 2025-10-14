/* eslint-disable @typescript-eslint/no-explicit-any */
import { ProjectCard, ProjectWiki } from "@/core/models";
import { withTriggerCombobox, type TriggerComboboxPluginOptions } from "@platejs/combobox";
import { type TElement, type PluginConfig, createSlatePlugin, createTSlatePlugin } from "platejs";
import { toPlatePlugin } from "platejs/react";

export const INTERNAL_LINK_KEY = "internalLink";
export const INTERNAL_LINK_INPUT_KEY = "internalLink_input";

export type TInternalLinkableModel = ProjectCard.TModel | ProjectWiki.TModel;

export const INTERNAL_LINK_TYPES = ["card", "project_wiki"] as const;

export interface TInternalLinkElement extends TElement {
    internalType: (typeof INTERNAL_LINK_TYPES)[number];
    uid: string;
}

export type TInternalLinkConfig = PluginConfig<
    typeof INTERNAL_LINK_KEY,
    {
        insertSpaceAfterInternalLink?: bool;
    } & TriggerComboboxPluginOptions,
    {},
    {
        insert: {
            [INTERNAL_LINK_KEY]: (options: { search: string; value: Pick<TInternalLinkElement, "internalType" | "uid"> }) => void;
        };
    }
>;

export const BaseInternalLinkInputPlugin = createSlatePlugin({
    key: INTERNAL_LINK_INPUT_KEY,
    node: { isElement: true, isInline: true, isVoid: true },
});

export const BaseInternalLinkPlugin = createTSlatePlugin<TInternalLinkConfig>({
    key: INTERNAL_LINK_KEY,
    node: { isElement: true, isInline: true, isMarkableVoid: true, isVoid: true },
    options: {
        trigger: "{{",
        triggerPreviousCharPattern: /^\s?$/,
        createComboboxInput: () => ({
            children: [{ text: "" }],
            trigger: "[[",
            type: INTERNAL_LINK_INPUT_KEY,
        }),
    },
    plugins: [BaseInternalLinkInputPlugin],
})
    .extendEditorTransforms<TInternalLinkConfig["transforms"]>(({ editor, type }) => ({
        insert: {
            [INTERNAL_LINK_KEY]: ({ value }) => {
                editor.tf.insertNodes<TInternalLinkElement>({
                    children: [{ text: "" }],
                    type,
                    internalType: value.internalType,
                    uid: value.uid,
                });
            },
        },
    }))
    .overrideEditor(withTriggerCombobox as any);

export const InternalLinkPlugin = toPlatePlugin(BaseInternalLinkPlugin);

export const InternalLinkInputPlugin = toPlatePlugin(BaseInternalLinkInputPlugin);
