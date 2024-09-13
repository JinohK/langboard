\set replication_user `echo "$POSTGRES_REPLICATION_USER"`

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO :replication_user;
ALTER USER :replication_user WITH SUPERUSER;