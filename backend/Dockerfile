# syntax=docker/dockerfile:1
# Development image for ReactRouterPlayground API — used by docker compose

ARG RUBY_VERSION=3.4.10
FROM docker.io/library/ruby:${RUBY_VERSION}-slim

WORKDIR /rails

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      build-essential \
      curl \
      git \
      libpq-dev \
      libvips \
      libyaml-dev \
      pkg-config \
      postgresql-client \
    && rm -rf /var/lib/apt/lists /var/cache/apt/archives

ENV BUNDLE_PATH="/usr/local/bundle" \
    RAILS_ENV="development" \
    BOOTSNAP_CACHE_DIR="/rails/tmp/cache/bootsnap"

COPY Gemfile Gemfile.lock ./
RUN bundle install

COPY . .

EXPOSE 3000

ENTRYPOINT ["/rails/bin/docker-entrypoint"]
CMD ["./bin/rails", "server", "-b", "0.0.0.0", "-p", "3000"]
