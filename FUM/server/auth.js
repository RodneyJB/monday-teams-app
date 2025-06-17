const express = require('express');
const axios = require('axios');
const router = express.Router();

const clientId = '53b916a33737930db9de0faa9718b881';
const clientSecret = '78973e7f1274e56626158c1ec3853838';
const redirectUri = 'http://localhost:5000/oauth/callback';

router.get('/login', (req, res) => {
    const url = `https://auth.monday.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}`;
    res.redirect(url);
});

router.get('/oauth/callback', async (req, res) => {
    const { code } = req.query;

    try {
        const tokenRes = await axios.post('https://auth.monday.com/oauth2/token', {
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: redirectUri
        });

        const accessToken = tokenRes.data.access_token;
        // Save token to session, DB, or in-memory for now
        req.session = req.session || {};
        req.session.token = accessToken;

        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('OAuth failed');
    }
});

module.exports = router;
