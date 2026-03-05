import Config

config :crm, Crm.Repo,
  url: System.get_env("DATABASE_URL") || "ecto://postgres:postgres@localhost:5432/crm_dev",
  pool_size: 10

config :crm, CrmWeb.Endpoint,
  http: [ip: {0, 0, 0, 0}, port: String.to_integer(System.get_env("PORT") || "4000")],
  check_origin: false,
  debug_errors: true,
  secret_key_base: System.get_env("SECRET_KEY_BASE") || "dev-secret-key-base-that-is-at-least-64-bytes-long-for-phoenix-to-accept",
  server: System.get_env("PHX_SERVER") == "true"

config :crm, :redis_url, System.get_env("REDIS_URL") || "redis://localhost:6379/0"
