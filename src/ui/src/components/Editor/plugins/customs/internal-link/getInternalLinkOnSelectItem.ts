/* eslint-disable @typescript-eslint/no-explicit-any */
import { getEditorPlugin, type SlateEditor } from "platejs";
import { INTERNAL_LINK_KEY, TInternalLinkConfig, TInternalLinkElement } from "@/components/Editor/plugins/customs/internal-link/InternalLinkPlugin";

export type TInternalLinkOnSelectItem<TItem extends TInternalLinkElement = TInternalLinkElement> = (
    editor: SlateEditor,
    item: TItem,
    search?: string
) => void;

export const getInternalLinkOnSelectItem =
    <TItem extends TInternalLinkElement = TInternalLinkElement>({
        key = INTERNAL_LINK_KEY,
    }: { key?: string } = {}): TInternalLinkOnSelectItem<TItem> =>
    (editor, item, search = "") => {
        const { getOptions, tf } = getEditorPlugin<TInternalLinkConfig>(editor, {
            key: key as any,
        });
        const { insertSpaceAfterInternalLink } = getOptions();

        tf.insert.internalLink({ search, value: { ...item } });

        // move the selection after the element
        editor.tf.move({ unit: "offset" });

        const pathAbove = editor.api.block()?.[1];

        const isBlockEnd = editor.selection && pathAbove && editor.api.isEnd(editor.selection.anchor, pathAbove);

        if (isBlockEnd && insertSpaceAfterInternalLink) {
            editor.tf.insertText(" ");
        }
    };
