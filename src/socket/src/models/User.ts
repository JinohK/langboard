import { Entity, Column, DeleteDateColumn } from "typeorm";
import BaseModel, { TBigIntString } from "@/core/db/BaseModel";
import { getDatetimeType } from "@/core/db/DbType";

@Entity({ name: "user" })
class User extends BaseModel {
    static get USER_TYPE(): string {
        return "user";
    }
    static get UNKNOWN_USER_TYPE(): string {
        return "unknown";
    }
    static get BOT_TYPE(): string {
        return "bot";
    }
    static get GROUP_EMAIL_TYPE(): string {
        return "group_email";
    }

    @Column({ type: "varchar" })
    public firstname!: string;

    @Column({ type: "varchar" })
    public lastname!: string;

    @Column({ type: "varchar" })
    public email!: string;

    @Column({ type: "varchar" })
    public username!: string;

    @Column({ type: "varchar" })
    public password!: string;

    @Column({ type: "boolean" })
    public is_admin: bool = false;

    @Column({ type: "varchar" })
    public preferred_lang: string = "en-US";

    @Column({ type: getDatetimeType() })
    public activated_at?: Date;

    @Column({ type: "json", nullable: true })
    public avatar: Record<string, unknown> | null = null;

    @DeleteDateColumn({ type: getDatetimeType() })
    public deleted_at: Date | null = null;

    public get apiResponse() {
        if (this.deleted_at) {
            return this.createUnknownUserApiResponse;
        }

        return {
            type: User.USER_TYPE,
            uid: this.uid,
            firstname: this.firstname,
            lastname: this.lastname,
            email: this.email,
            username: this.username,
            avatar: this.avatar,
        };
    }

    public get createUnknownUserApiResponse() {
        return {
            type: User.UNKNOWN_USER_TYPE,
            uid: this.uid,
            firstname: "",
            lastname: "",
            email: "",
            username: "",
        };
    }

    public static async findById(id: TBigIntString): Promise<User | null> {
        const user = await User.createQueryBuilder("User")
            .select([
                "cast(User.id as text) as converted_id",
                "User.firstname",
                "User.lastname",
                "User.email",
                "User.username",
                "User.avatar",
                "User.is_admin",
                "User.preferred_lang",
                "User.activated_at",
                "User.deleted_at",
                "User.created_at",
                "User.updated_at",
            ])
            .where("User.id = :id", { id })
            .getRawOne();

        if (!user) {
            return null;
        }

        user.id = user.converted_id;

        return User.create({
            ...user,
        });
    }
}

export default User;
