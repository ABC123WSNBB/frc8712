"""Start the planet locally and open it in the default browser."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser


class LocalServer(ThreadingHTTPServer):
    allow_reuse_address = False


def create_server(port=8765):
    handler = partial(SimpleHTTPRequestHandler, directory=str(Path(__file__).parent))
    try:
        return LocalServer(("127.0.0.1", port), handler)
    except OSError as exc:
        if exc.errno != 10048 and exc.errno != 98:
            raise
        return LocalServer(("127.0.0.1", 0), handler)


if __name__ == "__main__":
    with create_server() as server:
        url = f"http://127.0.0.1:{server.server_port}/"
        print(f"My Universe: {url}\nKeep this window open. Press Ctrl+C to stop.", flush=True)
        webbrowser.open(url)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
