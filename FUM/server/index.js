const express = require('express');
const session = require('express-session');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 5000;

// Monday.com OAuth credentials
const clientId = '53b916a33737930db9de0faa9718b881';
const clientSecret = '78973e7f1274e56626158c1ec3853838';
const redirectUri = 'http://localhost:5000/oauth/callback';

// Middleware
app.use(session({
    secret: 'your_secret',
    resave: false,
    saveUninitialized: true
}));

// OAuth login
app.get('/login', (req, res) => {
    const url = `https://auth.monday.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}`;
    res.redirect(url);
});

// OAuth callback
app.get('/oauth/callback', async (req, res) => {
    const { code } = req.query;

    try {
        const tokenRes = await axios.post('https://auth.monday.com/oauth2/token', {
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: redirectUri
        });

        const accessToken = tokenRes.data.access_token;

        req.session.token = accessToken;
        console.log("✅ Access token saved:", accessToken);

        res.redirect('/');
    } catch (err) {
        console.error("❌ OAuth error:", err.response?.data || err.message);
        res.status(500).send('OAuth failed');
    }
});

// Main route: show current user info
app.get('/', async (req, res) => {
    const token = req.session?.token;
    if (!token) return res.redirect('/login');

    try {
        console.log("🔐 Using token:", token);

        const query = {
            query: `query {
                me {
                    id
                    name
                    email
                    location
                }
            }`
        };

        const response = await axios.post(
            'https://api.monday.com/v2',
            query,
            {
                headers: {
                    Authorization: token,
                    'Content-Type': 'application/json'
                }
            }
        );

        const user = response.data.data.me;

        res.send(`
            <html>
                <head>
                <meta name="viewport" content="width=375, initial-scale=1">
                <style>
                    body {
                    max-width: 375px;
                    margin: auto;
                    font-family: sans-serif;
                    background: #f9f9f9;
                    padding: 16px;
                    }
                    h1, p {
                    margin-bottom: 12px;
                    }
                </style>
                <title>User Info</title>
                </head>
                <body>
                <h1>${user.name}</h1>
                <p>ID: ${user.id}</p>
                <p>Email: ${user.email}</p>
                <p>Location: ${user.location || 'Not set'}</p>
                </body>
            </html>
            `);



    } catch (err) {
        console.error("❌ Error fetching user info:", err.response?.data || err.message);
        res.status(500).send('Token exists, but failed to get user info');
    }
});

// Static files after routes
app.use(express.static(path.join(__dirname, '../public')));

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
