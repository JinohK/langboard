import * as nodemailer from "nodemailer";
import * as fs from "fs";
import Consumer from "@/core/broadcast/Consumer";
import Subscription from "@/core/server/Subscription";
import UserNotification from "@/models/UserNotification";
import UserNotificationUnsubscription, { ENotificationChannel, TSocketPublishData } from "@/models/UserNotificationUnsubscription";
import { MAIL_FROM, MAIL_FROM_NAME, MAIL_PASSWORD, MAIL_PORT, MAIL_SERVER, MAIL_SSL_TLS, MAIL_USERNAME, PROJECT_NAME, ROOT_DIR } from "@/Constants";
import * as path from "path";
import { Utils } from "@langboard/core/utils";
import { ESocketTopic } from "@langboard/core/enums";
import SnowflakeID from "@/core/db/SnowflakeID";

Consumer.register("notification_publish", async (data: unknown) => {
    const webNotification = async (model: TSocketPublishData) => {
        const hasUnsubscription = await UserNotificationUnsubscription.hasUnsubscription(model, ENotificationChannel.Web);

        if (hasUnsubscription || !model.api_notification?.notifier_user?.uid) {
            return;
        }

        delete (model.notification as Record<string, unknown>).id;

        for (let i = 0; i < (model.notification.record_list?.length ?? 0); ++i) {
            const [record, id] = model.notification.record_list![i];
            model.notification.record_list![i] = [record, id.toString()];
        }

        await UserNotification.create({
            ...model.notification,
            notifier_id: model.notification.notifier_id!.toString(),
            receiver_id: model.notification.receiver_id!.toString(),
        }).save();

        await Subscription.publish(ESocketTopic.UserPrivate, new SnowflakeID(model.notification.receiver_id!).toShortCode(), "user:notified", {
            notification: model.api_notification,
        });
    };

    const emailNotification = async (model: TSocketPublishData) => {
        if (!model.email_template_name || !MAIL_SERVER || !MAIL_FROM || !MAIL_PORT) {
            return;
        }

        const hasUnsubscription = await UserNotificationUnsubscription.hasUnsubscription(model, ENotificationChannel.Email);

        if (hasUnsubscription || !model.target_user?.email) {
            return;
        }

        const resourcePath = path.join(ROOT_DIR, "src/resources/locales", model.target_user.preferred_lang ?? "en-US");
        const templatePath = path.join(resourcePath, `${model.email_template_name}_email.html`);
        const langPath = path.join(resourcePath, "lang.json");

        if (!fs.existsSync(templatePath) || !fs.existsSync(langPath)) {
            return;
        }

        let subject;
        try {
            const locale = Utils.Json.Parse(fs.readFileSync(langPath, "utf-8"));
            subject = locale.subjects[model.email_template_name];
            subject = `[${new Utils.String.Case(PROJECT_NAME).toPascal()}] ${subject}`;
            subject = Utils.String.format(subject, model.email_formats ?? {});
        } catch {
            return;
        }

        const content = Utils.String.format(fs.readFileSync(templatePath, "utf-8"), model.email_formats ?? {});

        await nodemailer
            .createTransport({
                host: MAIL_SERVER,
                port: Number(MAIL_PORT),
                secure: MAIL_SSL_TLS,
                auth: {
                    user: MAIL_USERNAME,
                    pass: MAIL_PASSWORD,
                },
            })
            .sendMail({
                from: `"${MAIL_FROM_NAME}" <${MAIL_FROM}>`,
                to: model.target_user.email,
                subject,
                html: content,
            });
    };

    const mobileNotification = async (model: TSocketPublishData) => {
        const hasUnsubscription = await UserNotificationUnsubscription.hasUnsubscription(model, ENotificationChannel.Mobile);

        if (hasUnsubscription) {
            return;
        }
    };

    const iotNotification = async (model: TSocketPublishData) => {
        const hasUnsubscription = await UserNotificationUnsubscription.hasUnsubscription(model, ENotificationChannel.IoT);

        if (hasUnsubscription) {
            return;
        }
    };

    if (!Utils.Type.isObject<TSocketPublishData>(data)) {
        return;
    }

    if (!data.notification || !data.target_user || !data.notification.notification_type) {
        return;
    }

    await webNotification(data);
    await emailNotification(data);
    await mobileNotification(data);
    await iotNotification(data);
});
