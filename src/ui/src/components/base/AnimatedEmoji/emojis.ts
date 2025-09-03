import AiLoadingEmoji from "@/assets/lotties/ai-loading.json";
import CheckMarkEmoji from "@/assets/lotties/check-mark.json";
import ConfusingEmoji from "@/assets/lotties/confusing.json";
import EyesEmoji from "@/assets/lotties/eyes.json";
import HeartEmoji from "@/assets/lotties/heart.json";
import LaughingEmoji from "@/assets/lotties/laughing.json";
import PartyPopperEmoji from "@/assets/lotties/party-popper.json";
import RocketEmoji from "@/assets/lotties/rocket.json";
import ThumbsDownEmoji from "@/assets/lotties/thumbs-down.json";
import ThumbsUpEmoji from "@/assets/lotties/thumbs-up.json";

const emojis = {
    "ai-loading": AiLoadingEmoji,
    "check-mark": CheckMarkEmoji,
    confusing: ConfusingEmoji,
    eyes: EyesEmoji,
    heart: HeartEmoji,
    laughing: LaughingEmoji,
    "party-popper": PartyPopperEmoji,
    rocket: RocketEmoji,
    "thumbs-down": ThumbsDownEmoji,
    "thumbs-up": ThumbsUpEmoji,
};

export type TEmoji = keyof typeof emojis;

export default emojis;
