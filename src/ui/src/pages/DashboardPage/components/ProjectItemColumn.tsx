import { Box, Flex, Tooltip } from "@/components/base";
import { ProjectColumn } from "@/core/models";
import { ColorGenerator } from "@/core/utils/ColorUtils";

export interface IProjectCardColumnProps {
    column: ProjectColumn.TModel;
}

function ProjectCardColumn({ column }: IProjectCardColumnProps) {
    const name = column.useField("name");
    const count = column.useField("count");

    return (
        <Tooltip.Root>
            <Tooltip.Trigger asChild>
                <Flex direction="col" gap="0.5" minW="5" className="text-center">
                    <span className="text-sm font-semibold">{count}</span>
                    <Box
                        display="inline-block"
                        h="0.5"
                        w="full"
                        rounded="full"
                        style={{ background: new ColorGenerator(name).generateRandomColor() }}
                    />
                </Flex>
            </Tooltip.Trigger>
            <Tooltip.Content side="bottom">{name}</Tooltip.Content>
        </Tooltip.Root>
    );
}

export default ProjectCardColumn;
