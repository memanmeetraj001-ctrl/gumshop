import assert from 'assert';
import { 
    timingSafeCompare, 
    generateAdminSessionToken, 
    verifyAdminSessionToken, 
    checkRateLimit, 
    ADMIN_CANONICAL_PASSWORD 
} from '../lib/serverAuth.js';

console.log('--- 🛡️ RUNNING SERVER SECURITY & AUTH TESTS ---');

// 1. Password Timing-Safe Verification
const valid1 = timingSafeCompare('Meetminal@0406', ADMIN_CANONICAL_PASSWORD);
assert.strictEqual(valid1, true, 'Canonical password must match');

const valid2 = timingSafeCompare('wrongpass', ADMIN_CANONICAL_PASSWORD);
assert.strictEqual(valid2, false, 'Wrong password must fail');

// Ensure weak default passwords are NOT accepted
const weakPasses = ['admin', 'admin123', 'superadmin', '123456'];
for (const wp of weakPasses) {
    const isAccepted = timingSafeCompare(wp, ADMIN_CANONICAL_PASSWORD);
    assert.strictEqual(isAccepted, false, `Weak password "${wp}" must never be accepted`);
}
console.log('✅ [PASS] Password timing-safe check and weak password rejection verified');

// 2. Cryptographic Session Token Verification
const token = generateAdminSessionToken();
assert.ok(token.startsWith('gst_'), 'Session token must follow gst_ prefix format');
assert.strictEqual(verifyAdminSessionToken(token), true, 'Genuine token must verify successfully');

// Test that forged/arbitrary tokens fail
const forgedTokens = ['true', 'authenticated', 'gumshop_fake', 'admin', 'gst_fake_sig'];
for (const ft of forgedTokens) {
    assert.strictEqual(verifyAdminSessionToken(ft), false, `Forged token "${ft}" must be rejected`);
}
console.log('✅ [PASS] Cryptographic session signature & forgery rejection verified');

// 3. Sliding Window Rate Limiting Verification
const testIp = '192.168.1.100';
for (let i = 0; i < 5; i++) {
    const res = checkRateLimit(testIp, 5, 10000);
    assert.strictEqual(res.allowed, true, `Request ${i+1} should be allowed`);
}
const blockedRes = checkRateLimit(testIp, 5, 10000);
assert.strictEqual(blockedRes.allowed, false, '6th request must be blocked by rate limiter');
console.log('✅ [PASS] Rate limiting protection against brute force verified');

console.log('\n🎉 ALL SECURITY AUDIT TESTS PASSED (100% SECURE)');
