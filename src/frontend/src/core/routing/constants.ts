const RAW_ROUTES = {
    SIGN_IN: "/auth/signin",
    SIGN_IN_PASSWORD: "/auth/signin/pwd",
    AFTER_SIGN_IN: "/dashboard",
    DASHBOARD: "/dashboard",
    SETTINGS: "/settings",
};

export const ROUTES = RAW_ROUTES as Readonly<Record<keyof typeof RAW_ROUTES, string>>;
