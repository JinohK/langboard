import { ProjectLabel } from "@/core/models";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { tv } from "tailwind-variants";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { Box, Button, Flex, IconComponent, Tooltip } from "@/components/base";
import useProjectLabelNameChangedHandlers from "@/controllers/socket/project/label/useProjectLabelNameChangedHandlers";
import useProjectLabelDescriptionChangedHandlers from "@/controllers/socket/project/label/useProjectLabelDescriptionChangedHandlers";
import BoardSettingsLabelMore from "@/pages/BoardPage/components/settings/label/BoardSettingsLabelMore";
import BoardSettingsLabelColor from "@/pages/BoardPage/components/settings/label/BoardSettingsLabelColor";
import { BoardSettingsLabelProvider } from "@/core/providers/BoardSettingsLabelProvider";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";

export interface IBoardSettingsLabelProps {
    label: ProjectLabel.Interface;
    deletedLabel: (uid: string) => void;
    isOverlay?: bool;
}

interface IBoardSettingsLabelDragData {
    type: "Label";
    data: ProjectLabel.Interface;
}

const BoardSettingsLabel = memo(({ label, deletedLabel, isOverlay }: IBoardSettingsLabelProps): JSX.Element => {
    const { project, socket } = useBoardSettings();
    const [t] = useTranslation();
    const [labelName, setLabelName] = useState(label.name);
    const [labelDescription, setLabelDescription] = useState(label.description);
    const [isValidating, setIsValidating] = useState(false);
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: label.uid,
        data: {
            type: "Label",
            data: label,
        } satisfies IBoardSettingsLabelDragData,
        attributes: {
            roleDescription: "Label",
        },
    });
    const projectLabelNameChangedHandler = useProjectLabelNameChangedHandlers({
        socket,
        projectUID: project.uid,
        labelUID: label.uid,
        callback: (data) => {
            label.name = data.name;
            setLabelName(data.name);
        },
    });
    const projectLabelDescriptionChangedHandler = useProjectLabelDescriptionChangedHandlers({
        socket,
        projectUID: project.uid,
        labelUID: label.uid,
        callback: (data) => {
            label.description = data.description;
            setLabelDescription(data.description);
        },
    });
    useSwitchSocketHandlers({ socket, handlers: [projectLabelNameChangedHandler, projectLabelDescriptionChangedHandler] });

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    const variants = tv({
        variants: {
            dragging: {
                over: "border-b-2 border-primary/50 [&>div]:opacity-30",
                overlay: "",
            },
        },
    });

    const props = {
        style,
        className: variants({
            dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
        }),
        ref: setNodeRef,
    };

    return (
        <BoardSettingsLabelProvider label={label} isValidating={isValidating} setIsValidating={setIsValidating}>
            <Flex items="center" justify="between" {...props}>
                <Flex items="center" gap={{ initial: "1.5", sm: "2.5" }} className="truncate">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="h-8 min-h-8 w-5 min-w-5 sm:size-8 sm:min-w-8"
                        title={t("common.Drag to reorder")}
                        disabled={isValidating}
                        {...attributes}
                        {...listeners}
                    >
                        <IconComponent icon="grip-vertical" size="4" />
                    </Button>
                    <BoardSettingsLabelColor />
                    <Flex items={{ sm: "center" }} direction={{ initial: "col", sm: "row" }} gap={{ sm: "3" }} className="truncate">
                        <Tooltip.Provider delayDuration={400}>
                            <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                    <Box textSize="sm" className="truncate">
                                        {labelName}
                                    </Box>
                                </Tooltip.Trigger>
                                <Tooltip.Content>{labelName}</Tooltip.Content>
                            </Tooltip.Root>
                        </Tooltip.Provider>
                        <Tooltip.Provider delayDuration={400}>
                            <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                    <Box textSize="sm" className="truncate text-muted-foreground/70">
                                        {labelDescription}
                                    </Box>
                                </Tooltip.Trigger>
                                <Tooltip.Content>{labelDescription}</Tooltip.Content>
                            </Tooltip.Root>
                        </Tooltip.Provider>
                    </Flex>
                </Flex>
                <BoardSettingsLabelMore deletedLabel={deletedLabel} />
            </Flex>
        </BoardSettingsLabelProvider>
    );
});

export default BoardSettingsLabel;
