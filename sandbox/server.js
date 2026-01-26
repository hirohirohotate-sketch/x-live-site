const http = require('http');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Load env vars manually from .env.local
try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/"/g, '');
        }
    });
} catch (e) {
    console.error('Error loading .env.local:', e.message);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const server = http.createServer(async (req, res) => {
    const reqUrl = url.parse(req.url, true);
    const { pathname, query } = reqUrl;

    if (pathname === '/') {
        // Generate OAuth URL
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'x',
            options: {
                redirectTo: 'http://localhost:3000/auth/callback',
            },
        });

        if (error) {
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<h1>Error generating URL</h1><pre>${JSON.stringify(error, null, 2)}</pre>`);
            return;
        }

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
            <h1>Sandbox Auth Test</h1>
            <p>Click below to test the X authentication flow.</p>
            <a href="${data.url}" style="font-size: 20px; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 5px;">Login with X</a>
            <p>Generated URL: <br><code style="word-break: break-all;">${data.url}</code></p>
        `);
    } else if (pathname === '/auth/callback') {
        const code = query.code;
        const error = query.error;

        if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<h1>Auth Error</h1><p>${error}</p><p>${query.error_description || ''}</p>`);
            return;
        }

        if (code) {
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

            if (exchangeError) {
                res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`<h1>Exchange Error</h1><pre>${JSON.stringify(exchangeError, null, 2)}</pre>`);
                return;
            }

            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
                <h1>Success!</h1>
                <p>Logged in as user ID: <strong>${data.user.id}</strong></p>
                <p>Email: ${data.user.email}</p>
                <pre>${JSON.stringify(data.session, null, 2)}</pre>
                <br>
                <a href="/">Go Back</a>
            `);
        } else {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('No code provided');
        }
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(3000, () => {
    console.log('Sandbox server running at http://localhost:3000');
});
