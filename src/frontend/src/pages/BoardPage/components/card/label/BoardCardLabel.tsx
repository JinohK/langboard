import { Box, Flex, Tooltip } from "@/components/base";
import useProjectLabelColorChangedHandlers from "@/controllers/socket/project/label/useProjectLabelColorChangedHandlers";
import useProjectLabelDescriptionChangedHandlers from "@/controllers/socket/project/label/useProjectLabelDescriptionChangedHandlers";
import useProjectLabelNameChangedHandlers from "@/controllers/socket/project/label/useProjectLabelNameChangedHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { ProjectLabel } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { getTextColorFromHex } from "@/core/utils/ColorUtils";
import { memo, useState } from "react";

export interface IBoardCardLabelProps {
    label: ProjectLabel.Interface;
}

const BoardCardLabel = memo(({ label }: IBoardCardLabelProps) => {
    const { projectUID, socket } = useBoardCard();
    const [name, setName] = useState(label.name);
    const [color, setColor] = useState(label.color);
    const [description, setDescription] = useState(label.description);
    const projectLabelNameChangedHandler = useProjectLabelNameChangedHandlers({
        socket,
        projectUID,
        labelUID: label.uid,
        callback: (data) => {
            label.name = data.name;
            setName(data.name);
        },
    });
    const projectLabelColorChangedHandler = useProjectLabelColorChangedHandlers({
        socket,
        projectUID,
        labelUID: label.uid,
        callback: (data) => {
            label.color = data.color;
            setColor(data.color);
        },
    });
    const projectLabelDescriptionChangedHandler = useProjectLabelDescriptionChangedHandlers({
        socket,
        projectUID,
        labelUID: label.uid,
        callback: (data) => {
            label.description = data.description;
            setDescription(data.description);
        },
    });
    useSwitchSocketHandlers({
        socket,
        handlers: [projectLabelNameChangedHandler, projectLabelColorChangedHandler, projectLabelDescriptionChangedHandler],
    });

    const currentColor = color || "#FFFFFF";

    return (
        <Tooltip.Provider delayDuration={400}>
            <Tooltip.Root>
                <Tooltip.Trigger asChild>
                    <Box className="select-none" position="relative">
                        <Box
                            className="opacity-50"
                            rounded="xl"
                            size="full"
                            position="absolute"
                            top="0"
                            left="0"
                            style={{
                                backgroundColor: currentColor,
                                color: getTextColorFromHex(currentColor),
                            }}
                        />
                        <Flex
                            items="center"
                            justify="center"
                            rounded="xl"
                            size="full"
                            textSize="xs"
                            border
                            className="select-none"
                            px="2.5"
                            position="relative"
                            style={{ borderColor: currentColor }}
                        >
                            {name}
                        </Flex>
                    </Box>
                </Tooltip.Trigger>
                <Tooltip.Content side="bottom">{description}</Tooltip.Content>
            </Tooltip.Root>
        </Tooltip.Provider>
    );
});

export default BoardCardLabel;
