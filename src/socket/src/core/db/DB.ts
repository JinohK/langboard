import { READONLY_DATABASE_URL, PROJECT_NAME, MAIN_DATABASE_URL, DB_TIMEOUT, DB_TCP_USER_TIMEOUT } from "@/Constants";
import { DataSource } from "typeorm";
import type { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import type { SqliteConnectionOptions } from "typeorm/driver/sqlite/SqliteConnectionOptions";
import { types } from "pg";
import { ALL_ENTITIES } from "@/models";
import DbType from "@/core/db/DbType";

types.setTypeParser(20, (val) => val);

const createDBOptions = (): PostgresConnectionOptions | SqliteConnectionOptions => {
    switch (DbType) {
        case "sqlite":
            return {
                type: "sqlite",
                database: MAIN_DATABASE_URL.replace("sqlite://", ""),
                migrationsRun: false,
                dropSchema: false,
            };
        case "postgres":
            return {
                type: "postgres",
                applicationName: `${PROJECT_NAME}-socket`,
                useUTC: true,
                maxQueryExecutionTime: DB_TIMEOUT,
                connectTimeoutMS: DB_TCP_USER_TIMEOUT,
                replication: {
                    master: {
                        url: MAIN_DATABASE_URL.replace("postgresql://", "postgres://"),
                    },
                    slaves: [
                        {
                            url: READONLY_DATABASE_URL.replace("postgresql://", "postgres://"),
                        },
                    ],
                    defaultMode: "slave",
                },
            };
        default:
            throw new Error(`Unsupported database type: ${DbType}`);
    }
};

const DB = new DataSource({
    ...createDBOptions(),
    synchronize: false,
    migrationsRun: false,
    dropSchema: false,
    entities: ALL_ENTITIES,
});

export default DB;
