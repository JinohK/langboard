const RAW_API_ROUTES = {
    AUTH_EMAIL: "/auth/email",
    LOGIN: "/auth/login",
    REFRESH: "/auth/refresh",
};

export const API_ROUTES = RAW_API_ROUTES as Readonly<Record<keyof typeof RAW_API_ROUTES, string>>;

export const REDIRECT_QUERY_NAME = "continue";
