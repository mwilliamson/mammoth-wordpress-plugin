import os
import contextlib

from nose.tools import istest, assert_equal
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions


import logging
selenium_logger = logging.getLogger('selenium.webdriver.remote.remote_connection')
selenium_logger.setLevel(logging.WARNING)


@istest
def can_convert_simple_docx_to_html():
    with _add_new_post() as add_post_page:
        add_post_page.docx_converter.upload(_test_data_path("single-paragraph.docx"))
        assert_equal(add_post_page.docx_converter.read_raw_preview(), "<p>Walking on imported air</p>")
        assert_equal(add_post_page.docx_converter.read_visual_preview(), "Walking on imported air")


@istest
def clicking_insert_button_inserts_raw_html_into_text_editor():
    with _add_new_post() as add_post_page:
        add_post_page.editor.select_text_tab()
        
        add_post_page.docx_converter.upload(_test_data_path("single-paragraph.docx"))
        add_post_page.docx_converter.insert_html()
        
        assert_equal(add_post_page.editor.text(), "<p>Walking on imported air</p>")


@istest
def clicking_insert_button_inserts_raw_html_into_visual_editor():
    with _add_new_post() as add_post_page:
        add_post_page.editor.select_visual_tab()
        
        add_post_page.docx_converter.upload(_test_data_path("single-paragraph.docx"))
        add_post_page.docx_converter.insert_html()
        
        add_post_page.editor.select_text_tab()
        # WordPress editor strips <p> tags
        assert_equal(add_post_page.editor.text(), "Walking on imported air")


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
        return WordPressBrowser(webdriver.Firefox())
    
    def __init__(self, driver):
        self._driver = driver
        
    def login(self, username="admin", password="password1"):
        # Set loggedout=true to avoid autofocus
        self._get("wp-login.php?loggedout=true")
        self._driver.find_element_by_id("user_login").send_keys("admin")
        self._driver.find_element_by_id("user_pass").send_keys("password1")
        self._driver.find_element_by_id("wp-submit").click()
    
    def add_new_post(self):
        self._get("wp-admin/post-new.php")
        return AddNewPostPage(self._driver)
    
    def _get(self, path):
        return self._driver.get(self._url(path))
    
    def _url(self, path):
        return "http://localhost:54713/{0}".format(path.lstrip("/"))
        
    def __enter__(self):
        return self
        
    def __exit__(self, *args):
        self._driver.close()


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
        # Scroll to top since Selenium might accidentally click on static position toolbar instead
        self._driver.execute_script("window.scrollTo(0, 0);");
        self._driver.find_element_by_css_selector("#delete-action a").click()


class DocxConverter(object):
    def __init__(self, driver):
        self._driver = driver
        
    def upload(self, path):
        absolute_path = os.path.abspath(path)
        upload_element = _wait_for_element_visible(self._driver, id="mammoth-docx-upload")
        upload_element.send_keys(absolute_path)
        
        _wait_for_element_not_visible(self._driver, id="mammoth-docx-loading")

    def read_raw_preview(self):
        return self._driver.find_element_by_id("mammoth-docx-raw-preview").text

    def read_visual_preview(self):
        return self._driver.find_element_by_id("mammoth-docx-visual-preview").text
        
    def insert_html(self):
        self._driver.find_element_by_id("mammoth-docx-insert").click()


class ContentEditor(object):
    def __init__(self, driver):
        self._driver = driver
        
    def select_text_tab(self):
        # HACK: switch tab in JavaScript since using Selenium opens up the
        # profile page with the pop-up menu in the top-right for some reason
        self._driver.execute_script("document.getElementById('content-html').onclick()");
        _wait_for_element_visible(self._driver, id="content")
        
    def select_visual_tab(self):
        self._driver.find_element_by_id("content-tmce").click()
        _wait_for_element_visible(self._driver, id="wp-content-editor-container")
        
    def text(self):
        return self._driver.find_element_by_id("content").get_attribute("value")


def _test_data_path(path):
    full_path = os.path.join(os.path.dirname(__file__), "test-data", path)
    assert os.path.exists(full_path)
    return full_path


def _wait_for_element_visible(driver, id):
    visible = expected_conditions.presence_of_element_located((By.ID, id))
    return WebDriverWait(driver, 10).until(visible)


def _wait_for_element_not_visible(driver, id):
    not_visible = expected_conditions.invisibility_of_element_located((By.ID, id))
    return WebDriverWait(driver, 10).until(not_visible)
