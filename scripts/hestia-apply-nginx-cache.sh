#!/usr/bin/env bash
# Re-apply FreshCalendars nginx static TTL split on Hestia (survives domain rebuild only if re-run).
# Writes both :80 and :443 server blocks — Cloudflare SSL Strict hits 443.
# Run on VPS as root.
# HTML: browsers keep a page 5 minutes (so a redesign or a fix reaches returning visitors fast);
# Cloudflare keeps it 31 days via CDN-Cache-Control, and every deploy purges it.
set -euo pipefail
USER=yuzdehesaplama
DOMAIN=freshcalendars.com
IP=2.25.147.42
ROOT=/home/${USER}/web/${DOMAIN}/public_html
CONF_DIR=/home/${USER}/conf/web/${DOMAIN}

NEWS_LOCATION="
	# /news/ (apps/news): served straight from disk; short TTLs, immutable hashed assets.
	location ^~ /news/ {
		root           ${ROOT};
		index          index.html;
		absolute_redirect off;
		try_files      \$uri \$uri/index.html \$uri/ =404;
		error_page     404 /news/404.html;
		access_log     /var/log/apache2/domains/${DOMAIN}.log combined;
		access_log     /var/log/apache2/domains/${DOMAIN}.bytes bytes;
		expires        off;
		add_header Cache-Control \"public, max-age=300, stale-while-revalidate=600\" always;
		add_header CDN-Cache-Control \"public, max-age=600\" always;

		location ~ /\\. {
			deny all;
			return 404;
		}

		location ^~ /news/_astro/ {
			root       ${ROOT};
			expires    off;
			add_header Cache-Control \"public, max-age=31536000, immutable\" always;
		}

		# Printables: cache for a day in browsers and a month at the edge (deploys purge changed
		# files); each PDF names its story as canonical (map: /etc/nginx/conf.d/freshcalendars-pdf-map.conf).
		location ^~ /news/downloads/ {
			root       ${ROOT};
			expires    off;
			add_header Cache-Control \"public, max-age=86400, stale-while-revalidate=604800\" always;
			add_header CDN-Cache-Control \"public, max-age=2592000\" always;
			add_header Link \$fc_pdf_canonical always;
		}

		location ~* \\.xsl\$ {
			root         ${ROOT};
			default_type text/xsl;
			expires      off;
			add_header Cache-Control \"public, max-age=86400\" always;
		}
	}
"

HTTP_BODY="#=========================================================================#
# FreshCalendars custom proxy cache TTLs (monthly SSG) — :80
#=========================================================================#

server {
	listen      ${IP}:80;
	server_name ${DOMAIN} www.${DOMAIN};
	error_log   /var/log/apache2/domains/${DOMAIN}.error.log error;

	include ${CONF_DIR}/nginx.forcessl.conf*;

	location ~ /\\.(?!well-known\\/|file) {
		deny all;
		return 404;
	}

	# Removed or renamed /news/ URLs (apps/news/redirects.map); empty for every other path.
	if (\$fc_news_redirect) { return 301 \$fc_news_redirect; }

${NEWS_LOCATION}
	location = / {
		try_files /index.html @fallback;
		root       ${ROOT};
		expires    off;
		add_header Cache-Control \"public, max-age=300, stale-while-revalidate=3600\" always;
		add_header CDN-Cache-Control \"public, max-age=2678400\" always;
	}

	location / {
		proxy_pass http://${IP}:8080;

		location ~* \\.(html|htm)\$ {
			try_files  \$uri @fallback;
			root       ${ROOT};
			access_log /var/log/apache2/domains/${DOMAIN}.log combined;
			access_log /var/log/apache2/domains/${DOMAIN}.bytes bytes;
			expires    off;
			add_header Cache-Control \"public, max-age=300, stale-while-revalidate=3600\" always;
			add_header CDN-Cache-Control \"public, max-age=2678400\" always;
		}

		location ~* \\.(woff2|woff|ttf|otf|eot)\$ {
			try_files  \$uri @fallback;
			root       ${ROOT};
			expires    off;
			add_header Cache-Control \"public, max-age=31536000, immutable\" always;
		}

		location ~* ^.+\\.(jpg|jpeg|gif|png|ico|svg|css|zip|tgz|gz|rar|bz2|doc|xls|exe|pdf|ppt|txt|odt|ods|odp|odf|tar|wav|bmp|rtf|js|mp3|avi|mpeg|flv|webp)\$ {
			try_files  \$uri @fallback;
			root       ${ROOT};
			access_log /var/log/apache2/domains/${DOMAIN}.log combined;
			access_log /var/log/apache2/domains/${DOMAIN}.bytes bytes;
			expires    off;
			add_header Cache-Control \"public, max-age=2592000, stale-while-revalidate=604800\" always;
		}
	}

	location @fallback {
		proxy_pass http://${IP}:8080;
	}

	location /error/ {
		alias /home/${USER}/web/${DOMAIN}/document_errors/;
	}

	include ${CONF_DIR}/nginx.conf_*;
}
"

SSL_BODY="#=========================================================================#
# FreshCalendars custom proxy cache TTLs (monthly SSG) — :443
#=========================================================================#

server {
	listen      ${IP}:443 ssl;
	server_name ${DOMAIN} www.${DOMAIN};
	error_log   /var/log/apache2/domains/${DOMAIN}.error.log error;

	ssl_certificate     ${CONF_DIR}/ssl/${DOMAIN}.pem;
	ssl_certificate_key ${CONF_DIR}/ssl/${DOMAIN}.key;

	# TLS 1.3 0-RTT anti-replay
	if (\$anti_replay = 307) { return 307 https://\$host\$request_uri; }
	if (\$anti_replay = 425) { return 425; }

	include ${CONF_DIR}/nginx.hsts.conf*;

	location ~ /\\.(?!well-known\\/|file) {
		deny all;
		return 404;
	}

	# Removed or renamed /news/ URLs (apps/news/redirects.map); empty for every other path.
	if (\$fc_news_redirect) { return 301 \$fc_news_redirect; }

${NEWS_LOCATION}
	location = / {
		try_files /index.html @fallback;
		root       ${ROOT};
		expires    off;
		add_header Cache-Control \"public, max-age=300, stale-while-revalidate=3600\" always;
		add_header CDN-Cache-Control \"public, max-age=2678400\" always;
	}

	location / {
		proxy_ssl_server_name on;
		proxy_ssl_name \$host;
		proxy_pass https://${IP}:8443;

		location ~* \\.(html|htm)\$ {
			try_files  \$uri @fallback;
			root       ${ROOT};
			access_log /var/log/apache2/domains/${DOMAIN}.log combined;
			access_log /var/log/apache2/domains/${DOMAIN}.bytes bytes;
			expires    off;
			add_header Cache-Control \"public, max-age=300, stale-while-revalidate=3600\" always;
			add_header CDN-Cache-Control \"public, max-age=2678400\" always;
		}

		location ~* \\.(woff2|woff|ttf|otf|eot)\$ {
			try_files  \$uri @fallback;
			root       ${ROOT};
			expires    off;
			add_header Cache-Control \"public, max-age=31536000, immutable\" always;
		}

		location ~* ^.+\\.(jpg|jpeg|gif|png|ico|svg|css|zip|tgz|gz|rar|bz2|doc|xls|exe|pdf|ppt|txt|odt|ods|odp|odf|tar|wav|bmp|rtf|js|mp3|avi|mpeg|flv|webp)\$ {
			try_files  \$uri @fallback;
			root       ${ROOT};
			access_log /var/log/apache2/domains/${DOMAIN}.log combined;
			access_log /var/log/apache2/domains/${DOMAIN}.bytes bytes;
			expires    off;
			add_header Cache-Control \"public, max-age=2592000, stale-while-revalidate=604800\" always;
		}
	}

	location @fallback {
		proxy_ssl_server_name on;
		proxy_ssl_name \$host;
		proxy_pass https://${IP}:8443;
	}

	location /error/ {
		alias /home/${USER}/web/${DOMAIN}/document_errors/;
	}

	proxy_hide_header Upgrade;

	include ${CONF_DIR}/nginx.ssl.conf_*;
}
"

# PDF path -> canonical Link header, at http level so both server blocks can use it. The map file
# is written by scripts/news-publish.sh from the /news/ build (dist/news-data/pdf-canonical.map).
PDF_MAP=/etc/nginx/freshcalendars/pdf-canonical.map
mkdir -p "$(dirname "$PDF_MAP")"
[[ -f "$PDF_MAP" ]] || : >"$PDF_MAP"
printf 'map $uri $fc_pdf_canonical {\n\tdefault "";\n\tinclude %s;\n}\n' "$PDF_MAP" >/etc/nginx/conf.d/freshcalendars-pdf-map.conf
# Old /news/ path -> new path for the 301 in both server blocks; installed by news-publish.sh from
# apps/news/redirects.map.
REDIRECT_MAP=/etc/nginx/freshcalendars/news-redirects.map
[[ -f "$REDIRECT_MAP" ]] || : >"$REDIRECT_MAP"
printf 'map $uri $fc_news_redirect {\n\tdefault "";\n\tinclude %s;\n}\n' "$REDIRECT_MAP" >/etc/nginx/conf.d/freshcalendars-news-redirects.conf

printf '%s\n' "$HTTP_BODY" >"/etc/nginx/conf.d/domains/${DOMAIN}.conf"
printf '%s\n' "$HTTP_BODY" >"${CONF_DIR}/nginx.conf"
printf '%s\n' "$SSL_BODY" >"/etc/nginx/conf.d/domains/${DOMAIN}.ssl.conf"
printf '%s\n' "$SSL_BODY" >"${CONF_DIR}/nginx.ssl.conf"
nginx -t
systemctl reload nginx
echo "nginx cache TTLs applied for ${DOMAIN} (${USER}) — :80 + :443"
