import { MAIN_DATABASE_URL } from "@/Constants";

const getDatabaseType = (url: string): "sqlite" | "postgres" => {
    if (url.startsWith("sqlite://")) {
        return "sqlite";
    } else if (url.startsWith("postgresql://")) {
        return "postgres";
    }
    throw new Error(`Unsupported database URL: ${url}`);
};

const DbType = getDatabaseType(MAIN_DATABASE_URL);

export const getDatetimeType = (): "datetime" | "timestamp" => {
    switch (DbType) {
        case "sqlite":
            return "datetime";
        case "postgres":
            return "timestamp";
        default:
            throw new Error(`Unsupported database type: ${DbType}`);
    }
};

export default DbType;
