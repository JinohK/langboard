import CheckMarkEmoji from "@/assets/lotties/check-mark.json";
import ConfusingEmoji from "@/assets/lotties/confusing.json";
import EyesEmoji from "@/assets/lotties/eyes.json";
import HeartEmoji from "@/assets/lotties/heart.json";
import LaughingEmoji from "@/assets/lotties/laughing.json";
import PartyPopperEmoji from "@/assets/lotties/party-popper.json";
import RocketEmoji from "@/assets/lotties/rocket.json";
import ThumbsDownEmoji from "@/assets/lotties/thumbs-down.json";
import ThumbsUpEmoji from "@/assets/lotties/thumbs-up.json";

export type TEmoji = "check-mark" | "confusing" | "eyes" | "heart" | "laughing" | "party-popper" | "rocket" | "thumbs-down" | "thumbs-up";

const emojis: Record<TEmoji, unknown> = {
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

export default emojis;
