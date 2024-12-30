import { Box, Flex, Tooltip } from "@/components/base";
import { ProjectLabel } from "@/core/models";
import { memo } from "react";

export interface IBoardFilterLabelProps {
    label: ProjectLabel.TModel;
}

const BoardFilterLabel = memo(({ label }: IBoardFilterLabelProps) => {
    const name = label.useField("name");
    const color = label.useField("color");
    const description = label.useField("description");

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
