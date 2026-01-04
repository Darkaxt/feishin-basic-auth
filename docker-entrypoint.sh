#!/bin/sh
# Set default values for environment variables if not already set
export LEGACY_AUTHENTICATION=${LEGACY_AUTHENTICATION:-false}
export ANALYTICS_DISABLED=${ANALYTICS_DISABLED:-false}

# Execute the original nginx command
exec "$@"
