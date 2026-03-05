defmodule CrmWeb.HealthController do
  use CrmWeb, :controller

  def index(conn, _params) do
    conn
    |> put_status(200)
    |> json(%{status: "ok"})
  end
end
