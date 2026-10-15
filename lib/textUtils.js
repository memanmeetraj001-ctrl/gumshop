/**
 * lib/textUtils.js
 * High-performance, zero-dependency HTML entity decoding and text sanitation.
 * Adheres strictly to the Ponytail Senior Mindset (clean, minimal, standard library regex).
 */

export function decodeHtmlEntities(str) {
    if (!str || typeof str !== 'string') return str || '';
    return str
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&#x27;/gi, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#8216;/g, "‘")
        .replace(/&#8217;/g, "’")
        .replace(/&#8220;/g, "“")
        .replace(/&#8221;/g, "”")
        .replace(/&#8211;/g, "–")
        .replace(/&#8212;/g, "—")
        .replace(/&#(\d+);/g, (match, dec) => {
            try {
                return String.fromCharCode(parseInt(dec, 10));
            } catch {
                return match;
            }
        })
        .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
            try {
                return String.fromCharCode(parseInt(hex, 16));
            } catch {
                return match;
            }
        });
}

export function cleanText(str) {
    if (!str || typeof str !== 'string') return str || '';
    return decodeHtmlEntities(str.replace(/<[^>]*>?/gm, ' ')).replace(/\s+/g, ' ').trim();
}
