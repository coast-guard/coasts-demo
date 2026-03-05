defmodule Crm.Repo do
  use Ecto.Repo,
    otp_app: :crm,
    adapter: Ecto.Adapters.Postgres
end
