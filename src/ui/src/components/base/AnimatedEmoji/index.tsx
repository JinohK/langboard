import emojis, { TEmoji } from "@/components/base/AnimatedEmoji/emojis";
import Lottie, { PartialLottieComponentProps } from "lottie-react";
import { memo } from "react";

export interface IAnimatedEmojiProps extends Omit<PartialLottieComponentProps, "loop" | "animationData" | "autoplay"> {
    emoji: TEmoji;
}

const AnimatedEmoji = memo(({ emoji, ...props }: IAnimatedEmojiProps) => {
    return <Lottie {...props} animationData={emojis[emoji]} loop={true} autoplay={false} />;
});

export default AnimatedEmoji;
