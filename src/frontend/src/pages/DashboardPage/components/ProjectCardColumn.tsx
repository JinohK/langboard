import { Box, Flex, Tooltip } from "@/components/base";
import { ProjectColumn } from "@/core/models";
import { ColorGenerator } from "@/core/utils/ColorUtils";
import { arrayMove } from "@dnd-kit/sortable";

export interface IProjectCardColumnProps {
    column: ProjectColumn.TModel;
    setColumns: React.Dispatch<React.SetStateAction<ProjectColumn.TModel[]>>;
}

function ProjectCardColumn({ column, setColumns }: IProjectCardColumnProps) {
    const name = column.useField("name");
    const count = column.useField("count");
    column.useField("order", (newOrder, oldOrder) => {
        setColumns((prev) => arrayMove(prev, oldOrder, newOrder));
    });

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
