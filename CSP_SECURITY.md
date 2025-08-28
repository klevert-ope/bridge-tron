# Content Security Policy (CSP) Security Improvements

## Overview

This document outlines the Content Security Policy improvements implemented to address security vulnerabilities in the bridge-tron application.

## Issues Resolved

### 1. Removed Unsafe Directives

- **Before**: `script-src 'unsafe-inline' 'unsafe-eval'`
- **After**: Removed unsafe directives, using hash-based CSP instead
- **Security Impact**: Prevents XSS attacks through inline scripts and eval()

### 2. Eliminated Wildcard Directives

- **Before**: `https:`, `data:`, `wss:` wildcards
- **After**: Specific domain allowlists for each directive
- **Security Impact**: Reduces attack surface by limiting allowed sources

### 3. Removed Non-ASCII Characters

- **Before**: Potential malformed policy with special characters
- **After**: Clean, ASCII-only policy strings
- **Security Impact**: Ensures proper CSP parsing and enforcement

### 4. Implemented Hash-Based CSP

- **Before**: Relied on unsafe-inline
- **After**: Using SHA-256 hashes for inline content
- **Security Impact**: Allows legitimate inline content while blocking malicious scripts

## Current CSP Configuration

```nginx
add_header Content-Security-Policy "
    default-src 'self';
    script-src 'self'
        'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='
        'sha256-+6WnXIl4mbFTCARd8NnhCOE6eJEXTTTQTW7y9c6MIhs='
        https://static.cloudflareinsights.com
        https://challenges.cloudflare.com
        https://cdnjs.cloudflare.com
        https://cdn.jsdelivr.net;
    style-src 'self'
        'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='
        https://fonts.googleapis.com
        https://cdnjs.cloudflare.com;
    font-src 'self'
        https://fonts.gstatic.com
        https://cdnjs.cloudflare.com;
    img-src 'self'
        data:
        https://cdnjs.cloudflare.com;
    connect-src 'self'
        https://eth.llamarpc.com
        https://api.trongrid.io
        https://bsc-dataseed1.binance.org
        https://polygon-rpc.com
        https://api.mainnet-beta.solana.com
        https://avalanche.public-rpc.com
        https://arb1.arbitrum.io
        https://mainnet.optimism.io
        https://rpc.ftm.tools
        https://forno.celo.org
        https://mainnet.infura.io
        https://eth-mainnet.alchemyapi.io
        https://api.ethereum.org
        https://api.tron.network
        wss://eth.llamarpc.com
        wss://mainnet.infura.io
        wss://eth-mainnet.alchemyapi.io;
    media-src 'self' blob:;
    frame-ancestors 'self';
    base-uri 'self';
    form-action 'self';
    object-src 'none';
    upgrade-insecure-requests;
" always;
```

## Directive Explanations

### script-src

- **'self'**: Allows scripts from same origin
- **SHA-256 hashes**: Allow specific inline scripts (empty scripts for React)
- **External domains**: Only trusted CDNs and blockchain APIs

### style-src

- **'self'**: Allows styles from same origin
- **SHA-256 hashes**: Allow specific inline styles
- **fonts.googleapis.com**: Google Fonts CSS
- **cdnjs.cloudflare.com**: Trusted CDN

### connect-src

- **'self'**: Same-origin requests
- **Blockchain APIs**: Specific RPC endpoints for supported chains
- **WebSocket endpoints**: For real-time blockchain connections

### Other Directives

- **frame-ancestors 'self'**: Prevents clickjacking
- **object-src 'none'**: Blocks plugins (Flash, Java)
- **base-uri 'self'**: Restricts base tag usage
- **form-action 'self'**: Restricts form submissions

## Blockchain-Specific Considerations

### Supported Networks

- Ethereum (mainnet)
- BSC (Binance Smart Chain)
- Polygon
- Solana
- Avalanche
- Arbitrum
- Optimism
- Fantom
- Celo
- Tron

### RPC Endpoints

All blockchain RPC endpoints are explicitly listed in `connect-src` to ensure:

- No wildcard access to blockchain APIs
- Specific endpoints for each network
- WebSocket support for real-time connections

## Maintenance Guidelines

### Adding New External Resources

1. Identify the resource type (script, style, font, etc.)
2. Add the specific domain to the appropriate directive
3. Test thoroughly in development
4. Update this documentation

### Adding New Blockchain Networks

1. Add the RPC endpoint to `connect-src`
2. Add WebSocket endpoint if needed
3. Test connectivity
4. Update network documentation

### Generating New Hashes

If inline scripts/styles are needed:

```bash
# For inline script
echo -n "script content" | openssl dgst -sha256 -binary | openssl base64 -A

# For inline style
echo -n "style content" | openssl dgst -sha256 -binary | openssl base64 -A
```

### Testing CSP

1. Use browser developer tools to check for CSP violations
2. Monitor nginx error logs for CSP-related issues
3. Test all application functionality after changes
4. Use CSP evaluation tools (e.g., CSP Evaluator)

## Security Benefits

1. **XSS Protection**: Blocks malicious inline scripts
2. **Code Injection Prevention**: No eval() or unsafe-eval
3. **Resource Control**: Limits external resource loading
4. **Clickjacking Protection**: frame-ancestors directive
5. **Plugin Security**: object-src 'none'
6. **Form Security**: form-action restriction

## Monitoring

### CSP Violation Monitoring

Monitor browser console and nginx logs for CSP violations:

```bash
# Check nginx error logs
tail -f /var/log/nginx/error.log | grep -i csp

# Check browser console for CSP violations
# Look for: "Refused to execute inline script because it violates the following Content Security Policy directive"
```

### Regular Security Audits

1. Review CSP policy quarterly
2. Remove unused external domains
3. Update hashes if inline content changes
4. Test with security scanning tools

## Troubleshooting

### Common Issues

1. **Blocked inline scripts**: Add SHA-256 hash or move to external file
2. **Blocked external resources**: Add domain to appropriate directive
3. **WebSocket connections**: Ensure WSS endpoints are in connect-src
4. **Font loading issues**: Check font-src directive

### Development vs Production

- Development may require additional domains for hot reloading
- Production should use minimal, specific allowlists
- Test both environments thoroughly

## References

- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [CSP Hash Generator](https://report-uri.com/home/hash)
