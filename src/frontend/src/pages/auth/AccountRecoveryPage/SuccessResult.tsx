import { Children } from "react";
import { Flex, IconComponent } from "@/components/base";

interface ISuccessResultProps {
    title: string;
    children: React.ReactNode;
    buttons: JSX.Element;
}

function SuccessResult({ title, children, buttons }: ISuccessResultProps): JSX.Element {
    let buttonWrapperClassNames = "justify-between xs:justify-end";
    if (Children.count(buttons) === 1) {
        buttonWrapperClassNames = "justify-center";
    }

    return (
        <Flex direction="col" items="center" gap="8" className="max-xs:mt-11">
            <IconComponent icon="circle-check" size="8" className="text-green-500" />
            <h2 className="text-center text-2xl">{title}</h2>
            <h5 className="text-base">{children}</h5>
            <Flex items="center" gap="8" mt="8" className={buttonWrapperClassNames}>
                {buttons}
            </Flex>
        </Flex>
    );
}

export default SuccessResult;
