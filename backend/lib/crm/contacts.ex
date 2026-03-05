defmodule Crm.Contacts do
  import Ecto.Query
  alias Crm.{Repo, Contact}

  def list_contacts do
    Contact
    |> order_by(desc: :inserted_at)
    |> Repo.all()
  end

  def get_contact(id) do
    Repo.get(Contact, id)
  end

  def create_contact(attrs) do
    %Contact{}
    |> Contact.changeset(attrs)
    |> Repo.insert()
  end

  def update_contact(%Contact{} = contact, attrs) do
    contact
    |> Contact.changeset(attrs)
    |> Repo.update()
  end

  def delete_contact(%Contact{} = contact) do
    Repo.delete(contact)
  end

  def search_contacts(query) do
    wildcard = "%#{query}%"

    Contact
    |> where([c], ilike(c.name, ^wildcard) or ilike(c.email, ^wildcard) or ilike(c.company, ^wildcard))
    |> order_by(desc: :inserted_at)
    |> Repo.all()
  end
end
