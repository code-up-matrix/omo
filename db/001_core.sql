CREATE TABLE IF NOT EXISTS reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner text NOT NULL,
 kind text NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reports_owner_created ON reports(owner,created_at DESC);
CREATE TABLE IF NOT EXISTS rate_limits (
 key text NOT NULL, bucket bigint NOT NULL, hits integer NOT NULL CHECK(hits>0), PRIMARY KEY(key,bucket)
);
-- Operations: periodically delete expired limiter buckets older than 24 hours.
