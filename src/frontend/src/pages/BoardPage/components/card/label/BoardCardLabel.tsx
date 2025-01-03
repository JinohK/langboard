import { Box, Flex, Tooltip } from "@/components/base";
import { ProjectLabel } from "@/core/models";
import { getTextColorFromHex } from "@/core/utils/ColorUtils";
import { memo } from "react";

export interface IBoardCardLabelProps {
    label: ProjectLabel.TModel;
}

const BoardCardLabel = memo(({ label }: IBoardCardLabelProps) => {
    const name = label.useField("name");
    const color = label.useField("color");
    const description = label.useField("description");

    const currentColor = color || "#FFFFFF";

    return (
        <Tooltip.Provider delayDuration={Tooltip.DEFAULT_DURATION}>
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
