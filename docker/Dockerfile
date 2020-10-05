FROM wordpress:5.5.1-php7.2-apache

RUN mkdir -p /opt/wp-cli && \
    cd /opt/wp-cli && \
    curl -L https://github.com/wp-cli/wp-cli/releases/download/v2.4.0/wp-cli-2.4.0.phar > wp-cli.phar
COPY wp /usr/local/bin/wp
RUN chmod +x /usr/local/bin/wp
