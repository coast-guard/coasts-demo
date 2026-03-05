defmodule Crm.Contact do
  use Ecto.Schema
  import Ecto.Changeset

  schema "contacts" do
    field :name, :string
    field :email, :string
    field :company, :string
    field :phone, :string
    field :status, :string, default: "active"

    timestamps()
  end

  def changeset(contact, attrs) do
    contact
    |> cast(attrs, [:name, :email, :company, :phone, :status])
    |> validate_required([:name, :email])
    |> validate_format(:email, ~r/@/)
    |> validate_inclusion(:status, ["active", "inactive", "lead"])
    |> unique_constraint(:email)
  end
end
