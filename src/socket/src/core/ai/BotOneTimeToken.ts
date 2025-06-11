import { JWT_ALGORITHM, JWT_SECRET_KEY, PROJECT_NAME } from "@/Constants";
import SnowflakeID from "@/core/db/SnowflakeID";
import { timegm } from "@/core/utils/DateTime";
import jwt from "jsonwebtoken";

export const createOneTimeToken = (userId: number | SnowflakeID) => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + 5);
    const expiry = timegm(date);
    const encoded = jwt.sign(
        {
            sub: userId.toString(),
            chat: "bot",
            exp: expiry,
            issuer: PROJECT_NAME,
        },
        JWT_SECRET_KEY,
        {
            algorithm: JWT_ALGORITHM,
        }
    );

    return encoded;
};
