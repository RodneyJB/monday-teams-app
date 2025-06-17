const express = require('express');
const session = require('express-session');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 5000;

const clientId = '53b916a33737930db9de0faa9718b881';
const clientSecret = '78973e7f1274e56626158c1ec3853838';
const redirectUri = 'https://monday-teams-app.onrender.com/oauth/callback';

app.use(session({
  secret: 'your_secret',
  resave: false,
  saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, '../public')));

app.get('/login', (req, res) => {
  const url = `https://auth.monday.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&state=teams`;
  res.redirect(url);
});

app.get('/auth-popup', (req, res) => {
  const url = `https://auth.monday.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&state=teams`;
  res.send(`
    <script>
      window.location.href = "${url}";
    </script>
  `);
});

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

    res.send(`
      <script>
        window.opener.microsoftTeams.authentication.notifySuccess('success');
        window.close();
      </script>
    `);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.send(`
      <script>
        window.opener.microsoftTeams.authentication.notifyFailure("OAuth error");
        window.close();
      </script>
    `);
  }
});

app.get('/privacy', (req, res) => {
  res.send('<h1>Privacy Policy</h1><p>This is a placeholder page.</p>');
});

app.get('/terms', (req, res) => {
  res.send('<h1>Terms of Use</h1><p>This is a placeholder page.</p>');
});

app.get('/', async (req, res) => {
  const token = req.session?.token;
  if (!token) {
    return res.sendFile(path.join(__dirname, '../public/index.html'));
  }

  try {
    const query = {
      query: `query { me { name email time_zone_identifier } }`
    };

    const response = await axios.post('https://api.monday.com/v2', query, {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json'
      }
    });

    const user = response.data.data.me;
    res.send(`
      <h1>Welcome, ${user.name}</h1>
      <p>Email: ${user.email}</p>
      <p>Timezone: ${user.time_zone_identifier}</p>
    `);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('Token exists, but failed to get user info');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
