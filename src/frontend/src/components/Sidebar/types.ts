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
}

export interface ISidebarNavItemsProps {
    isCollapsed: boolean;
    navs: ISidebarNavItem[];
}
