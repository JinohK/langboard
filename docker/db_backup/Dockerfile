FROM alpine:latest

RUN apk add --no-cache postgresql-client busybox-suid

RUN mkdir -p /etc/cron.d

COPY backup.sh /scripts/backup.sh
COPY cron.tab /var/spool/cron/crontabs/root

RUN chmod +x /scripts/backup.sh && \
    chmod 600 /var/spool/cron/crontabs/root && \
    chown root:root /var/spool/cron/crontabs/root

RUN mkdir -p /logs

CMD ["crond", "-f", "-l", "7", "-c", "/var/spool/cron/crontabs"]
