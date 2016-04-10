#!/usr/bin/env python3

import argparse
import subprocess
import os
import sys
import errno
import hashlib
import contextlib

os.chdir(os.path.dirname(os.path.realpath(sys.argv[0])))

_apr_version = "1.5.2"
_apr_util_version = "1.5.4"
_pcre_version = "10.21"
_httpd_version = "2.4.18"
_php_version = "5.6.20"
_libxml_version = "2.9.3"
_libmcrypt_version = "2.5.8"
_wordpress_version = "4.4.2"

_httpd_src_dir = "httpd-{}".format(_httpd_version)

_install_dir = os.path.realpath("_wordpress")
_wordpress_dir = os.path.join(_install_dir, "wordpress")
_pcre_dir = os.path.join(_install_dir, "pcre")
_libxml_dir = os.path.join(_install_dir, "libxml2")
_libmcrypt_dir = os.path.join(_install_dir, "libmcrypt")

_wordpress_database_name = "wp_mammoth"
_wordpress_database_username = "wp_mammoth"
_wordpress_database_password = "password1"
_wordpress_port = 54713

def main():
    args = _parse_args()
    downloads = _download_files()
    
    if os.path.exists("_build"):
        print("_build already exists, aborting")
        exit(1)
    if os.path.exists(_install_dir):
        print("{} already exists, aborting".format(_install_dir))
        exit(1)
    _mkdir_p("_build")
    os.chdir("_build")
    
    _build_httpd(downloads)
    _build_php(downloads)
    _build_wordpress(downloads)


def _build_httpd(downloads):
    _build_pcre(downloads)
    _untar_apache2_src(downloads)
    
    with cd(_httpd_src_dir):
        subprocess.check_call([
            "./configure",
            "--with-pcre=".format(_pcre_dir),
            "--prefix={}".format(_install_dir),
            "--enable-so",
            "--with-mpm=prefork",
        ])
    
        subprocess.check_call(["make"])
        subprocess.check_call(["make", "install"])


def _build_pcre(downloads):
    subprocess.check_call(["tar", "xzf", downloads["pcre2"]])
    with cd("pcre2-{}".format(_pcre_version)):
        subprocess.check_call(["./configure", "--prefix={}".format(_pcre_dir)])
        subprocess.check_call(["make"])
        subprocess.check_call(["make", "install"])


def _untar_apache2_src(downloads):
    subprocess.check_call(["tar", "xzf", downloads["httpd"]])
    
    apr_src_dir = os.path.join(_httpd_src_dir, "srclib/apr")
    _mkdir_p(apr_src_dir)
    subprocess.check_call(["tar", "xzf", downloads["apr"], "--directory", apr_src_dir, "--strip-components", "1"])
    
    apr_util_src_dir = os.path.join(_httpd_src_dir, "srclib/apr-util")
    _mkdir_p(apr_util_src_dir)
    subprocess.check_call(["tar", "xzf", downloads["apr-util"], "--directory", apr_util_src_dir, "--strip-components", "1"])


def _build_php(downloads):
    _build_libxml(downloads)
    _build_libmcrypt(downloads)
    
    subprocess.check_call(["tar", "xzf", downloads["php5"]])
    
    with cd("php-{}".format(_php_version)):
        subprocess.check_call([
            "./configure",
            "--prefix={}".format(_install_dir),
            "--with-apxs2={}/bin/apxs".format(_install_dir),
            "--with-libxml-dir={}".format(_libxml_dir),
            "--with-mysql=mysqlnd",
            "--with-mcrypt={}".format(_libmcrypt_dir),
            "--with-openssl",
            "--with-zlib",
        ])
        subprocess.check_call(["make"])
        subprocess.check_call(["make", "install"])
        subprocess.check_call(["cp", "php.ini-production", os.path.join(_install_dir, "lib/php.ini")])
    
    with open(os.path.join(_install_dir, "conf/httpd.conf"), "a") as httpd_conf:
        httpd_conf.write("""<FilesMatch \.php$>
    SetHandler application/x-httpd-php
</FilesMatch>""")


def _build_libxml(downloads):
    subprocess.check_call(["tar", "xzf", downloads["libxml2"]])
    with cd("libxml2-{}".format(_libxml_version)):
        subprocess.check_call([
            "./configure",
            "--prefix={}".format(_libxml_dir),
            "--without-python",
        ])
        subprocess.check_call(["make"])
        subprocess.check_call(["make", "install"])


def _build_libmcrypt(downloads):
    subprocess.check_call(["tar", "xzf", downloads["libmcrypt"]])
    with cd("libmcrypt-{}".format(_libmcrypt_version)):
        subprocess.check_call(["./configure", "--prefix={}".format(_libmcrypt_dir)])
        subprocess.check_call(["make"])
        subprocess.check_call(["make", "install"])


def _build_wordpress(downloads):
    _mkdir_p(_wordpress_dir)
    subprocess.check_call([
        "tar", "xzf", downloads["wordpress"],
        "--directory", _wordpress_dir,
        "--strip-components", "1",
    ])
    
    wp = _build_wp_cli(downloads)
    
    subprocess.check_call([
        wp, "core", "config",
        "--dbname={}".format(_wordpress_database_name),
        "--dbuser={}".format(_wordpress_database_username),
        "--dbpass={}".format(_wordpress_database_password),
        "--dbhost=127.0.0.1",
    ])
    
    subprocess.check_call([
        "sed", "-i", "s!{}/htdocs!{}!g".format(_install_dir, _wordpress_dir),
        "{}/conf/httpd.conf".format(_install_dir),
    ])
    subprocess.check_call([
        "sed", "-i", "s!Listen 80!Listen {}!g".format(_wordpress_port),
        "{}/conf/httpd.conf".format(_install_dir),
    ])
    subprocess.check_call([
        "sed", "-i", "s!DirectoryIndex index.html!DirectoryIndex index.php index.html!g",
        "{}/conf/httpd.conf".format(_install_dir),
    ])
    
    if subprocess.call([wp, "core", "is-installed"]) != 0:
        subprocess.check_call([
            wp, "core", "install",
            "--url=http://localhost:{}/".format(_wordpress_port),
            "--title='Development WordPress site'",
            "--admin_user=admin",
            "--admin_email=admin@example.com",
            "--admin_password=password1",
        ])
    
    subprocess.check_call([
        "mysql",
        "-u{}".format(_wordpress_database_username),
        "-p{}".format(_wordpress_database_password),
        _wordpress_database_name,
        "--execute", "UPDATE wp_options SET option_value='http://localhost:{}/' WHERE option_name in ('home', 'siteurl')".format(_wordpress_port)
    ])


def _build_wp_cli(downloads):
    wp_cli_dir = os.path.join(_install_dir, "wp-cli")
    _mkdir_p(wp_cli_dir)
    
    subprocess.check_call(["cp", downloads["wp-cli"], os.path.join(wp_cli_dir, "wp-cli.phar")])
    
    wp_path = os.path.join(_install_dir, "bin/wp")
    with open(wp_path, "w") as wp:
        wp.write("#!/usr/bin/env sh\n")
        wp.write("exec '{}/bin/php' '{}/wp-cli.phar' --path='{}' \"$@\"\n".format(_install_dir, wp_cli_dir, _wordpress_dir))
    subprocess.check_call(["chmod", "+x", wp_path])
    
    return wp_path


def _parse_args():
    parser = argparse.ArgumentParser()
    return parser.parse_args()


def _download_files():
    _files = [
        (
            "apr",
            "http://mirror.ox.ac.uk/sites/rsync.apache.org//apr/apr-{}.tar.gz".format(_apr_version),
            "1af06e1720a58851d90694a984af18355b65bb0d047be03ec7d659c746d6dbdb"),
        (
            "apr-util",
            "http://mirror.ox.ac.uk/sites/rsync.apache.org//apr/apr-util-{}.tar.gz".format(_apr_util_version),
            "976a12a59bc286d634a21d7be0841cc74289ea9077aa1af46be19d1a6e844c19"),
        (
            "pcre2",
            "ftp://ftp.csx.cam.ac.uk/pub/software/programming/pcre/pcre2-{}.tar.gz".format(_pcre_version),
            "1cfd43caffe07fe7f2cfafc74c8f0d87b38d80bbb63226a1193407476508e317"),
        (
            "httpd",
            "http://mirror.ox.ac.uk/sites/rsync.apache.org//httpd/httpd-{}.tar.gz".format(_httpd_version),
            "1c39b55108223ba197cae2d0bb81c180e4db19e23d177fba5910785de1ac5527"),
        (
            "php5",
            "http://php.net/get/php-{}.tar.gz/from/this/mirror".format(_php_version),
            "9a7ec6e1080ee93dcbe7df3e49ea1c3c3da5fc2258aff763f39ab3786baf8d56"),
        (
            "libxml2",
            "ftp://xmlsoft.org/libxml2/libxml2-{}.tar.gz".format(_libxml_version),
            "4de9e31f46b44d34871c22f54bfc54398ef124d6f7cafb1f4a5958fbcd3ba12d"),
        (
            "libmcrypt",
            "http://downloads.sourceforge.net/project/mcrypt/Libmcrypt/{0}/libmcrypt-{0}.tar.gz".format(_libmcrypt_version),
            "e4eb6c074bbab168ac47b947c195ff8cef9d51a211cdd18ca9c9ef34d27a373e"),
        (
            "wordpress",
            "https://wordpress.org/wordpress-{}.tar.gz".format(_wordpress_version),
            "c8a74c0f7cfc0d19989d235759e70cebd90f42aa0513bd9bc344230b0f79e08b"),
        (
            "wp-cli",
            "https://github.com/wp-cli/wp-cli/releases/download/v0.23.0/wp-cli-0.23.0.phar",
            "72aad2b1a8b5cee0d39f1ad02b6a3c2f1c8fa8a04daead5b6c319afff092cd37")
    ]
    
    downloads = {}

    for key, url, expected_sha256sum in _files:
        downloads_path = "_downloads"
        destination = os.path.join(downloads_path, url.split("/")[-1])
        print("Downloading {} to {}".format(url, destination))
        _mkdir_p(downloads_path)
        if os.path.exists(destination):
            print("Destination already exists, skipping download")
        else:
            subprocess.check_call(["curl", url, "--output", destination, "--location", "--fail"])
        actual_sha256sum = _sha256(destination)
        if actual_sha256sum != expected_sha256sum:
            print("Expected sha256: {}\nbut was: {}".format(expected_sha256sum, actual_sha256sum))
            exit(1)
        print()
        downloads[key] = os.path.realpath(destination)
    
    return downloads


def _sha256(path):
    hash_sha256 = hashlib.sha256()
    with open(path, "rb") as fileobj:
        for chunk in iter(lambda: fileobj.read(4096), b""):
            hash_sha256.update(chunk)
    return hash_sha256.hexdigest()


def _mkdir_p(path):
    try:
        os.makedirs(path)
    except OSError as error:
        if not (error.errno == errno.EEXIST and os.path.isdir(path)):
            raise


@contextlib.contextmanager
def cd(path):
    original_cwd = os.getcwd()
    try:
        os.chdir(path)
        yield
    finally:
        os.chdir(original_cwd)


if __name__ == "__main__":
    main()
