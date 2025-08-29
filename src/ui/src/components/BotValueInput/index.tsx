import BotValueDefaultInput from "@/components/BotValueInput/Default";
import { IBotValueInputProps } from "@/components/BotValueInput/types";
import BotValueTextInput from "@/components/BotValueInput/Text";
import BotValueJsonInput from "@/components/BotValueInput/Json";

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
