import emojis, { TEmoji } from "@/components/base/AnimatedEmoji/emojis";
import Lottie, { PartialLottieComponentProps } from "lottie-react";
import { forwardRef, memo } from "react";

export interface IAnimatedEmojiProps extends Omit<PartialLottieComponentProps, "loop"> {
    emoji: TEmoji;
}

const AnimatedEmoji = memo(
    forwardRef<HTMLDivElement, IAnimatedEmojiProps>(({ emoji, ...props }, ref) => {
        return <Lottie animationData={emojis[emoji]} loop={true} autoplay={false} {...props} ref={ref} />;
    })
);

export default AnimatedEmoji;
