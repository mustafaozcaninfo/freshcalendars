<?xml version="1.0" encoding="UTF-8"?>
<!-- Human-readable view of /news/ sitemaps (browsers only; crawlers ignore it). -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="robots" content="noindex"/>
        <title>Fresh Calendars News sitemap</title>
        <style>
          body{margin:0;font:16px/1.5 system-ui,sans-serif;color:#2e2f2f;background:#fff}
          header{background:#007bff;border-bottom:4px solid #fccc00;color:#fff;padding:1rem}
          h1{font-size:1.25rem;margin:0}
          main{padding:1rem;max-width:1100px;margin:0 auto}
          table{width:100%;border-collapse:collapse;font-size:.9rem}
          th,td{text-align:left;padding:.5rem;border-bottom:1px solid #ddd;vertical-align:top}
          th{background:#e0e0e0}
          a{color:#004a7f;word-break:break-all}
        </style>
      </head>
      <body>
        <header><h1>Fresh Calendars News sitemap</h1></header>
        <main>
          <xsl:choose>
            <xsl:when test="s:sitemapindex">
              <p><xsl:value-of select="count(s:sitemapindex/s:sitemap)"/> sitemaps</p>
              <table>
                <tr><th>Sitemap</th><th>Last modified</th></tr>
                <xsl:for-each select="s:sitemapindex/s:sitemap">
                  <tr><td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td><td><xsl:value-of select="s:lastmod"/></td></tr>
                </xsl:for-each>
              </table>
            </xsl:when>
            <xsl:otherwise>
              <p><xsl:value-of select="count(s:urlset/s:url)"/> URLs</p>
              <table>
                <tr><th>URL</th><th>Title / image</th><th>Date</th></tr>
                <xsl:for-each select="s:urlset/s:url">
                  <tr>
                    <td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td>
                    <td><xsl:value-of select="news:news/news:title"/><xsl:value-of select="image:image/image:title"/></td>
                    <td><xsl:value-of select="news:news/news:publication_date"/><xsl:value-of select="s:lastmod"/></td>
                  </tr>
                </xsl:for-each>
              </table>
            </xsl:otherwise>
          </xsl:choose>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
