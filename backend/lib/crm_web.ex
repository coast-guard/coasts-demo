defmodule CrmWeb do
  def controller do
    quote do
      use Phoenix.Controller, formats: [:json]

      import Plug.Conn
      alias CrmWeb.Router.Helpers, as: Routes

      unquote(verified_routes())
    end
  end

  def router do
    quote do
      use Phoenix.Router, helpers: true

      import Plug.Conn
      import Phoenix.Controller
    end
  end

  def verified_routes do
    quote do
      use Phoenix.VerifiedRoutes,
        endpoint: CrmWeb.Endpoint,
        router: CrmWeb.Router
    end
  end

  defmacro __using__(which) when is_atom(which) do
    apply(__MODULE__, which, [])
  end
end
