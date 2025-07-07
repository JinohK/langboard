import * as path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as jwt from "jsonwebtoken";
import { Utils } from "@langboard/core/utils";

if (fs.existsSync("../../../.env")) {
    dotenv.config({ path: "../../../.env" });
} else if (fs.existsSync("../.env")) {
    dotenv.config({ path: "../.env" });
} else if (fs.existsSync("./.env")) {
    dotenv.config();
}

type TGetEnvParams<TValue extends string | number> = {
    key: string;
    defaultValue?: TValue;
    availableValues?: TValue[];
};

const getEnv = <TValue extends string | number = string>({ key, defaultValue, availableValues }: TGetEnvParams<TValue>): TValue => {
    const value = process.env[key] || defaultValue;
    if (availableValues && !availableValues.includes(value as TValue)) {
        throw new Error(`Invalid value for environment variable ${key}: ${value}. Must be one of [${availableValues.join(", ")}]`);
    }
    return value as TValue;
};

export const ENVIRONMENT = getEnv({ key: "ENVIRONMENT", defaultValue: "local", availableValues: ["local", "development", "production"] });

export const IS_EXECUTABLE = getEnv<string>({ key: "IS_EXECUTABLE", defaultValue: "false" }) == "true";

export const PROJECT_NAME = getEnv({ key: "PROJECT_NAME" });
export const PROJECT_SHORT_NAME = getEnv({ key: "PROJECT_SHORT_NAME", defaultValue: PROJECT_NAME });

export const BASE_DIR = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.join(BASE_DIR, "..", "..", "..");
export const DATA_DIR = IS_EXECUTABLE ? path.join(BASE_DIR, "data") : path.join(ROOT_DIR, "local");
export const LOGGING_DIR = getEnv<string>({ key: "LOGGING_DIR", defaultValue: path.join(DATA_DIR, "logs", "socket") });

export const PORT = parseInt(getEnv<string>({ key: "SOCKET_PORT", defaultValue: "5690" }));
export const UI_PORT = parseInt(getEnv<string>({ key: "UI_PORT", defaultValue: "5173" }));

export const BROADCAST_TYPE = getEnv({ key: "BROADCAST_TYPE", defaultValue: "in-memory", availableValues: ["in-memory", "kafka"] });
export const BROADCAST_URLS = getEnv<string>({ key: "BROADCAST_URLS", defaultValue: "" }).split(",");

export const CACHE_TYPE = getEnv({ key: "CACHE_TYPE", defaultValue: "in-memory", availableValues: ["in-memory", "redis"] });
export const CACHE_URL = getEnv<string>({ key: "CACHE_URL" });

if (BROADCAST_TYPE === "kafka" && CACHE_TYPE === "in-memory") {
    throw new Error("Cannot use in-memory cache with Kafka broadcast. Please set CACHE_TYPE to 'redis' or another supported type.");
}

export const PUBLIC_UI_URL =
    ENVIRONMENT !== "local" ? getEnv<string>({ key: "PUBLIC_UI_URL", defaultValue: `http://localhost:${UI_PORT}` }) : `http://localhost:${UI_PORT}`;

const SUPPORTED_JWT_ALTORITHMES: jwt.Algorithm[] = [
    "RS256",
    "RS384",
    "RS512",
    "ES256",
    "ES384",
    "ES512",
    "HS256",
    "HS384",
    "HS512",
    "PS256",
    "PS384",
    "PS512",
    "none",
];

export const JWT_SECRET_KEY = getEnv<string>({ key: "JWT_SECRET_KEY", defaultValue: `${PROJECT_NAME}_secret_key` });
export const JWT_ALGORITHM = getEnv<jwt.Algorithm>({ key: "JWT_ALGORITHM", defaultValue: "HS256", availableValues: SUPPORTED_JWT_ALTORITHMES });

export const MAIN_DATABASE_URL = getEnv<string>({
    key: "MAIN_DATABASE_URL",
    defaultValue: `sqlite://${path.join(ROOT_DIR, PROJECT_NAME)}.db`,
});
export const READONLY_DATABASE_URL = getEnv<string>({
    key: "READONLY_DATABASE_URL",
    defaultValue: MAIN_DATABASE_URL,
});
export const DB_TIMEOUT = parseInt(getEnv<string>({ key: "DB_TIMEOUT" }));
export const DB_TCP_USER_TIMEOUT = parseInt(getEnv<string>({ key: "DB_TCP_USER_TIMEOUT" }));

export const REFRESH_TOKEN_NAME = `refresh_token_${PROJECT_SHORT_NAME}`;

// SMTP
export const MAIL_FROM = getEnv<string>({ key: "MAIL_FROM" });
export const MAIL_FROM_NAME = getEnv<string>({ key: "MAIL_FROM_NAME", defaultValue: `${new Utils.String.Case(PROJECT_NAME).toPascal()} Team` });
export const MAIL_USERNAME = getEnv<string>({ key: "MAIL_USERNAME", defaultValue: "" });
export const MAIL_PASSWORD = getEnv<string>({ key: "MAIL_PASSWORD", defaultValue: "" });
export const MAIL_SERVER = getEnv<string>({ key: "MAIL_SERVER" });
export const MAIL_PORT = getEnv<string>({ key: "MAIL_PORT" });
export const MAIL_SSL_TLS = getEnv<string>({ key: "MAIL_SSL_TLS" }) == "true";
