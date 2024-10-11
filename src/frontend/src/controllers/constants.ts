const RAW_API_ROUTES = {
    AUTH_EMAIL: "/auth/email",
    SIGN_IN: "/auth/signin",
    REFRESH: "/auth/refresh",
    ABOUT_ME: "/auth/me",
};

const RAW_SOCKET_ROUTES = {};

export const API_ROUTES = RAW_API_ROUTES as Readonly<Record<keyof typeof RAW_API_ROUTES, string>>;
export const SOCKET_ROUTES = RAW_SOCKET_ROUTES as Readonly<Record<keyof typeof RAW_SOCKET_ROUTES, string>>;

export const REDIRECT_QUERY_NAME = "continue";
