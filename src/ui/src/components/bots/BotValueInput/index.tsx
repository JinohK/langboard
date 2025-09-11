import BotValueDefaultInput from "@/components/bots/BotValueInput/Default";
import { IBotValueInputProps } from "@/components/bots/BotValueInput/types";
import BotValueTextInput from "@/components/bots/BotValueInput/Text";
import BotValueJsonInput from "@/components/bots/BotValueInput/Json";

function BotValueInput({ valueType, ...props }: IBotValueInputProps) {
    switch (valueType) {
        case "json":
            return <BotValueJsonInput {...props} />;
        case "default":
            return <BotValueDefaultInput {...props} />;
        case "text":
            return <BotValueTextInput {...props} />;
        default:
            return null;
    }
}
export default BotValueInput;
