export interface ISidebarNavItem {
    icon: string;
    name: string;
    href?: string;
    onClick?: () => void;
    current?: true;
}

export interface ISidebarProps {
    navs: ISidebarNavItem[];
    main: React.ReactNode;
    floatingIcon?: string;
    floatingTitle?: string;
}

interface IBaseSidebarNavItemsProps {
    isFloating?: bool;
    navs: ISidebarNavItem[];
}

interface IFloatingSidebarNavItemsProps extends IBaseSidebarNavItemsProps {
    isFloating: true;
}

export type TSidebarNavItemsProps = IBaseSidebarNavItemsProps | IFloatingSidebarNavItemsProps;
