import { Box, Flex, Tooltip } from "@/components/base";
import useProjectLabelColorChangedHandlers from "@/controllers/socket/project/label/useProjectLabelColorChangedHandlers";
import useProjectLabelDescriptionChangedHandlers from "@/controllers/socket/project/label/useProjectLabelDescriptionChangedHandlers";
import useProjectLabelNameChangedHandlers from "@/controllers/socket/project/label/useProjectLabelNameChangedHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { ProjectLabel } from "@/core/models";
import { useBoard } from "@/core/providers/BoardProvider";
import { memo, useState } from "react";

export interface IBoardFilterLabelProps {
    label: ProjectLabel.Interface;
}

const BoardFilterLabel = memo(({ label }: IBoardFilterLabelProps) => {
    const { project, socket } = useBoard();
    const [name, setName] = useState(label.name);
    const [color, setColor] = useState(label.color);
    const [description, setDescription] = useState(label.description);
    const projectLabelNameChangedHandler = useProjectLabelNameChangedHandlers({
        socket,
        projectUID: project.uid,
        labelUID: label.uid,
        callback: (data) => {
            label.name = data.name;
            setName(data.name);
        },
    });
    const projectLabelColorChangedHandler = useProjectLabelColorChangedHandlers({
        socket,
        projectUID: project.uid,
        labelUID: label.uid,
        callback: (data) => {
            label.color = data.color;
            setColor(data.color);
        },
    });
    const projectLabelDescriptionChangedHandler = useProjectLabelDescriptionChangedHandlers({
        socket,
        projectUID: project.uid,
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

    return (
        <Tooltip.Provider delayDuration={400}>
            <Tooltip.Root>
                <Tooltip.Trigger asChild>
                    <Flex items="center" gap="1.5" className="truncate">
                        <Box
                            minH="6"
                            minW="6"
                            rounded="md"
                            style={{
                                backgroundColor: color || "#FFFFFF",
                            }}
                        />
                        <Box className="truncate">{name}</Box>
                    </Flex>
                </Tooltip.Trigger>
                <Tooltip.Content align="end">{description}</Tooltip.Content>
            </Tooltip.Root>
        </Tooltip.Provider>
    );
});

export default BoardFilterLabel;
