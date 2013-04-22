.PHONY: setup _wordpress/wordpress/wp-content/plugins/mammoth

setup: _wordpress/wordpress/wp-content/plugins/mammoth

_whack/bin/python:
	virtualenv _whack

_whack/bin/whack: _whack/bin/python
	_whack/bin/pip install whack

_wordpress: _whack/bin/whack
	. _whack/bin/activate; \
		whack install git+https://github.com/mwilliamson/whack-package-wordpress.git $@ \
			-p mysql_database=wp_mammoth \
			-p mysql_username=wp_mammoth \
			-p mysql_password=password1 \
			-p port=54713

_wordpress/wordpress/wp-content/plugins/mammoth: _wordpress
	ln -sfT `pwd`/mammoth $@
	_wordpress/bin/wp plugin activate mammoth
