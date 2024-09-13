const RAW_API_ROUTES = {
    CHECK_EMAIL: "/auth/check/email",
};

export const API_ROUTES = RAW_API_ROUTES as Readonly<Record<keyof typeof RAW_API_ROUTES, string>>;
