import os

from .util import docker_run, docker_container_mysql_name, mysql_password


def main():
    with docker_run(
        name=docker_container_mysql_name,
        image="mysql",
        env={"MYSQL_ROOT_PASSWORD": mysql_password},
        volumes={os.path.join(os.path.dirname(__file__), "_mysql-data"): "/var/lib/mysql"},
    ):
        input()


if __name__ == "__main__":
    main()
