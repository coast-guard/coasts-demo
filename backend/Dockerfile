FROM elixir:1.16-alpine AS builder

RUN apk add --no-cache build-base git

WORKDIR /app

RUN mix local.hex --force && mix local.rebar --force

ENV MIX_ENV=dev

COPY mix.exs mix.lock ./
RUN mix deps.get

COPY config config
COPY lib lib
COPY priv priv

RUN mix compile

FROM elixir:1.16-alpine

RUN apk add --no-cache libstdc++ openssl ncurses-libs postgresql-client

WORKDIR /app

RUN mix local.hex --force && mix local.rebar --force

COPY --from=builder /app /app
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENV MIX_ENV=dev

EXPOSE 4000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["mix", "phx.server"]
