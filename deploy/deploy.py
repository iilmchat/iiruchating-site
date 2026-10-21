#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
Загрузка лендинга IIRuChating на виртуальный хостинг reg.ru по FTPS.

Учётные данные НЕ хранятся в репозитории — передаются через переменные
окружения или аргументы. После загрузки рекомендуется сменить пароль
FTP в панели хостинга.

Использование (PowerShell):
    $env:REG_FTP_HOST = "server123.hosting.reg.ru"
    $env:REG_FTP_USER = "u3692326"
    $env:REG_FTP_PASS = "пароль"
    $env:REG_FTP_DIR  = "www/iiruchating.ru"
    python deploy\deploy.py

Опционально:
    --host --user --pass --dir --dry-run
"""

import argparse
import ftplib
import os
import sys
from pathlib import Path

# Папки, которые не нужно заливать на сервер.
SKIP_DIRS = {".git", ".github", "node_modules", ".vscode", ".idea", "deploy", ".publish"}
SKIP_FILES = {".DS_Store", "Thumbs.db", ".gitignore", ".gitattributes", "README.md"}

# Служебные файлы, которые на сервере не нужны.
SERVER_SKIP = {".gitignore", ".gitattributes", "README.md", "deploy.py"}


def human(n: float) -> str:
    for unit in ("Б", "КБ", "МБ"):
        if n < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} ГБ"


def local_files(root: Path):
    """Список файлов проекта относительно корня."""
    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(root)
        if any(part in SKIP_DIRS for part in rel.parts):
            continue
        if rel.name in SKIP_FILES or rel.name in SERVER_SKIP:
            continue
        yield rel, path


def connect(host: str, user: str, password: str) -> ftplib.FTP_TLS:
    """Подключение по FTPS (explicit TLS) с fallback на FTP."""
    try:
        ftp = ftplib.FTP_TLS(timeout=60)
        ftp.connect(host, 21)
        ftp.login(user, password)
        ftp.prot_p()
        return ftp
    except (ftplib.error_temp, OSError) as exc:
        print(f"[!] FTPS не удался ({exc}), пробую обычный FTP", file=sys.stderr)
        ftp = ftplib.FTP(timeout=60)
        ftp.connect(host, 21)
        ftp.login(user, password)
        return ftp


def ensure_dir(ftp: ftplib.FTP, path: str) -> None:
    """Создаёт каталог (и родителей), если его нет."""
    cur = ftp.pwd()
    ftp.cwd("/")
    for part in [p for p in path.split("/") if p]:
        try:
            ftp.cwd(part)
        except ftplib.error_perm:
            try:
                ftp.mkd(part)
            except ftplib.error_perm as exc:
                print(f"[!] Не удалось создать каталог {part}: {exc}", file=sys.stderr)
                raise
            ftp.cwd(part)
    ftp.cwd(cur)


def main() -> int:
    parser = argparse.ArgumentParser(description="Загрузка лендинга IIRuChating на хостинг")
    parser.add_argument("--host", default=os.environ.get("REG_FTP_HOST", ""))
    parser.add_argument("--user", default=os.environ.get("REG_FTP_USER", ""))
    parser.add_argument("--pass", dest="password", default=os.environ.get("REG_FTP_PASS", ""))
    parser.add_argument("--dir", default=os.environ.get("REG_FTP_DIR", "www/iiruchating.ru"))
    parser.add_argument("--dry-run", action="store_true", help="только показать список файлов")
    args = parser.parse_args()

    root = Path(__file__).resolve().parent.parent
    files = list(local_files(root))

    print(f"Проект: {root}")
    print(f"Файлов к загрузке: {len(files)}")
    for rel, _ in files:
        print(f"  {rel.as_posix()}")
    print()

    if args.dry_run:
        return 0

    if not args.host or not args.user or not args.password:
        print("[!] Нужны REG_FTP_HOST, REG_FTP_USER и REG_FTP_PASS", file=sys.stderr)
        return 2

    total = sum(path.stat().st_size for _, path in files)
    print(f"Подключаюсь к {args.user}@{args.host} (FTPS)…")

    try:
        ftp = connect(args.host, args.user, args.password)
    except Exception as exc:  # noqa: BLE001
        print(f"[!] Ошибка подключения: {exc}", file=sys.stderr)
        return 1

    try:
        ensure_dir(ftp, args.dir)
        print(f"Каталог {args.dir} готов")

        uploaded = 0
        for rel, path in files:
            remote = f"{args.dir}/{rel.as_posix()}"
            parent = remote.rsplit("/", 1)[0]
            if parent != args.dir:
                ensure_dir(ftp, parent)
            with path.open("rb") as fh:
                ftp.storbinary(f"STOR {remote}", fh)
            uploaded += 1
            print(f"  [OK] {rel.as_posix()}")

        print(f"\nЗагружено {uploaded} файлов ({human(total)}) в {args.dir}")
    except Exception as exc:  # noqa: BLE001
        print(f"[!] Ошибка загрузки: {exc}", file=sys.stderr)
        return 1
    finally:
        try:
            ftp.quit()
        except Exception:  # noqa: BLE001
            try:
                ftp.close()
            except Exception:  # noqa: BLE001
                pass

    print("\nДальше в панели ispmanager:")
    print("  1. Сайты → три точки → SSL-сертификаты → Новый Let's Encrypt")
    print("  2. Почта → Почтовые домены → Создать почтовый домен → iiruchating.ru")
    print("  3. Почта → Создать ящик → hello")
    print("  4. Сайты → три точки → Настройка редиректов → ruchating.ru → https://iiruchating.ru")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
