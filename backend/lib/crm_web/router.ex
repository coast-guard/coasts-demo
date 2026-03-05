defmodule CrmWeb.Router do
  use CrmWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/api", CrmWeb do
    pipe_through :api

    get "/health", HealthController, :index
    resources "/contacts", ContactController, except: [:new, :edit]
  end
end
