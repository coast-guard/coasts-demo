defmodule Crm.User do
  use Ecto.Schema
  import Ecto.Changeset

  schema "users" do
    field :email, :string
    field :name, :string
    field :password_hash, :string
    field :password, :string, virtual: true

    timestamps()
  end

  def changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :name, :password])
    |> validate_required([:email, :name, :password])
    |> validate_format(:email, ~r/@/)
    |> validate_length(:password, min: 6)
    |> unique_constraint(:email)
    |> hash_password()
  end

  defp hash_password(%Ecto.Changeset{valid?: true, changes: %{password: password}} = changeset) do
    put_change(changeset, :password_hash, hash(password))
  end

  defp hash_password(changeset), do: changeset

  def verify_password(%__MODULE__{password_hash: hash}, password) do
    hash(password) == hash
  end

  # Simple hash for demo purposes - use bcrypt/argon2 in production
  defp hash(password) do
    :crypto.hash(:sha256, password <> "crm-salt") |> Base.encode16(case: :lower)
  end
end
