# Security Configuration Documentation

## Overview

This document outlines the security enhancements implemented in the nginx configuration for the bridge-tron application.

## Security Improvements Implemented

### 1. HTTPS Enforcement

- **HTTP to HTTPS Redirect**: All HTTP traffic is automatically redirected to HTTPS
- **HSTS Headers**: Strict Transport Security enabled with 1-year max-age
- **SSL Configuration**: Prepared SSL certificate configuration (requires actual certificates)

### 2. Enhanced Rate Limiting

- **General Traffic**: 30 requests/second with 50 burst
- **Static Assets**: 100 requests/second with 200 burst
- **API Endpoints**: 10 requests/second with 20 burst
- **Login Attempts**: 1 request/second with burst protection

### 3. Security Headers

- **Content Security Policy**: Comprehensive CSP with blockchain RPC compatibility
- **X-Frame-Options**: SAMEORIGIN to prevent clickjacking
- **X-Content-Type-Options**: nosniff to prevent MIME type sniffing
- **X-XSS-Protection**: Enabled with block mode
- **Referrer Policy**: no-referrer for maximum privacy
- **Permissions Policy**: Restricted access to sensitive browser APIs
- **IP Protection Headers**: All IP-related headers removed/cleared

### 4. Request Security

- **Client Timeouts**: 10-second timeouts for body, header, and send operations
- **Buffer Limits**: Configured to prevent buffer overflow attacks
- **Request Size Limits**: 10MB maximum body size
- **IP Anonymization**: All client IPs are anonymized in logs and headers

### 5. File Access Restrictions

- **Hidden Files**: Blocked access to all hidden files and directories
- **Configuration Files**: Blocked access to .conf, .config, .ini, .log files
- **Backup Files**: Blocked access to .bak, .backup, .old, .tmp files
- **Executable Files**: Blocked access to .exe, .dll, .so, .bin files
- **Source Files**: Blocked access to .php, .asp, .jsp, .py files

### 6. Attack Vector Protection

- **Directory Traversal**: Blocked ../ and encoded variants
- **Script Injection**: Blocked common script injection patterns
- **Common Exploits**: Blocked eval, system, exec, and other dangerous functions
- **Malicious Requests**: Blocked common attack patterns

### 7. Docker Security Enhancements

- **Non-root User**: nginx runs as non-root user (UID 1001)
- **Alpine Base**: Using lightweight Alpine Linux for smaller attack surface
- **Security Updates**: Automatic security updates during build
- **Health Checks**: Container health monitoring
- **Minimal Packages**: Only essential packages installed

## SSL Certificate Setup

To enable HTTPS, you need to:

1. **Obtain SSL Certificates**:

   ```bash
   # Using Let's Encrypt (recommended)
   certbot certonly --webroot -w /usr/share/nginx/html -d your-domain.com
   ```

2. **Update nginx.conf**:

   ```nginx
   ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
   ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
   ```

3. **Uncomment SSL Configuration** in nginx.conf

## Monitoring and Logging

### Access Logs

- **General Access**: Standard nginx access logs (IP addresses anonymized)
- **Blockchain Access**: Special logging for blockchain-related requests (IP addresses anonymized)
- **Security Events**: Failed requests and blocked access attempts (IP addresses anonymized)

### Security Monitoring

- Monitor rate limiting violations (IP-agnostic)
- Track blocked file access attempts (IP-agnostic)
- Monitor SSL certificate expiration
- Review blockchain access patterns (IP-agnostic)
- Monitor for IP header leakage attempts

## Rate Limiting Configuration

| Zone    | Rate Limit | Burst | Purpose                         | Privacy Note                 |
| ------- | ---------- | ----- | ------------------------------- | ---------------------------- |
| general | 30 r/s     | 50    | General web traffic             | Based on request URI, not IP |
| static  | 100 r/s    | 200   | Static assets (JS, CSS, images) | Based on request URI, not IP |
| api     | 10 r/s     | 20    | API endpoints                   | Based on request URI, not IP |
| login   | 1 r/s      | 5     | Login attempts                  | Based on request URI, not IP |

## Content Security Policy

The CSP is configured to allow:

- **Scripts**: Self-hosted + blockchain RPC endpoints
- **Styles**: Self-hosted + inline styles
- **Fonts**: Self-hosted + CDN fonts
- **Images**: Self-hosted + data URIs
- **Connections**: Blockchain RPC endpoints + WebSocket connections

## Privacy Protection

### IP Address Protection

- **Log Anonymization**: All IP addresses are replaced with "0.0.0.0" in logs
- **Header Removal**: All IP-related headers are cleared or removed
- **Rate Limiting**: Based on request URI instead of IP addresses
- **No Referrer**: Referrer policy set to "no-referrer" for maximum privacy

### Protected Headers

- X-Forwarded-For
- X-Real-IP
- X-Client-IP
- True-Client-IP
- CF-Connecting-IP
- X-Forwarded-Proto
- X-Forwarded-Host
- X-Forwarded-Port

## Security Checklist

- [x] HTTPS enforcement
- [x] Security headers
- [x] Rate limiting
- [x] File access restrictions
- [x] Attack vector protection
- [x] Non-root container user
- [x] Health checks
- [ ] SSL certificates (requires manual setup)
- [ ] Monitoring setup (requires external tools)
- [ ] Backup strategy (requires implementation)

## Maintenance

### Regular Tasks

1. **SSL Certificate Renewal**: Set up automatic renewal for Let's Encrypt certificates
2. **Security Updates**: Regularly update nginx and Alpine packages
3. **Log Rotation**: Configure log rotation to prevent disk space issues
4. **Monitoring**: Set up alerts for security events

### Security Audits

1. **Configuration Review**: Monthly review of nginx configuration
2. **Access Log Analysis**: Weekly analysis of access patterns
3. **Vulnerability Scanning**: Regular security scans
4. **Penetration Testing**: Annual security testing

## Emergency Procedures

### If Compromised

1. **Immediate Actions**:

   - Stop the container
   - Preserve logs for analysis
   - Check for unauthorized access
   - Review recent changes

2. **Recovery Steps**:

   - Update all passwords and keys
   - Review and update security configuration
   - Restore from clean backup
   - Monitor for further attacks

3. **Post-Incident**:
   - Document the incident
   - Update security measures
   - Review access controls
   - Implement additional monitoring
