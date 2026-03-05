defmodule CrmWeb.Plugs.RequireAuth do
  import Plug.Conn
  alias Crm.SessionStore

  def init(opts), do: opts

  def call(conn, _opts) do
    with ["Bearer " <> token] <- get_req_header(conn, "authorization"),
         {:ok, user_id} <- SessionStore.get_session(token) do
      assign(conn, :current_user_id, user_id)
    else
      _ ->
        conn
        |> put_status(401)
        |> Phoenix.Controller.json(%{error: "Unauthorized"})
        |> halt()
    end
  end
end
