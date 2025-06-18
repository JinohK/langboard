import { Box, Button, Flex, IconComponent, Skeleton } from "@/components/base";
import CachedImage from "@/components/CachedImage";
import { singleDndHelpers } from "@/core/helpers/dnd";
import { SINGLE_ROW_IDLE } from "@/core/helpers/dnd/createDndSingleRowEvents";
import { TSingleRowState } from "@/core/helpers/dnd/types";
import { Project, ProjectCardAttachment } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { formatDateDistance } from "@/core/utils/StringUtils";
import TypeUtils from "@/core/utils/TypeUtils";
import BoardCardAttachmentMoreMenu from "@/pages/BoardPage/components/card/attachment/BoardCardAttachmentMoreMenu";
import { BOARD_CARD_ATTACHMENT_DND_SYMBOL_SET } from "@/pages/BoardPage/components/card/attachment/BoardCardAttachmentConstants";
import { DropIndicator } from "@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box";
import { memo, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import mimeTypes from "react-native-mime-types";
import invariant from "tiny-invariant";
import { ModelRegistry } from "@/core/models/ModelRegistry";

export interface IBoardCardAttachmentProps {
    attachment: ProjectCardAttachment.TModel;
    openPreview: () => void;
}

export function SkeletonBoardCardAttachment() {
    return (
        <Flex items="center" justify="between">
            <Flex items="center" gap={{ initial: "1.5", sm: "2.5" }}>
                <Skeleton h={{ initial: "8", sm: "12" }} w={{ initial: "12", sm: "16" }} rounded="sm" className="bg-muted" />
                <Box ml={{ initial: "1", sm: "0" }}>
                    <Box textSize="sm">
                        <Skeleton h="5" w="28" />
                    </Box>
                    <Box textSize="xs" className="text-muted-foreground">
                        <Skeleton h="5" w="20" />
                    </Box>
                </Box>
            </Flex>
        </Flex>
    );
}

function BoardCardAttachment({ attachment, openPreview }: IBoardCardAttachmentProps): JSX.Element {
    const { hasRoleAction } = useBoardCard();
    const [state, setState] = useState<TSingleRowState>(SINGLE_ROW_IDLE);
    const order = attachment.useField("order");
    const canReorder = hasRoleAction(Project.ERoleAction.CardUpdate);
    const outerRef = useRef<HTMLDivElement | null>(null);
    const draggableRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (!canReorder) {
            return;
        }

        const outer = outerRef.current;
        const draggable = draggableRef.current;
        invariant(outer && draggable);

        return singleDndHelpers.row({
            row: attachment,
            symbolSet: BOARD_CARD_ATTACHMENT_DND_SYMBOL_SET,
            draggable: draggable,
            dropTarget: outer,
            setState,
            renderPreview({ container }) {
                // Simple drag preview generation: just cloning the current element.
                // Not using react for this.
                const rect = outer.getBoundingClientRect();
                const preview = outer.cloneNode(true);
                invariant(TypeUtils.isElement(preview, "div"));
                preview.style.width = `${rect.width}px`;
                preview.style.height = `${rect.height}px`;

                container.appendChild(preview);
            },
        });
    }, [attachment, order]);

    return (
        <Box position="relative" py="1" ref={outerRef}>
            {state.type === "is-over" && <DropIndicator edge={state.closestEdge} />}
            <BoardCardAttachmentDisplay attachment={attachment} canReorder={canReorder} openPreview={openPreview} draggableRef={draggableRef} />
        </Box>
    );
}

interface IBoardCardAttachmentDisplayProps {
    attachment: ProjectCardAttachment.TModel;
    canReorder: bool;
    draggableRef: React.RefObject<HTMLButtonElement | null>;
    openPreview: () => void;
}

const BoardCardAttachmentDisplay = memo(({ attachment, canReorder, draggableRef, openPreview }: IBoardCardAttachmentDisplayProps) => {
    const [t, i18n] = useTranslation();
    const { currentUser } = useBoardCard();
    const [isValidating, setIsValidating] = useState(false);
    const name = attachment.useField("name");
    const url = attachment.useField("url");
    const mimeType = mimeTypes.lookup(url) || "file";
    const canEdit = currentUser.uid === attachment.user.uid || canReorder;

    return (
        <ModelRegistry.ProjectCardAttachment.Provider model={attachment} params={{ isValidating, setIsValidating }}>
            <Flex items="center" justify="between">
                <Flex items="center" gap={{ initial: "1.5", sm: "2.5" }}>
                    {canReorder && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="h-8 w-5 sm:size-8"
                            title={t("common.Drag to reorder")}
                            disabled={isValidating}
                            ref={draggableRef}
                        >
                            <IconComponent icon="grip-vertical" size="4" />
                        </Button>
                    )}
                    <Flex
                        items="center"
                        justify="center"
                        cursor="default"
                        inline
                        w={{ initial: "12", sm: "16" }}
                        h={{ initial: "8", sm: "12" }}
                        rounded="sm"
                        className="bg-muted"
                        onClick={openPreview}
                    >
                        {mimeType.startsWith("image/") ? (
                            <CachedImage src={url} alt={mimeType} h="full" className="min-w-full" />
                        ) : (
                            (name.split(".").at(-1)?.toUpperCase() ?? "FILE")
                        )}
                    </Flex>
                    <Box ml={{ initial: "1", sm: "0" }}>
                        <Box textSize="sm">{name}</Box>
                        <Box textSize="xs" className="text-muted-foreground">
                            {t("card.Added {date}", { date: formatDateDistance(i18n, t, attachment.created_at) })}
                        </Box>
                    </Box>
                </Flex>
                {canEdit && <BoardCardAttachmentMoreMenu attachment={attachment} isValidating={isValidating} setIsValidating={setIsValidating} />}
            </Flex>
        </ModelRegistry.ProjectCardAttachment.Provider>
    );
});

export default BoardCardAttachment;
