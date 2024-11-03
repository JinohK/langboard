import { forwardRef } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { cn } from "@/core/utils/ComponentUtils";
import CachedImage from "@/components/CachedImage";

interface IBaseFormOnlyLayoutProps {
    size?: "default" | "sm" | "lg";
    useLogo?: bool;
}

interface ITwoSidedFormOnlyLayoutProps extends IBaseFormOnlyLayoutProps {
    leftSide: React.ReactNode;
    rightSide: React.ReactNode;
    children?: null;
}

interface IFormOnlyLayoutProps extends IBaseFormOnlyLayoutProps {
    leftSide?: null;
    rightSide?: null;
    children: React.ReactNode;
}

export type TFormOnlyLayoutProps = IFormOnlyLayoutProps | ITwoSidedFormOnlyLayoutProps;

export const createTwoSidedSizeClassNames = (size: IBaseFormOnlyLayoutProps["size"]) => {
    let wrapperClassName;
    let widthClassName;

    switch (size) {
        case "sm":
            wrapperClassName = "max-xs:flex-col xs:flex-wrap xs:justify-between";
            widthClassName = "xs:w-1/2";
            break;
        case "lg":
            wrapperClassName = "max-md:flex-col md:flex-wrap md:justify-between";
            widthClassName = "md:w-1/2";
            break;
        default:
            wrapperClassName = "max-sm:flex-col sm:flex-wrap sm:justify-between";
            widthClassName = "sm:w-1/2";
            break;
    }

    return { wrapper: wrapperClassName, width: widthClassName };
};

const FormOnlyLayout = forwardRef<HTMLDivElement, TFormOnlyLayoutProps>(
    ({ size = "default", leftSide, rightSide, children, useLogo, ...props }, ref) => {
        const isTwoSided = leftSide && rightSide;
        let content;
        let widthClassName;
        switch (size) {
            case "sm":
                widthClassName = isTwoSided ? "max-w-screen-sm" : "max-w-screen-xs";
                break;
            case "lg":
                widthClassName = isTwoSided ? "max-w-screen-lg" : "max-w-screen-md";
                break;
            default:
                widthClassName = isTwoSided ? "max-w-screen-md" : "max-w-screen-sm";
        }

        if (isTwoSided) {
            const { wrapper, width } = createTwoSidedSizeClassNames(size);
            content = (
                <div className={cn("flex", wrapper)}>
                    <div className={width}>{leftSide}</div>
                    <div className={width}>{rightSide}</div>
                </div>
            );
        } else {
            content = children;
        }

        return (
            <div className="flex h-screen min-h-screen flex-col items-center justify-center xs:h-auto">
                <div className={cn("w-full", widthClassName)} ref={ref} {...props}>
                    <div className="flex flex-col max-xs:h-full max-xs:justify-between">
                        <div className="max-sm:p-6 xs:rounded-2xl xs:border-2 xs:border-border sm:p-9">
                            {useLogo && (
                                <div className="mb-6">
                                    <CachedImage src="/images/logo.png" alt="Logo" size="9" />
                                </div>
                            )}
                            {content}
                        </div>
                        <div className="max-sm:p-4 sm:mt-2">
                            <LanguageSwitcher variant="ghost" triggerType="text" />
                            <ThemeSwitcher variant="ghost" triggerType="text" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

export default FormOnlyLayout;
