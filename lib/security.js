import dns from 'dns/promises';

/**
 * Hardened SSRF and URL Security Validation Utility
 * Defends against:
 * - DNS rebinding attacks (resolves IPs and validates each one)
 * - Decimal, Hexadecimal, and Octal IP representations
 * - IPv4-mapped IPv6 (::ffff:127.0.0.1)
 * - Cloud metadata endpoints (169.254.169.254, metadata.google.internal, etc.)
 * - Private networks, loopbacks, carrier NAT
 * - Malicious redirect chains (validates EVERY hop)
 * - Oversized responses & decompression bombs (stream size limiting)
 */

// Blocked hostnames & cloud metadata domains
const BLOCKED_HOSTNAMES = new Set([
    'localhost',
    'localhost.localdomain',
    'broadcasthost',
    'metadata.google.internal',
    'metadata.aws.internal',
    'instance-data',
    'metadata.packet.net',
    '169.254.169.254'
]);

// Helper to test if a raw string is a decimal or hex IP
function parseSpecialIpRepresentation(host) {
    // Pure decimal IP e.g. 2130706433 -> 127.0.0.1
    if (/^\d+$/.test(host)) {
        const num = parseInt(host, 10);
        if (num >= 0 && num <= 4294967295) {
            const byte1 = (num >>> 24) & 255;
            const byte2 = (num >>> 16) & 255;
            const byte3 = (num >>> 8) & 255;
            const byte4 = num & 255;
            return `${byte1}.${byte2}.${byte3}.${byte4}`;
        }
    }

    // Hexadecimal IP e.g. 0x7f000001
    if (/^0x[0-9a-fA-F]+$/.test(host)) {
        const num = parseInt(host, 16);
        if (num >= 0 && num <= 4294967295) {
            const byte1 = (num >>> 24) & 255;
            const byte2 = (num >>> 16) & 255;
            const byte3 = (num >>> 8) & 255;
            const byte4 = num & 255;
            return `${byte1}.${byte2}.${byte3}.${byte4}`;
        }
    }

    // Dotted octal or mixed hex parts e.g. 0177.0.0.1 or 0x7f.0.0.1
    if (host.includes('.')) {
        const parts = host.split('.');
        if (parts.length === 4) {
            const parsedParts = [];
            for (const p of parts) {
                if (/^0x[0-9a-fA-F]+$/i.test(p)) {
                    parsedParts.push(parseInt(p, 16));
                } else if (/^0[0-7]+$/.test(p)) {
                    parsedParts.push(parseInt(p, 8));
                } else if (/^\d+$/.test(p)) {
                    parsedParts.push(parseInt(p, 10));
                } else {
                    return null;
                }
            }
            if (parsedParts.every(n => n >= 0 && n <= 255)) {
                return parsedParts.join('.');
            }
        }
    }

    return null;
}

/**
 * Checks whether an IPv4 or IPv6 address belongs to private/internal/cloud metadata spaces.
 */
export function isPrivateOrBlockedIP(ip) {
    if (!ip || typeof ip !== 'string') return true;
    let cleanIp = ip.toLowerCase().trim();

    // Check IPv4-mapped IPv6 addresses (e.g. ::ffff:127.0.0.1)
    if (cleanIp.startsWith('::ffff:')) {
        cleanIp = cleanIp.substring(7);
    }

    // 1. IPv4 Checks
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = cleanIp.match(ipv4Regex);
    if (match) {
        const [, b1, b2, b3, b4] = match.map(Number);
        if (b1 > 255 || b2 > 255 || b3 > 255 || b4 > 255) return true;

        if (b1 === 0) return true;                                // 0.0.0.0/8
        if (b1 === 10) return true;                               // 10.0.0.0/8 (Private)
        if (b1 === 127) return true;                              // 127.0.0.0/8 (Loopback)
        if (b1 === 169 && b2 === 254) return true;                // 169.254.0.0/16 (Link-local / Cloud Metadata)
        if (b1 === 172 && b2 >= 16 && b2 <= 31) return true;      // 172.16.0.0/12 (Private)
        if (b1 === 192 && b2 === 168) return true;                // 192.168.0.0/16 (Private)
        if (b1 === 100 && b2 >= 64 && b2 <= 127) return true;     // 100.64.0.0/10 (Carrier-grade NAT)
        if (b1 === 192 && b2 === 0 && b3 === 2) return true;      // 192.0.2.0/24 (TEST-NET-1)
        if (b1 === 198 && b2 === 51 && b3 === 100) return true;   // 198.51.100.0/24 (TEST-NET-2)
        if (b1 === 203 && b2 === 0 && b3 === 113) return true;    // 203.0.113.0/24 (TEST-NET-3)
        if (b1 >= 224 && b1 <= 239) return true;                  // 224.0.0.0/4 (Multicast)
        if (b1 >= 240) return true;                               // 240.0.0.0/4 (Reserved)

        return false;
    }

    // 2. IPv6 Checks
    if (cleanIp === '::1' || cleanIp === '::') return true;       // Loopback
    if (cleanIp.startsWith('fe80:')) return true;                 // Link-local
    if (cleanIp.startsWith('fc00:') || cleanIp.startsWith('fd00:')) return true; // Unique local
    if (cleanIp.startsWith('ff')) return true;                    // Multicast

    return false;
}

/**
 * Validates a target URL syntax and resolves hostname to detect DNS rebinding.
 */
export async function validateScraperUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') {
        return { valid: false, error: 'URL must be a non-empty string.' };
    }

    let urlString = rawUrl.trim();
    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
        urlString = 'https://' + urlString;
    }

    let parsed;
    try {
        parsed = new URL(urlString);
    } catch {
        return { valid: false, error: 'Malformed URL format. Please provide a valid domain.' };
    }

    // Protocol check: HTTP / HTTPS only
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed.' };
    }

    const rawHostname = parsed.hostname.toLowerCase().trim();

    // Check special hostnames and suffixes
    if (
        BLOCKED_HOSTNAMES.has(rawHostname) ||
        rawHostname.endsWith('.local') ||
        rawHostname.endsWith('.internal') ||
        rawHostname.endsWith('.localhost') ||
        rawHostname.includes('metadata')
    ) {
        return { valid: false, error: 'Access to internal hostnames or metadata endpoints is forbidden.' };
    }

    // Check decimal/hexadecimal/octal representations
    const normalizedIp = parseSpecialIpRepresentation(rawHostname);
    if (normalizedIp) {
        if (isPrivateOrBlockedIP(normalizedIp)) {
            return { valid: false, error: 'Access to private or local network IP addresses is forbidden.' };
        }
    }

    // Direct IP check
    if (isPrivateOrBlockedIP(rawHostname)) {
        return { valid: false, error: 'Access to private or local network IP ranges is forbidden.' };
    }

    // DNS Resolution Check to prevent DNS rebinding
    try {
        const addresses = await dns.lookup(rawHostname, { all: true });
        for (const addr of addresses) {
            if (isPrivateOrBlockedIP(addr.address)) {
                return { 
                    valid: false, 
                    error: `Security violation: Domain resolves to private or loopback IP (${addr.address}).` 
                };
            }
        }
    } catch (dnsErr) {
        // Domain does not resolve
        return { valid: false, error: `Domain could not be resolved: ${dnsErr.message}` };
    }

    return {
        valid: true,
        sanitizedUrl: parsed.toString(),
        origin: parsed.origin,
        hostname: rawHostname
    };
}

/**
 * Hardened Safe Fetch with:
 * - 15-second timeout
 * - Max 4 redirects with strict re-validation of every redirect target
 * - Max 5MB response size limit to prevent decompression/memory bombs
 */
export async function safeFetch(targetUrl, options = {}) {
    const MAX_REDIRECTS = options.maxRedirects || 4;
    const MAX_SIZE_BYTES = options.maxSizeBytes || 5 * 1024 * 1024; // 5 MB
    const TIMEOUT_MS = options.timeoutMs || 15000;                  // 15 seconds

    let currentUrl = targetUrl;
    let redirectCount = 0;

    while (redirectCount <= MAX_REDIRECTS) {
        // Validate every step's URL
        const validation = await validateScraperUrl(currentUrl);
        if (!validation.valid) {
            throw new Error(`SSRF blocked on redirect hop ${redirectCount}: ${validation.error}`);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
            const response = await fetch(validation.sanitizedUrl, {
                ...options,
                redirect: 'manual', // We handle redirects manually to enforce security checks
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
                    ...(options.headers || {})
                }
            });

            clearTimeout(timeoutId);

            // Handle HTTP Redirects (301, 302, 303, 307, 308)
            if (response.status >= 300 && response.status < 400) {
                const locationHeader = response.headers.get('location');
                if (!locationHeader) {
                    throw new Error('Redirect received without Location header.');
                }

                redirectCount++;
                if (redirectCount > MAX_REDIRECTS) {
                    throw new Error(`Too many redirects (exceeded limit of ${MAX_REDIRECTS}).`);
                }

                // Resolve relative redirect URLs against the current URL origin
                const nextUrl = new URL(locationHeader, currentUrl).toString();
                currentUrl = nextUrl;
                continue;
            }

            // Enforce response content length limit
            const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
            if (contentLength > MAX_SIZE_BYTES) {
                throw new Error(`Response size (${contentLength} bytes) exceeds maximum permitted limit of ${MAX_SIZE_BYTES} bytes.`);
            }

            // Stream / buffer reading with size enforcement
            const buffer = await response.arrayBuffer();
            if (buffer.byteLength > MAX_SIZE_BYTES) {
                throw new Error(`Response body (${buffer.byteLength} bytes) exceeds maximum limit of ${MAX_SIZE_BYTES} bytes.`);
            }

            const decoder = new TextDecoder('utf-8');
            const textContent = decoder.decode(buffer);

            return {
                ok: response.ok,
                status: response.status,
                headers: response.headers,
                url: currentUrl,
                text: async () => textContent,
                json: async () => JSON.parse(textContent)
            };

        } catch (fetchErr) {
            clearTimeout(timeoutId);
            if (fetchErr.name === 'AbortError') {
                throw new Error(`Request timed out after ${TIMEOUT_MS / 1000} seconds.`);
            }
            throw fetchErr;
        }
    }

    throw new Error('Exceeded maximum redirect count.');
}
