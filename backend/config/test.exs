import Config

config :crm, Crm.Repo,
  url: System.get_env("DATABASE_URL") || "ecto://postgres:postgres@localhost:5432/crm_test",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: 10

config :crm, CrmWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "test-secret-key-base-that-is-at-least-64-bytes-long-for-phoenix-framework",
  server: false

config :crm, :redis_url, System.get_env("REDIS_URL") || "redis://localhost:6379/1"

config :logger, level: :warning
