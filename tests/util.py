import contextlib
import subprocess
import time


docker_container_mysql_name = "mammoth-wordpress-plugin-test-mysql"
docker_container_wordpress_name = "mammoth-wordpress-plugin-test-wordpress"
mysql_password = "password1"
    

@contextlib.contextmanager
def docker_run(name, image, env=None, links=None, ports=None, volumes=None):
    if env is None:
        env = {}
    if links is None:
        links = {}
    if ports is None:
        ports = {}
    if volumes is None:
        volumes = {}
        
    command = [
        "docker", "run",
        "--name", name,
        "--rm",
    ] + [
        "-e{}={}".format(key, value)
        for key, value in env.items()
    ] + [
        arg
        for container_name, link_name in links.items()
        for arg in ["--link", "{}:{}".format(container_name, link_name)]
    ] + [
        "-p{}:{}".format(host_port, container_port)
        for host_port, container_port in ports.items()
    ] + [
        "-v{}:{}".format(host_path, container_path)
        for host_path, container_path in volumes.items()
    ] + [image]
    
    process = subprocess.Popen(command)
    try:
        yield
    finally:
        container_id = retry(lambda: subprocess.check_output(["docker", "ps", "-a", "-q", "--filter=name={}".format(name)])).strip()
        subprocess.check_call(["docker", "kill", container_id])
        process.wait()


def retry(func):
    max_tries = 10
    interval = 0.5
    tries = 0
    
    while True:
        tries += 1
        try:
            return func()
        except:
            if tries >= max_tries:
                raise
            else:
                time.sleep(interval)
