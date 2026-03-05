defmodule Crm.SessionStore do
  @session_ttl 86_400  # 24 hours in seconds

  def child_spec(_opts) do
    redis_url = Application.get_env(:crm, :redis_url, "redis://localhost:6379/0")
    %{
      id: __MODULE__,
      start: {Redix, :start_link, [redis_url, [name: :redix]]}
    }
  end

  def create_session(user_id) do
    token = :crypto.strong_rand_bytes(32) |> Base.url_encode64(padding: false)
    key = session_key(token)

    case Redix.command(:redix, ["SET", key, to_string(user_id), "EX", to_string(@session_ttl)]) do
      {:ok, "OK"} -> {:ok, token}
      error -> {:error, error}
    end
  end

  def get_session(token) do
    key = session_key(token)

    case Redix.command(:redix, ["GET", key]) do
      {:ok, nil} -> {:error, :not_found}
      {:ok, user_id} -> {:ok, String.to_integer(user_id)}
      error -> {:error, error}
    end
  end

  def delete_session(token) do
    key = session_key(token)
    Redix.command(:redix, ["DEL", key])
  end

  def session_exists?(token) do
    key = session_key(token)

    case Redix.command(:redix, ["EXISTS", key]) do
      {:ok, 1} -> true
      _ -> false
    end
  end

  defp session_key(token), do: "session:#{token}"
end
