.PHONY: test setup mammoth-docx-converter/mammoth-editor.js docker-wordpress

setup: mammoth-docx-converter/mammoth-editor.js mammoth-docx-converter/readme.txt

mammoth-docx-converter/mammoth-editor.js:
	cd js; npm install
	js/node_modules/.bin/browserify js/mammoth-editor.js > $@

mammoth-docx-converter/readme.txt: readme.txt
	cp readme.txt $@

tests/_virtualenv/bin/python:
	virtualenv tests/_virtualenv
	
test: setup tests/_virtualenv/bin/python
	tests/_virtualenv/bin/pip install -r tests/requirements.txt
	tests/_virtualenv/bin/pytest tests/tests.py

docker-wordpress:
	docker build docker -t mammoth-wordpress-plugin
