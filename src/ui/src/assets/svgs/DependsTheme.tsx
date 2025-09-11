import { useTheme } from "next-themes";
import { useMemo } from "react";

export interface IDependsThemeProps {
    Dark: React.FC<React.SVGProps<SVGSVGElement>>;
    Light: React.FC<React.SVGProps<SVGSVGElement>>;
}

const DependsTheme = ({ Dark, Light }: IDependsThemeProps) => {
    return (props: React.SVGProps<SVGSVGElement>) => {
        const { theme, systemTheme } = useTheme();
        const Component = useMemo(() => {
            switch (theme) {
                case "dark":
                    return Dark;
                case "light":
                    return Light;
                case "system":
                    return systemTheme === "dark" ? Dark : Light;
                default:
                    return Dark;
            }
        }, [theme, Dark, Light, systemTheme]);

        return <Component {...props} />;
    };
};

export default DependsTheme;
