const RAW_ROUTES = {
    LOGIN: "/login",
    LOGIN_PASSWORD: "/login/pwd",
    AFTER_LOGIN: "/dashboard",
    DASHBOARD: "/dashboard",
};

export const ROUTES = RAW_ROUTES as Readonly<Record<keyof typeof RAW_ROUTES, string>>;
