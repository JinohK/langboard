export interface IHeaderNavItem {
    name: string;
    subNavs?: Omit<IHeaderNavItem, "subNavs">[];
    href?: string;
    onClick?: () => void;
    active?: boolean;
}

export interface IHeaderProps {
    navs: IHeaderNavItem[];
}

interface IBaseHeaderNavItemsProps {
    isMobile?: boolean;
    navs: IHeaderProps["navs"];
    setIsOpen?: (value: boolean) => void;
    activatedClass?: string;
    deactivatedClass?: string;
    shardClass?: string;
}

interface IMobileHeaderNavItemsProps extends IBaseHeaderNavItemsProps {
    isMobile: true;
    setIsOpen: (value: boolean) => void;
    activatedClass: string;
    deactivatedClass: string;
    shardClass: string;
}

interface IDesktopHeaderNavItemsProps extends IBaseHeaderNavItemsProps {
    isMobile?: false;
}

export type THeaderNavItemsProps = IMobileHeaderNavItemsProps | IDesktopHeaderNavItemsProps;
