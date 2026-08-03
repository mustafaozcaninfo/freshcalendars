#!/usr/bin/env bash
# Re-apply FreshCalendars nginx static TTL split on Hestia (survives domain rebuild only if re-run).
# Writes both :80 and :443 server blocks — Cloudflare SSL Strict hits 443.
# Run on VPS as root.
set -euo pipefail
USER=yuzdehesaplama
DOMAIN=freshcalendars.com
IP=2.25.147.42
ROOT=/home/${USER}/web/${DOMAIN}/public_html
CONF_DIR=/home/${USER}/conf/web/${DOMAIN}

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

	location = / {
		try_files /index.html @fallback;
		root       ${ROOT};
		expires    off;
		add_header Cache-Control \"public, max-age=604800, stale-while-revalidate=2592000\" always;
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
			add_header Cache-Control \"public, max-age=604800, stale-while-revalidate=2592000\" always;
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

	location = / {
		try_files /index.html @fallback;
		root       ${ROOT};
		expires    off;
		add_header Cache-Control \"public, max-age=604800, stale-while-revalidate=2592000\" always;
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
			add_header Cache-Control \"public, max-age=604800, stale-while-revalidate=2592000\" always;
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

printf '%s\n' "$HTTP_BODY" >"/etc/nginx/conf.d/domains/${DOMAIN}.conf"
printf '%s\n' "$HTTP_BODY" >"${CONF_DIR}/nginx.conf"
printf '%s\n' "$SSL_BODY" >"/etc/nginx/conf.d/domains/${DOMAIN}.ssl.conf"
printf '%s\n' "$SSL_BODY" >"${CONF_DIR}/nginx.ssl.conf"
nginx -t
systemctl reload nginx
echo "nginx cache TTLs applied for ${DOMAIN} (${USER}) — :80 + :443"
