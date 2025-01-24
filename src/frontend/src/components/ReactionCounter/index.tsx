import { Button, Dock, Flex, IconComponent, Popover, AnimatedEmoji } from "@/components/base";
import { TEmoji } from "@/components/base/AnimatedEmoji/emojis";
import { cn } from "@/core/utils/ComponentUtils";
import { createShortUUID } from "@/core/utils/StringUtils";
import TypeUtils from "@/core/utils/TypeUtils";
import { LottieRefCurrentProps } from "lottie-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IReactionCounterProps<TReactionData = unknown> {
    reactions: Partial<Record<TEmoji, TReactionData[]>>;
    toggleCallback: (reaction: TEmoji) => void;
    isActiveReaction?: (reaction: TEmoji, data: TReactionData[]) => bool;
    disabled?: bool;
}

function ReactionCounter({ reactions, toggleCallback, isActiveReaction, disabled }: IReactionCounterProps): JSX.Element {
    const [t] = useTranslation();
    const reactionOrders: TEmoji[] = ["check-mark", "thumbs-up", "thumbs-down", "laughing", "party-popper", "confusing", "heart", "rocket", "eyes"];
    const [isOpened, setIsOpened] = useState(false);

    const toggle = (emoji: TEmoji) => {
        setIsOpened(false);
        toggleCallback(emoji);
    };

    return (
        <Popover.Root open={isOpened} onOpenChange={setIsOpened}>
            <Flex wrap gap="1">
                {reactionOrders.map((reaction) => {
                    if (!reactions[reaction] || reactions[reaction].length === 0) {
                        return null;
                    }

                    return (
                        <ReactionCounterButton
                            key={`reaction-counter-${reaction}-${createShortUUID()}`}
                            reaction={reaction}
                            reactionData={reactions[reaction]}
                            toggleCallback={toggle}
                            isActiveReaction={isActiveReaction}
                            disabled={disabled}
                        />
                    );
                })}
                <Popover.Trigger asChild>
                    <Button variant="ghost" size="icon-sm" title={t("reaction.React")} className="size-6">
                        <IconComponent icon="smile-plus" size="4" />
                    </Button>
                </Popover.Trigger>
            </Flex>
            <Popover.Content className="size-auto border-none bg-transparent p-0">
                <Dock.Root
                    direction="middle"
                    magnification={50}
                    distance={100}
                    size="sm"
                    className="!mt-0 h-auto max-w-[100vw] flex-wrap gap-1 px-1 py-0 xs:h-12"
                >
                    {reactionOrders.map((reaction) => ReactionCounterButton({ reaction, isDock: true, toggleCallback: toggle, disabled }))}
                </Dock.Root>
            </Popover.Content>
        </Popover.Root>
    );
}

interface IBaseReactionCounterButtonProps<TReactionData = unknown> {
    reaction: TEmoji;
    reactionData?: TReactionData[];
    isDock?: bool;
    toggleCallback: (emoji: TEmoji) => void;
    isActiveReaction?: (emoji: TEmoji, data: TReactionData[]) => bool;
    disabled?: bool;
}

interface IReactionCounterListButtonProps<TReactionData = unknown> extends IBaseReactionCounterButtonProps<TReactionData> {
    isDock?: bool;
    reactionData: TReactionData[];
}

interface IReactionCounterDockButtonProps extends IBaseReactionCounterButtonProps {
    isDock: true;
    reactionData?: never;
    isActiveReaction?: never;
}

type TReactionCounterButtonProps = IReactionCounterListButtonProps | IReactionCounterDockButtonProps;

function ReactionCounterButton({ reaction, reactionData, toggleCallback, isActiveReaction, disabled }: TReactionCounterButtonProps): JSX.Element {
    const [t] = useTranslation();
    const lottieRef = useRef<LottieRefCurrentProps>(null);
    const isPlayed = useRef(false);

    const play = () => {
        if (!isPlayed.current) {
            lottieRef.current?.play();
            isPlayed.current = true;
        }
    };

    const stop = () => {
        lottieRef.current?.stop();
        isPlayed.current = false;
    };

    const emoji = <AnimatedEmoji emoji={reaction} className="inline-block" lottieRef={lottieRef} onLoopComplete={stop} />;

    const buttonProps = {
        onPointerEnter: play,
        onPointerLeave: stop,
        onClick: () => toggleCallback(reaction),
        disabled,
    };

    if (TypeUtils.isUndefined(reactionData)) {
        return (
            <Dock.Button
                key={`reaction-dock-${reaction}-${createShortUUID()}`}
                buttonProps={{
                    type: "button",
                    className: "size-full p-3",
                    ...buttonProps,
                }}
                dockIconProps={{ className: "bg-accent/70 transition-colors duration-300 hover:text-primary" }}
                title={t(`reaction.${reaction}`)}
                titleSide="bottom"
            >
                {emoji}
            </Dock.Button>
        );
    }

    return (
        <Button
            variant="outline"
            size="sm"
            title={t(`reaction.${reaction}`)}
            className={cn("h-6 gap-1.5 px-1.5", isActiveReaction?.(reaction, reactionData) ? "bg-accent/75" : "")}
            {...buttonProps}
        >
            <Flex items="center" w="4">
                {emoji}
            </Flex>
            {reactionData.length}
        </Button>
    );
}

export default ReactionCounter;
