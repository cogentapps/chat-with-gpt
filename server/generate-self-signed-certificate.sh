#!/usr/bin/bash

if [ -z "$DOMAIN" ]; then
    DOMAIN=localhost
fi

mkdir -p data && \
    cd data && \
    openssl genrsa -out key.pem 2048 && \
    openssl req -new -key key.pem -out csr.pem -subj "/C=US/ST=California/L=San Francisco/O=ChatWithGPT/OU=ChatWithGPT/CN=localhost" && \
    openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out cert.pem && \
    rm csr.pem && \
    echo "Generated self-signed certificate."