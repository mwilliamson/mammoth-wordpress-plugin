import contextlib
import os
import subprocess
import time

from .util import docker_run, docker_container_wordpress_name, docker_container_mysql_name, wordpress_port


@contextlib.contextmanager
def start_wordpress(port, plugins=None):
    if plugins is None:
        plugins = []

    with docker_run(
        name=docker_container_wordpress_name,
        image="mammoth-wordpress-plugin",
        ports={port: 80},
        links={docker_container_mysql_name: "mysql"},
    ):
        time.sleep(2)

        _wp([
            "core", "install",
            "--url=http://localhost:{}/".format(port),
            "--title='Development WordPress site'",
            "--admin_user=admin",
            "--admin_email=admin@example.com",
            "--admin_password=password1",
        ])
        _wp(["plugin", "deactivate", "--all"])
        _wp(["plugin", "uninstall", "--all"])
        plugin_src = os.path.join(os.path.dirname(__file__), "../mammoth-docx-converter")
        subprocess.check_call([
            "docker", "cp", plugin_src, "{}:/var/www/html/wp-content/plugins/mammoth-docx-converter".format(docker_container_wordpress_name),
        ])
        for plugin in plugins:
            _wp(["plugin", "install", plugin])
            _wp(["plugin", "activate", plugin])
        _wp(["plugin", "activate", "mammoth-docx-converter"])

        time.sleep(2)

        yield


def _wp(command):
    subprocess.check_call([
        "docker", "exec", docker_container_wordpress_name,
        "wp",
    ] + command + ["--allow-root"])


def main():
    with start_wordpress(port=wordpress_port):
        input()


if __name__ == "__main__":
    main()
