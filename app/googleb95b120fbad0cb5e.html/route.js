export async function GET() {
    return new Response('google-site-verification: googleb95b120fbad0cb5e.html', {
        status: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=3600'
        }
    });
}
