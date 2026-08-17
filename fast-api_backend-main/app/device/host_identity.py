import os
import socket
import uuid
from typing import Any


def _primary_ipv4() -> str:
    try:
        probe = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        probe.connect(("8.8.8.8", 80))
        ip = probe.getsockname()[0]
        probe.close()
        if ip and not ip.startswith("127."):
            return ip
    except OSError:
        pass

    try:
        ip = socket.gethostbyname(socket.gethostname())
        if ip and not ip.startswith("127."):
            return ip
    except OSError:
        pass

    return "127.0.0.1"


def _mac_address() -> str:
    node = uuid.getnode()
    raw = f"{node:012x}"
    mac = ":".join(raw[i : i + 2] for i in range(0, 12, 2)).upper()
    if mac == "00:00:00:00:00:00":
        return ""
    return mac


def get_host_identity() -> dict[str, Any]:
    hostname = socket.gethostname() or os.uname().nodename
    ip = _primary_ipv4()
    mac = _mac_address()
    device_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, hostname))

    return {
        "device_id": device_id,
        "device_name": hostname,
        "ip": ip,
        "device_role": "standalone",
        "status": "Active",
        "serial_no": "",
        "mac_id": mac,
    }
