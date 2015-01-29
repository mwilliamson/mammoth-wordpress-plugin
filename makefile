.PHONY: test setup _wordpress/wordpress/wp-content/plugins/mammoth-docx-converter mammoth-docx-converter/mammoth-editor.js

setup: mammoth-docx-converter/mammoth-editor.js mammoth-docx-converter/readme.txt _wordpress/wordpress/wp-content/plugins/mammoth-docx-converter

mammoth-docx-converter/mammoth-editor.js:
	cd js; npm install
	js/node_modules/.bin/browserify js/mammoth-editor.js > $@

mammoth-docx-converter/readme.txt: readme.txt
	cp readme.txt $@

_whack/bin/python:
	virtualenv _whack

_whack/bin/whack: _whack/bin/python
	_whack/bin/pip install whack

_wordpress: _whack/bin/whack
	. _whack/bin/activate; \
		whack install git+https://github.com/mwilliamson/whack-package-wordpress.git $@ \
			-p wordpress_version=4.1 \
			-p mysql_database=wp_mammoth \
			-p mysql_username=wp_mammoth \
			-p mysql_password=password1 \
			-p port=54713 \
			--disable-cache

_wordpress/wordpress/wp-content/plugins/mammoth-docx-converter: _wordpress
	rm -f $@
	ln -sfT `pwd`/mammoth-docx-converter $@
	_wordpress/bin/wp plugin activate mammoth-docx-converter

tests/_virtualenv/bin/python:
	virtualenv tests/_virtualenv
	
test: setup tests/_virtualenv/bin/python
	tests/_virtualenv/bin/pip install -r tests/requirements.txt
	tests/_virtualenv/bin/nosetests tests
