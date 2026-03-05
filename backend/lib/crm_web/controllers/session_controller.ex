defmodule CrmWeb.SessionController do
  use CrmWeb, :controller

  alias Crm.{Users, SessionStore}

  def register(conn, %{"email" => email, "password" => password, "name" => name}) do
    case Users.create_user(%{email: email, password: password, name: name}) do
      {:ok, user} ->
        {:ok, token} = SessionStore.create_session(user.id)

        conn
        |> put_status(201)
        |> json(%{data: %{token: token, user: user_json(user)}})

      {:error, changeset} ->
        conn
        |> put_status(422)
        |> json(%{errors: format_errors(changeset)})
    end
  end

  def login(conn, %{"email" => email, "password" => password}) do
    case Users.authenticate(email, password) do
      {:ok, user} ->
        {:ok, token} = SessionStore.create_session(user.id)
        json(conn, %{data: %{token: token, user: user_json(user)}})

      {:error, :invalid_credentials} ->
        conn
        |> put_status(401)
        |> json(%{error: "Invalid email or password"})
    end
  end

  def logout(conn, _params) do
    case get_req_header(conn, "authorization") do
      ["Bearer " <> token] ->
        SessionStore.delete_session(token)
        json(conn, %{status: "ok"})

      _ ->
        json(conn, %{status: "ok"})
    end
  end

  def me(conn, _params) do
    user_id = conn.assigns[:current_user_id]

    case Users.get_user(user_id) do
      nil ->
        conn |> put_status(401) |> json(%{error: "User not found"})

      user ->
        json(conn, %{data: user_json(user)})
    end
  end

  defp user_json(user) do
    %{id: user.id, email: user.email, name: user.name}
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end
