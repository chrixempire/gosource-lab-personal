#!/bin/sh

: ${ENV_SECRETS_DIR:=/run/secrets}

env_secret_debug() {
    if [ ! -z "$ENV_SECRETS_DEBUG" ]; then
        echo -e "\033[1m$@\033[0m"
    fi
}

env_secret_expand() {
    var="$1"
    eval val=\$$var
    if secret_name=$(expr match "$val" "DOCKER-SECRET:\([^}]\+\)$"); then
        secret="${ENV_SECRETS_DIR}/${secret_name}"
        env_secret_debug "Secret file for $var: $secret"
        if [ -f "$secret" ]; then
            val=$(cat "${secret}")
            export "$var"="$val"
            env_secret_debug "Expanded variable: $var=$val"
        else
            env_secret_debug "Secret file does not exist! $secret"
        fi
    fi
}

env_secrets_expand() {
    for env_var in $(printenv | cut -f1 -d"=")
    do
        env_secret_expand $env_var
    done

    if [ ! -z "$ENV_SECRETS_DEBUG" ]; then
        echo -e "\n\033[1mExpanded environment variables\033[0m"
        printenv
    fi
}

# Function to get the current Git branch
get_current_branch() {
    git rev-parse --abbrev-ref HEAD
}

# Get the current branch
current_branch=$(get_current_branch)

# Check if the current branch is 'dev'
if [ "$current_branch" != "dev" ]; then
    env_secrets_expand
else
    echo "Skipping secret expansion for dev branch"
fi

npm run start:prod