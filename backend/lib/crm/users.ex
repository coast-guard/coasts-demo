defmodule Crm.Users do
  alias Crm.{Repo, User}

  def get_user(id), do: Repo.get(User, id)

  def get_user_by_email(email) do
    Repo.get_by(User, email: email)
  end

  def create_user(attrs) do
    %User{}
    |> User.changeset(attrs)
    |> Repo.insert()
  end

  def authenticate(email, password) do
    case get_user_by_email(email) do
      nil -> {:error, :invalid_credentials}
      user ->
        if User.verify_password(user, password) do
          {:ok, user}
        else
          {:error, :invalid_credentials}
        end
    end
  end
end
