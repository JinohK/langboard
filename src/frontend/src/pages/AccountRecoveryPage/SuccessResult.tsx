import { IconComponent } from "@/components/base";
import { cn } from "@/core/utils/ComponentUtils";
import { Children } from "react";

interface ISuccessResultProps {
    title: string;
    children: React.ReactNode;
    buttons: JSX.Element;
}

function SuccessResult({ title, children, buttons }: ISuccessResultProps): JSX.Element {
    let buttonWrapperClassNames = "max-xs:justify-between xs:justify-end";
    if (Children.count(buttons) === 1) {
        buttonWrapperClassNames = "max-xs:justify-center xs:justify-center";
    }

    return (
        <div className="flex flex-col items-center gap-8 max-xs:mt-11">
            <IconComponent icon="circle-check" size="8" className="text-green-500" />
            <h2 className="text-center text-2xl">{title}</h2>
            <h5 className="text-base">{children}</h5>
            <div className={cn("mt-8 flex items-center gap-8", buttonWrapperClassNames)}>{buttons}</div>
        </div>
    );
}

export default SuccessResult;
