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
    isCollapsed?: boolean;
    isFloating?: boolean;
    navs: ISidebarNavItem[];
}

interface ICollapsableSidebarNavItemsProps extends IBaseSidebarNavItemsProps {
    isCollapsed: boolean;
    isFloating?: undefined;
}

interface IFloatingSidebarNavItemsProps extends IBaseSidebarNavItemsProps {
    isCollapsed?: undefined;
    isFloating: true;
}

export type TSidebarNavItemsProps = ICollapsableSidebarNavItemsProps | IFloatingSidebarNavItemsProps;
