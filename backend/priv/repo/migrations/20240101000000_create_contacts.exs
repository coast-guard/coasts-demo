defmodule Crm.Repo.Migrations.CreateContacts do
  use Ecto.Migration

  def change do
    create table(:contacts) do
      add :name, :string, null: false
      add :email, :string, null: false
      add :company, :string
      add :phone, :string
      add :status, :string, default: "active"

      timestamps()
    end

    create unique_index(:contacts, [:email])
  end
end
