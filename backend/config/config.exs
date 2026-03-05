import Config

config :crm,
  ecto_repos: [Crm.Repo]

config :crm, CrmWeb.Endpoint,
  url: [host: "localhost"],
  render_errors: [formats: [json: CrmWeb.ErrorJSON], layout: false],
  pubsub_server: Crm.PubSub

config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

config :phoenix, :json_library, Jason

import_config "#{config_env()}.exs"
