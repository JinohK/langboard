export const IS_PRODUCTION = process.env.IS_PRODUCTION === "true";

export const APP_NAME = process.env.PROJECT_NAME || "App";
export const APP_SHORT_NAME = process.env.PROJECT_SHORT_NAME || APP_NAME;

export const SOCKET_URL = process.env.SOCKET_URL || "http://localhost:5381";
export const API_URL = process.env.API_URL || "http://localhost:5381";

export const APP_ACCESS_TOKEN = `access_token_${APP_SHORT_NAME}`;
export const APP_REFRESH_TOKEN = `refresh_token_${APP_SHORT_NAME}`;

export const LANGUAGE_LOCALES = ["en-US"];

export const EMAIL_REGEX = /.+@.+\..+/;

export const DISABLE_DRAGGING_ATTR = "data-drag-disabled";
