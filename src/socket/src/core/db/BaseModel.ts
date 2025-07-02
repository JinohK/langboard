/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDatetimeType } from "@/core/db/DbType";
import SnowflakeID from "@/core/db/SnowflakeID";
import { BaseEntity, DeepPartial, Column, InsertResult, SaveOptions, PrimaryColumn } from "typeorm";
import type { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity.js";

export type TBigIntString = string;

export const ROLE_ALL_GRANTED = "*";

export type TRoleAllGranted = typeof ROLE_ALL_GRANTED;
export interface IEditorContentModel {
    content: string;
}

const bigIntTransformer = {
    to: (value: any): TBigIntString => value?.toString() ?? null,
    from: (value: any): TBigIntString => value?.toString() ?? null,
};

export const BigIntColumn = (isPrimary: bool) =>
    isPrimary ? PrimaryColumn("bigint", { transformer: [bigIntTransformer] }) : Column("bigint", { transformer: [bigIntTransformer] });

abstract class BaseModel extends BaseEntity {
    @BigIntColumn(true)
    public id!: TBigIntString;

    @Column({ type: getDatetimeType() })
    public created_at: Date = new Date();

    @Column({ type: getDatetimeType() })
    public updated_at: Date = new Date();

    public get uid(): string {
        return new SnowflakeID(this.id).toShortCode();
    }

    static create<T extends BaseModel>(
        this: {
            new (): T;
        } & typeof BaseModel
    ): T;
    static create<T extends BaseModel>(
        this: {
            new (): T;
        } & typeof BaseModel,
        entityLike: DeepPartial<Omit<T, "id">>
    ): T;
    static create<T extends BaseModel>(
        this: {
            new (): T;
        } & typeof BaseModel,
        entityLikeArray: DeepPartial<Omit<T, "id">>[]
    ): T[];
    static create(this: any, entityLike?: DeepPartial<any> | DeepPartial<any>[]): any {
        return super.create(entityLike);
    }

    static insert<T extends BaseEntity>(
        this: {
            new (): T;
        } & typeof BaseEntity,
        entity: QueryDeepPartialEntity<T> | QueryDeepPartialEntity<T>[]
    ): Promise<InsertResult> {
        (entity as any).id = new SnowflakeID().toString();
        return super.insert(entity);
    }

    public save(options?: SaveOptions): Promise<this> {
        if (!this.id) {
            this.id = new SnowflakeID().toString();
        }
        this.updated_at = new Date();
        return super.save(options);
    }
}

export default BaseModel;
