FROM alpine:latest

RUN apk add --no-cache postgresql-client busybox-suid

RUN mkdir -p /etc/cron.d

COPY docker-entrypoint.sh /scripts/docker-entrypoint.sh
COPY backup.sh /scripts/backup.sh
COPY cron.tab /var/spool/cron/crontabs/root

RUN chmod +x /scripts/backup.sh && \
    chmod 600 /var/spool/cron/crontabs/root && \
    chown root:root /var/spool/cron/crontabs/root

RUN mkdir -p /logs

ENTRYPOINT ["/scripts/docker-entrypoint.sh"]
