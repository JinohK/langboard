import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";

function Header(): JSX.Element {
    return (
        <header>
            <LanguageSwitcher />
            <ThemeSwitcher />
        </header>
    );
}

export default Header;
