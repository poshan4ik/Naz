# -*- coding: utf-8 -*-
"""
Локальный сервер для сайта ресторана «Назым».
Отключает кэширование, чтобы браузер всегда показывал свежую версию сайта.

Запуск:  python _server.py     (или двойной клик по файлу)
Открыть: http://localhost:8765/index.html
"""
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = 8765
ROOT = os.path.dirname(os.path.abspath(__file__))


class NoCacheHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        # никогда не отдавать устаревшие копии HTML/CSS/JS/картинок
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # без шума в консоли


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", PORT), NoCacheHandler)
    print("Сайт «Назым» запущен: http://localhost:%d/index.html" % PORT)
    print("Остановить: Ctrl+C")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
