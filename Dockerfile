# Static site — no build step, just nginx serving files.
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copied explicitly so Dockerfile/README/compose never land in the web root.
# Add new top-level pages here.
WORKDIR /usr/share/nginx/html
COPY index.html about.html pricing.html contact.html robots.txt sitemap.xml ./
COPY css/    ./css/
COPY js/     ./js/
COPY assets/ ./assets/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
