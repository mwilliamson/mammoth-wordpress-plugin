.PHONY: setup install-wordpress

setup: install-wordpress

_whack/bin/python:
	virtualenv _whack

_whack/bin/whack: _whack/bin/python
	_whack/bin/pip install whack

_apache2: _whack/bin/whack
	. _whack/bin/activate; whack install git+https://github.com/mwilliamson/whack-package-apache2-mod-php5.git _apache2

_wp-cli/wp-cli.phar:
	mkdir -p _wp-cli
	curl http://wp-cli.org/packages/phar/wp-cli.phar > $@
	
_wp-cli/wp: _wp-cli/wp-cli.phar
	echo '#!/usr/bin/env sh' > $@
	echo 'exec $$(dirname $$0)/../_apache2/bin/php $$(dirname $$0)/wp-cli.phar "$$@"' >> $@
	chmod +x $@

_wordpress/wp-load.php: _wp-cli/wp
	mkdir -p _wordpress
	_wp-cli/wp core download --path=_wordpress/
	
_wordpress/wp-config.php: _wordpress/wp-load.php _wp-cli/wp
	_wp-cli/wp core config --path=_wordpress/ \
		--dbname=wp_mammoth \
		--dbuser=wp_mammoth \
		--dbpass=password1 \
		--dbhost=localhost
	

install-wordpress: _apache2 _wordpress/wp-config.php
	sed -i s!/usr/local/whack/htdocs!`pwd`/_wordpress!g _apache2/conf/httpd.conf
	sed -i 's!Listen 80!Listen 54713!g' _apache2/conf/httpd.conf
	_wp-cli/wp --path=_wordpress core is-installed || \
		_wp-cli/wp --path=_wordpress core install \
			--url=http://localhost:54713/ \
			--title=Mammoth \
			--admin_email=admin@example.com \
			--admin_password=password1
	mysql -uwp_mammoth -ppassword1 wp_mammoth \
		--execute 'UPDATE wp_options SET option_value="http://localhost:54713/" WHERE option_name in ("home", "siteurl")'
