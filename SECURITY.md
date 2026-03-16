# Eyedance Security Policy

Diese Dokumentation beschreibt alle implementierten Sicherheitsmaßnahmen für maximale Sicherheit der Web-App und mobilen Version.

## 🔒 Content Security Policy (CSP)

### Meta-Tag (index.html)
```
default-src 'self';
script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;
style-src 'self' 'unsafe-inline';
font-src 'self' data:;
img-src 'self' data: blob:;
connect-src 'self' https://cdnjs.cloudflare.com;
worker-src 'self' blob:;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
require-trusted-types-for 'script';
trusted-types default;
```

### HTTP Headers (vercel.json)
- **Strict-Transport-Security**: HSTS mit 2 Jahren max-age
- **X-Frame-Options**: DENY (Clickjacking-Schutz)
- **X-Content-Type-Options**: nosniff (MIME sniffing verhindern)
- **Referrer-Policy**: strict-origin-when-cross-origin
- **X-DNS-Prefetch-Control**: on

## 🛡️ XSS-Schutz

### Input Sanitization (fileParser.ts)
- Null-Byte Entfernung (`\x00`)
- Control Character Filterung (C0 und C1)
- HTML Tag Entfernung (`<script>`, `<style>`, alle Tags)
- Gefährliche URL-Schemes entfernen:
  - `javascript:`
  - `data:text/html`
  - `vbscript:`
- Event Handler Attribute entfernen (`on*`)
- Maximale Textlänge: 500KB (DoS-Schutz)

### Text Cleaning (textCleaner.ts)
- HTML/Markdown Tag Entfernung
- Spezialzeichen Bereinigung
- Unicode-Normalisierung (NFC)

## 📁 File Upload Security

### Validierung (fileParser.ts)
- **Maximale Dateigröße**: 10MB
- **Erlaubte Typen**: PDF, DOC, DOCX, PPT, PPTX, TXT
- **MIME-Type Validierung**: Whitelist-basiert
- **Extension Validierung**: Doppelte Prüfung
- **Path Traversal Schutz**: Verhindert `..`, `/`, `\` in Dateinamen
- **Leere Dateien**: Werden abgelehnt

### Datei-Parser
- **PDF.js**: Client-seitig, keine Server-Uploads
- **Mammoth**: DOCX/DOC Parsing
- **JSZip**: PPTX Extraktion
- Alle Parser laufen lokal im Browser

## 🌐 Service Worker Security (sw.js)

### Same-Origin Policy
- Nur same-origin Requests werden gecached
- Externe Requests (CDN) werden durchgeleitet ohne Caching
- Cache-Poisoning Schutz

### Cache-Management
- Versionierter Cache (eyedance-v2)
- Alte Caches werden beim Activate gelöscht
- SW-Update sofort ohne Wartezeit

## 📱 PWA / Mobile Security

### Manifest (manifest.json)
- `display: standalone` - Keine Browser-UI
- Eigene Sicherheitskontext
- Keine Cross-Origin Einbettung

### Berechtigungen (Permissions-Policy)
Alle nicht benötigten Features sind deaktiviert:
- ❌ Kamera, Mikrofon, Geolocation
- ❌ USB, HID, Serial
- ❌ Payment, Web Share
- ✅ Nur Fullscreen erlaubt (für den Reader)

## 🏗️ Build Security

### Vite Config
- **sourcemap: false**: Keine Source Maps in Production
- **Manual Chunks**: Code-Splitting für bessere Cache-Kontrolle
- **Target**: ES2020 (moderne Browser, weniger Polyfills)

### Dependencies
- Keine unnötigen externen Requests
- PDF.js vom CDN mit Subresource Integrity (SRI) empfohlen
- Alle anderen Ressourcen sind self-hosted

## 🚨 Sicherheitshinweise für Entwickler

### Neue Features implementieren
1. **Input immer validieren**: `validateFile()` für Dateien, `sanitizeText()` für Text
2. **Keine `dangerouslySetInnerHTML`**: React's XSS-Schutz beibehalten
3. **CSP beachten**: Keine inline Scripts ohne Nonce
4. **Externe URLs**: Nur HTTPS, im Idealfall selbst hosten

### Code Review Checkliste
- [ ] Werden Benutzereingaben validiert?
- [ ] Gibt es XSS-Risiken durch HTML-Rendering?
- [ ] Werden Dateiuploads auf Typ/Größe geprüft?
- [ ] Sind neue externen Requests HTTPS?
- [ ] Werden Secrets/Keys im Client exposed?

## 🔐 HTTPS & Transport Security

### HSTS (HTTP Strict Transport Security)
- **max-age**: 63072000 Sekunden (2 Jahre)
- **includeSubDomains**: Ja
- **preload**: Ja (für Browser-Preload-Liste)

### Upgrade-Insecure-Requests
Alle HTTP-Requests werden automatisch zu HTTPS upgraded.

## 📊 Security Headers Übersicht

| Header | Wert | Zweck |
|--------|------|-------|
| CSP | siehe oben | Content Restriktion |
| X-Frame-Options | DENY | Clickjacking-Schutz |
| X-Content-Type-Options | nosniff | MIME Sniffing verhindern |
| Referrer-Policy | strict-origin-when-cross-origin | Privacy |
| Permissions-Policy | Features deaktiviert | Feature-Policy |
| HSTS | max-age=63072000 | HTTPS Enforcen |

## 🔍 Sicherheitsprüfungen

### Automatisierte Tools empfohlen
1. **Mozilla Observatory**: https://observatory.mozilla.org/
2. **Security Headers**: https://securityheaders.com/
3. **Snyk**: Dependency Vulnerability Scanning

### Manuelle Tests
- CSP Bypass versuchen
- File Upload mit bösartigen Dateien
- XSS-Payloads in Text-Eingabe
- Path Traversal in Dateinamen

## 🆘 Incident Response

Bei Sicherheitsvorfällen:
1. Sofortiges Deaktivieren betroffener Features
2. Analyse des Angriffsvektors
3. Patch entwickeln und testen
4. Deployment über Vercel (sofort verfügbar)
5. Dokumentation des Vorfalls

---

**Letzte Aktualisierung**: 2026-03-16
**Verantwortlich**: Eyedance Dev Team
