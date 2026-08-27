# frozen_string_literal: true

# Keep flat attribute hashes (no root / JSON:API envelope) to match the SPA User type.
ActiveModelSerializers.config.adapter = :attributes
