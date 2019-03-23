import os
import contextlib
import time

import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.firefox_binary import FirefoxBinary
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions
from selenium.common.exceptions import NoAlertPresentException
import requests

from .start_wordpress import start_wordpress
from .util import wordpress_port as _port


import logging
selenium_logger = logging.getLogger('selenium.webdriver.remote.remote_connection')
selenium_logger.setLevel(logging.WARNING)


def test_can_convert_simple_docx_to_html():
    with _add_new_post() as add_post_page:
        add_post_page.docx_converter.upload(_test_data_path("single-paragraph.docx"))
        assert_equal(add_post_page.docx_converter.read_raw_preview(), "<p>\n  Walking on imported air\n</p>")
        assert_equal(add_post_page.docx_converter.read_visual_preview(), "Walking on imported air")


def test_clicking_insert_button_inserts_raw_html_into_text_editor():
    with _add_new_post() as add_post_page:
        add_post_page.editor.select_text_tab()

        add_post_page.docx_converter.upload(_test_data_path("single-paragraph.docx"))
        add_post_page.docx_converter.insert_html()

        assert_equal(add_post_page.editor.text(), "<p>\n  Walking on imported air\n</p>")


def test_clicking_insert_button_inserts_raw_html_into_visual_editor():
    with _add_new_post() as add_post_page:
        add_post_page.editor.select_visual_tab()

        add_post_page.docx_converter.upload(_test_data_path("single-paragraph.docx"))
        add_post_page.docx_converter.insert_html()

        add_post_page.editor.select_text_tab()
        # Some editors add in a bit of whitespace which we don't really care about
        actual = add_post_page.editor.text().replace("&nbsp;", " ").strip()
        # Default WordPress editor strips <p> tags, so we don't expect them even though this is HTML
        assert_equal(actual.lstrip("<p>").rstrip("</p>").strip(), "Walking on imported air")


def test_images_are_uploaded_as_part_of_post():
    with WordPressBrowser.start() as browser:
        browser.login()
        add_post_page = browser.add_new_post()

        add_post_page.docx_converter.upload(_test_data_path("tiny-picture.docx"))
        add_post_page.editor.select_text_tab()
        add_post_page.docx_converter.insert_html()

        add_post_page.editor.wait_for_text("img")
        add_post_page.publish()
        post_page = add_post_page.view_post()

        image = post_page.find_body_element(css_selector="img")
        image_response = requests.get(image.get_attribute("src"))
        assert_equal(_read_test_data("tiny-picture.png", "rb"), image_response.content)


def test_can_set_default_options_with_object():
    with _add_new_post() as add_post_page:
        add_post_page.inject_javascript("window.MAMMOTH_OPTIONS = {styleMap: 'p => h1'};")
        add_post_page.docx_converter.upload(_test_data_path("single-paragraph.docx"))
        assert_equal(add_post_page.docx_converter.read_raw_preview(), "<h1>Walking on imported air</h1>")


def test_can_set_default_options_with_function_returning_object():
    with _add_new_post() as add_post_page:
        javascript = """
            function MAMMOTH_OPTIONS(mammoth) {
                return {
                    transformDocument: mammoth.transforms.paragraph(function(paragraph) {
                        return jQuery.extend({}, paragraph, {styleName: "Heading 1", styleId: "Heading1"});
                    })
                };
            }

            window.MAMMOTH_OPTIONS = MAMMOTH_OPTIONS;
        """
        add_post_page.inject_javascript(javascript)
        add_post_page.docx_converter.upload(_test_data_path("single-paragraph.docx"))
        assert_equal(add_post_page.docx_converter.read_raw_preview(), "<h1>Walking on imported air</h1>")



@contextlib.contextmanager
def _add_new_post():
    with WordPressBrowser.start() as browser:
        browser.login()
        add_post_page = browser.add_new_post()
        try:
            yield add_post_page
        finally:
            add_post_page.trash()


class WordPressBrowser(object):
    @staticmethod
    def start():
        firefox_path = os.environ.get("FIREFOX_BIN")
        if firefox_path is None:
            firefox_binary = None
        else:
            firefox_binary = FirefoxBinary(firefox_path)
        return WordPressBrowser(webdriver.Firefox(firefox_binary=firefox_binary))

    def __init__(self, driver):
        self._driver = driver

    def login(self, username="admin", password="password1"):
        self._get("wp-login.php")
        # Disable auto-focus
        self._driver.execute_script("""
var loginElement = document.getElementById('user_login');
loginElement.focus = function() { };
loginElement.select = function() { };
""")
        self._driver.find_element_by_id("user_login").send_keys("admin")
        self._driver.find_element_by_id("user_pass").send_keys("password1")
        self._driver.find_element_by_id("user_pass").submit()
        # TODO: remove sleep
        time.sleep(1)

    def add_new_post(self):
        self._get("wp-admin/post-new.php")
        # Remove the admin bar, otherwise Selenium keeps accidentally clicking things on it.
        self._driver.execute_script("""
            (function(bar) {
                bar.parentNode.removeChild(bar);
            })(document.getElementById("wpadminbar"));
        """)
        return AddNewPostPage(self._driver)

    def _get(self, path):
        return self._driver.get(self._url(path))

    def _url(self, path):
        return "http://localhost:{0}/{1}".format(_port, path.lstrip("/"))

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self._driver.quit()


class AddNewPostPage(object):
    def __init__(self, driver):
        self._driver = driver

    @property
    def editor(self):
        return ContentEditor(self._driver)

    @property
    def docx_converter(self):
        return DocxConverter(self._driver)

    def trash(self):
        self._scroll_to_top()
        # We have to save the post before we can delete it
        self._driver.find_element_by_id("save-post").click()
        self._driver.find_element_by_css_selector("#delete-action a").click()
        try:
            self._driver.switch_to_alert().accept()
        except NoAlertPresentException:
            pass

    def publish(self):
        self._scroll_to_top()
        self._driver.find_element_by_id("publish").click()

    def view_post(self):
        self._scroll_to_top()
        self._driver.find_element_by_link_text("View post").click()
        return ViewPostPage(self._driver)

    def _scroll_to_top(self):
        # Scroll to top since Selenium might accidentally click on static position toolbar instead
        self._driver.execute_script("window.scrollTo(0, 0);");

    def inject_javascript(self, javascript):
        self._driver.execute_script(javascript);


class DocxConverter(object):
    def __init__(self, driver):
        self._driver = driver

    def upload(self, path):
        absolute_path = os.path.abspath(path)
        upload_element = _wait_for_element_visible(self._driver, id="mammoth-docx-upload")
        upload_element.send_keys(absolute_path)

        _wait_for_element_not_visible(self._driver, id="mammoth-docx-loading")

    def read_raw_preview(self):
        self._select_preview_tab("Raw HTML")
        return self._driver.find_element_by_id("mammoth-docx-raw-preview").text

    def read_visual_preview(self):
        self._select_preview_tab("Visual")
        try:
            self._driver.switch_to_frame(self._driver.find_element_by_id("mammoth-docx-visual-preview"))
            return self._driver.find_element_by_css_selector("body").text
        finally:
            self._driver.switch_to_default_content()

    def _select_preview_tab(self, name):
        preview_element = self._driver.find_element_by_class_name("mammoth-docx-preview")
        preview_element.find_element_by_xpath(".//*[text() = '{0}']".format(name)).click()

    def insert_html(self):
        self._driver.find_element_by_id("mammoth-docx-insert").click()


class ContentEditor(object):
    def __init__(self, driver):
        self._driver = driver

    def select_text_tab(self):
        self._driver.find_element_by_id("content-html").click()
        _wait_for_element_visible(self._driver, id="content")

    def select_visual_tab(self):
        self._driver.find_element_by_id("content-tmce").click()
        _wait_for_element_visible(self._driver, id="wp-content-editor-container")

    def text(self):
        return self._driver.find_element_by_id("content").get_attribute("value")

    def wait_for_text(self, text):
        return WebDriverWait(self._driver, 10).until(lambda driver: text in self.text())


class ViewPostPage(object):
    def __init__(self, driver):
        self._driver = driver

    def find_body_element(self, css_selector):
        body = self._driver.find_element_by_css_selector(".entry-content")
        return body.find_element_by_css_selector(css_selector)


def _test_data_path(path):
    full_path = os.path.join(os.path.dirname(__file__), "test-data", path)
    assert os.path.exists(full_path)
    return full_path


def _read_test_data(path, flags):
    with open(_test_data_path(path), flags) as f:
        return f.read()


def _wait_for_element_visible(driver, id):
    visible = expected_conditions.presence_of_element_located((By.ID, id))
    return WebDriverWait(driver, 10).until(visible)


def _wait_for_element_not_visible(driver, id):
    not_visible = expected_conditions.invisibility_of_element_located((By.ID, id))
    return WebDriverWait(driver, 10).until(not_visible)


def assert_equal(actual, expected):
    assert actual == expected


@pytest.fixture(autouse=True, params=[[], ["ckeditor-for-wordpress"]], scope="module")
def _start_wordpress(request):
    with start_wordpress(plugins=request.param, port=_port):
        yield
