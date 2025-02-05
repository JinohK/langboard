import { Box, Flex, Tooltip } from "@/components/base";
import { IBaseModel, TBaseModelInstance } from "@/core/models/Base";
import { getTextColorFromHex } from "@/core/utils/ColorUtils";
import { memo } from "react";

interface ILabelModel {
    name: string;
    color: string;
    description?: string;
}

export interface ILabelBadgeProps extends ILabelModel {
    textColor?: string;
    noTooltip?: bool;
}

export const LabelBadge = memo(({ name, color, textColor, description, noTooltip }: ILabelBadgeProps) => {
    const currentColor = color || "#FFFFFF";
    const currentDescription = description || name;

    const badge = (
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
                    color: textColor ?? getTextColorFromHex(currentColor),
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
    );

    if (noTooltip) {
        return badge;
    }

    return (
        <Tooltip.Provider delayDuration={Tooltip.DEFAULT_DURATION}>
            <Tooltip.Root>
                <Tooltip.Trigger asChild>{badge}</Tooltip.Trigger>
                <Tooltip.Content side="bottom">{currentDescription}</Tooltip.Content>
            </Tooltip.Root>
        </Tooltip.Provider>
    );
});

export interface ILabelModelBadgeProps {
    model: TBaseModelInstance<IBaseModel & ILabelModel>;
}

export const LabelModelBadge = memo(({ model }: ILabelModelBadgeProps) => {
    const name = model.useField("name");
    const color = model.useField("color");
    const description = model.useField("description");

    return <LabelBadge name={name} color={color} description={description} />;
});
