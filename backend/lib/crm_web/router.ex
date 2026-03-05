defmodule CrmWeb.Router do
  use CrmWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  pipeline :authenticated do
    plug CrmWeb.Plugs.RequireAuth
  end

  scope "/api", CrmWeb do
    pipe_through :api

    get "/health", HealthController, :index
    post "/register", SessionController, :register
    post "/login", SessionController, :login
    post "/logout", SessionController, :logout
  end

  scope "/api", CrmWeb do
    pipe_through [:api, :authenticated]

    get "/me", SessionController, :me
    resources "/contacts", ContactController, except: [:new, :edit]
  end
end
