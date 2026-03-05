alias Crm.{Repo, Contact}

contacts = [
  %{name: "Alice Johnson", email: "alice@example.com", company: "Acme Corp", phone: "555-0101", status: "active"},
  %{name: "Bob Smith", email: "bob@example.com", company: "Globex", phone: "555-0102", status: "active"},
  %{name: "Carol Williams", email: "carol@example.com", company: "Initech", phone: "555-0103", status: "lead"},
  %{name: "Dave Brown", email: "dave@example.com", company: "Umbrella Corp", phone: "555-0104", status: "inactive"},
  %{name: "Eve Davis", email: "eve@example.com", company: "Acme Corp", phone: "555-0105", status: "active"}
]

for attrs <- contacts do
  %Contact{}
  |> Contact.changeset(attrs)
  |> Repo.insert!(on_conflict: :nothing, conflict_target: :email)
end
