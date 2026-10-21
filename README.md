# Лендинг IIRuChating — iiruchating.ru

Статический одностраничный сайт компании и бренда **IIRuChating**.
Основной продукт в линейке — **AI Ru Chating** (корпоративный мессенджер с локальным
AI-ассистентом).

Собран на чистом HTML/CSS/JS: без сборщиков, фреймворков и внешних CDN.
Шрифты и графика лежат внутри репозитория — сайт полностью автономен.

---

## Структура

```
.
├── index.html                  # главная (единственная страница)
├── 404.html                    # страница «не найдено»
├── robots.txt
├── sitemap.xml
├── .htaccess                   # Apache: 404, gzip, кэш, заголовки
└── assets/
    ├── css/
    │   ├── styles.css          # вёрстка лендинга
    │   ├── theme-m3.css        # роли Material 3 из брендбука (не редактировать)
    │   └── fonts.css           # @font-face, self-hosted (не редактировать)
    ├── js/main.js              # тема, навигация, появление блоков, форма
    ├── fonts/*.woff2           # Inter, Manrope, Montserrat (latin + cyrillic)
    └── img/                    # логотипы, favicon, PWA-манифест из брендкита
```

`assets/css/theme-m3.css`, `assets/css/fonts.css` и `assets/img/` — копии из
[`iilmchat/ai-brand`](https://github.com/iilmchat/ai-brand) (брендбук v1.1).
При обновлении брендкита копируйте их заново и не редактируйте руками.

---

## Локальный просмотр

```bash
cd IIRuChating
python -m http.server 8099
# открыть http://127.0.0.1:8099/
```

Можно открыть `index.html` и напрямую — сборка не требуется.

---

## Публикация на reg.ru

### Вариант 1. Виртуальный хостинг (рекомендуется для старта)

1. Оформить домены `iiruchating.ru`, `ai-ru-chating.ru`, `ruchating.ru` в reg.ru.
   Обязательное условие для зоны `.ru` — хостинг в российском дата-центре,
   его даёт тот же reg.ru.
2. Загрузить содержимое папки в `www/iiruchating.ru` (или корень домена).
   Через панель: **Хостинг → Домены и серверы → Файловый менеджер**, либо по FTP/SFTP.
3. `.htaccess` положить в корень сайта — он уже отдаёт `404.html`, включает gzip
   и ставит правильные заголовки кэширования.
4. В панели хостинга включить перенаправление `www.iiruchating.ru` → `iiruchating.ru`.

### Вариант 2. VPS / облако reg.ru

```nginx
server {
    listen 80;
    server_name iiruchating.ru www.iiruchating.ru;
    root /var/www/iiruchating;
    index index.html;

    error_page 404 /404.html;

    location ~* \.(css|js|woff2|png|svg|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ /\. { deny all; }
}

server {
    listen 443 ssl http2;
    server_name iiruchating.ru www.iiruchating.ru;
    # ssl_certificate     /etc/letsencrypt/live/iiruchating.ru/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/iiruchating.ru/privkey.pem;
    root /var/www/iiruchating;
    index index.html;
    error_page 404 /404.html;
}
```

Бесплатный сертификат: **reg.ru → Домены → SSL-сертификат → Let's Encrypt**
(выпускается автоматически, продлевается по cron).

### DNS-записи

| Домен | Тип | Значение | Назначение |
|-------|-----|----------|------------|
| `iiruchating.ru` | A | IP хостинга | основной сайт |
| `www.iiruchating.ru` | A | IP хостинга | редирект на основной |
| `ai-ru-chating.ru` | A | IP хостинга | сайт продукта |
| `ruchating.ru` | A | IP хостинга | короткий алиас → редирект на `iiruchating.ru` |

После смены IP хостинга обновлять A-записи не нужно, если NS делегированы на reg.ru.

### Редиректы

`ruchating.ru` → `iiruchating.ru` и `www.*` → без `www` настраиваются
на уровне панели reg.ru (раздел **Домены → Редиректы**), либо в `.htaccess`:

```apache
Redirect 301 / https://iiruchating.ru/
```

---

## Что менять при доработке

| Задача | Файл |
|--------|------|
| Тексты, разделы, порядок блоков | `index.html` |
| Цвета отступы, сетка | `assets/css/styles.css` |
| Цвета бренда (primary/tertiary) | `assets/css/theme-m3.css` — только если меняется брендбук |
| Логотип/иконки | `assets/img/` — файлы из `ai-brand` |
| Почта в форме и контактах | `index.html` (`hello@iiruchating.ru`) + `assets/js/main.js` |
| Тексты в подвале, мета-теги | `index.html` |

**Форма заявки** сейчас формирует письмо через `mailto:` — бэкенд не нужен.
Если захотите принимать заявки напрямую с сайта, замените блок отправки
в `assets/js/main.js` на `fetch()` к вашему обработчику (reg.ru: «Скрипты» / PHP).

---

## Правила бренда, которые соблюдены

- Логотип только чёрный на светлом и белый на тёмном; инверсия через `filter: invert(1)`
  для `<img>` (брендбук, раздел 10.1).
- Полный логотип — не меньше 120 px по ширине (в шапке 132 px), иконка — не меньше 16 px.
- Цвета компонентов заданы ролями Material 3 (`--md-sys-color-*`), а не «голыми» HEX.
- Шрифты — Inter / Manrope / Montserrat, self-hosted, с кириллицей.
- Контраст «фон — текст» проверен: Lighthouse Accessibility 100 в светлой и тёмной темах.

Обновление брендкита: скопировать новые файлы из `ai-brand` в `assets/` (см. `INSTALL.md` брендкита).
