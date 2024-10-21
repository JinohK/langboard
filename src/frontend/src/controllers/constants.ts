export const API_ROUTES = {
    AUTH: {
        EMAIL: "/auth/email",
        SIGN_IN: "/auth/signin",
        REFRESH: "/auth/refresh",
        ABOUT_ME: "/auth/me",
        RECOVERY: {
            SEND_LINK: "/auth/recovery/send",
            VALIDATE: "/auth/recovery/validate",
            RESET: "/auth/recovery/reset",
        },
        SIGN_UP: {
            SEND_LINK: "/auth/signup",
            ACTIVATE: "/auth/signup/activate",
            EXISTS_EMAIL: "/auth/signup/exist/email",
            RESEND_LINK: "/auth/signup/resend",
        },
    },
    DASHBOARD_PROJECTS: "/dashboard/projects",
} as const;

export const SOCKET_ROUTES = {} as const;
