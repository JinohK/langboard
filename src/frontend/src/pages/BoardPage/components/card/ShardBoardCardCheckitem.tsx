import { Button, Collapsible, Flex, IconComponent } from "@/components/base";
import { IFlexProps } from "@/components/base/Flex";
import { IBaseBoardCardCheckitem } from "@/controllers/board/useGetCardDetails";
import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";

interface IBaseShardBoardCardCheckitemProps<TCollapsible extends bool> extends IFlexProps {
    checkitem: IBaseBoardCardCheckitem;
    attributes?: DraggableAttributes;
    listeners?: SyntheticListenerMap;
    collapsibleTrigger?: TCollapsible;
    isOpenedRef?: React.MutableRefObject<bool>;
    orderable?: bool;
}

export interface IShardBoardCardCheckitemWithCollapsibleProps extends IBaseShardBoardCardCheckitemProps<true> {
    collapsibleTrigger: true;
    isOpenedRef: React.MutableRefObject<bool>;
}

export interface IShardBoardCardCheckitemWithoutCollapsibleProps extends IBaseShardBoardCardCheckitemProps<false> {
    collapsibleTrigger?: false;
    isOpenedRef?: never;
}

export type TShardBoardCardCheckitemProps = IShardBoardCardCheckitemWithCollapsibleProps | IShardBoardCardCheckitemWithoutCollapsibleProps;

const ShardBoardCardCheckitem = forwardRef<HTMLDivElement, TShardBoardCardCheckitemProps>(
    ({ checkitem, attributes, listeners, collapsibleTrigger, isOpenedRef, orderable, ...props }, ref) => {
        const [t] = useTranslation();

        return (
            <Flex items="center" justify="between" {...props} ref={ref}>
                <Flex items="center" gap="2">
                    <Flex items="center" gap="1">
                        {orderable && (
                            <Button type="button" variant="ghost" size="icon-sm" title={t("common.Drag to reorder")} {...attributes} {...listeners}>
                                <IconComponent icon="grip-vertical" size="4" />
                            </Button>
                        )}
                        {collapsibleTrigger && (
                            <Collapsible.Trigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="transition-all [&[data-state=open]>svg]:rotate-180"
                                    title={t(`common.${isOpenedRef.current ? "Collapse" : "Expand"}`)}
                                >
                                    <IconComponent icon="chevron-down" size="4" />
                                </Button>
                            </Collapsible.Trigger>
                        )}
                    </Flex>
                    {checkitem.title}
                </Flex>
            </Flex>
        );
    }
);

export default ShardBoardCardCheckitem;
