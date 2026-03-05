defmodule CrmWeb.ContactController do
  use CrmWeb, :controller

  alias Crm.{Contacts, Contact}

  def index(conn, %{"q" => query}) when query != "" do
    contacts = Contacts.search_contacts(query)
    json(conn, %{data: Enum.map(contacts, &contact_json/1)})
  end

  def index(conn, _params) do
    contacts = Contacts.list_contacts()
    json(conn, %{data: Enum.map(contacts, &contact_json/1)})
  end

  def show(conn, %{"id" => id}) do
    case Contacts.get_contact(id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "Contact not found"})

      contact ->
        json(conn, %{data: contact_json(contact)})
    end
  end

  def create(conn, %{"contact" => contact_params}) do
    case Contacts.create_contact(contact_params) do
      {:ok, contact} ->
        conn
        |> put_status(201)
        |> json(%{data: contact_json(contact)})

      {:error, changeset} ->
        conn
        |> put_status(422)
        |> json(%{errors: format_errors(changeset)})
    end
  end

  def create(conn, contact_params) do
    case Contacts.create_contact(contact_params) do
      {:ok, contact} ->
        conn
        |> put_status(201)
        |> json(%{data: contact_json(contact)})

      {:error, changeset} ->
        conn
        |> put_status(422)
        |> json(%{errors: format_errors(changeset)})
    end
  end

  def update(conn, %{"id" => id} = params) do
    contact_params = Map.get(params, "contact", params) |> Map.drop(["id"])

    case Contacts.get_contact(id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "Contact not found"})

      contact ->
        case Contacts.update_contact(contact, contact_params) do
          {:ok, updated} ->
            json(conn, %{data: contact_json(updated)})

          {:error, changeset} ->
            conn
            |> put_status(422)
            |> json(%{errors: format_errors(changeset)})
        end
    end
  end

  def delete(conn, %{"id" => id}) do
    case Contacts.get_contact(id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "Contact not found"})

      contact ->
        {:ok, _} = Contacts.delete_contact(contact)
        send_resp(conn, 204, "")
    end
  end

  defp contact_json(%Contact{} = c) do
    %{
      id: c.id,
      name: c.name,
      email: c.email,
      company: c.company,
      phone: c.phone,
      status: c.status,
      inserted_at: c.inserted_at,
      updated_at: c.updated_at
    }
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end
