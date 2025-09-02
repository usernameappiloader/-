const http = require('http');
const fs = require('fs');
const path = require('path');
const webpush = require('web-push');

// VAPID keys for push notifications
const vapidKeys = {
    publicKey: 'BCR28-Abwp4-w1crpUCEHzvyBWD2tZhjL_D0Q5_Ti-EtwNFKnsiPcMWU8m2hZI53YKqyr6sRHNvtgX_RCB4yWfo',
    privateKey: '9IaHLxpGOPu9qWRFnsUdNnWuWDuq4GwqushXzOi2z5I'
};

webpush.setVapidDetails(
    'mailto:admin@mr-dev-tech.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

// Store subscriptions in memory (in production, use database)
let subscriptions = [];

const server = http.createServer((req, res) => {
    // Handle API endpoints
    if (req.url.startsWith('/api/')) {
        handleAPI(req, res);
        return;
    }

    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

    // Handle directory requests
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }

    // Check if file exists
    if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath);
        const contentType = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml'
        }[ext] || 'text/plain';

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading file');
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(data);
            }
        });
    } else {
        res.writeHead(404);
        res.end('File not found');
    }
});

// Handle API requests
function handleAPI(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url === '/api/subscribe' && req.method === 'POST') {
        handleSubscribe(req, res);
    } else if (req.url === '/api/notify' && req.method === 'POST') {
        handleNotify(req, res);
    } else if (req.url === '/api/vapid-public-key' && req.method === 'GET') {
        handleVapidPublicKey(req, res);
    } else {
        res.writeHead(404);
        res.end('API endpoint not found');
    }
}

// Handle subscription
function handleSubscribe(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        try {
            const subscription = JSON.parse(body);
            // Check if subscription already exists
            const exists = subscriptions.find(sub =>
                sub.endpoint === subscription.endpoint
            );
            if (!exists) {
                subscriptions.push(subscription);
                console.log('New subscription added:', subscriptions.length);
            }
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        } catch (error) {
            console.error('Error parsing subscription:', error);
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid subscription data' }));
        }
    });
}

// Handle notification trigger
function handleNotify(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            const title = data.title || 'Nouvelle application disponible!';
            const message = data.message || 'Une nouvelle application a été ajoutée à MR.DEV-TECH';

            // Send notification to all subscribers
            const promises = subscriptions.map(subscription => {
                return webpush.sendNotification(subscription, JSON.stringify({
                    title: title,
                    body: message,
                    icon: '/images/icon.png',
                    badge: '/images/icon.png',
                    data: {
                        url: data.url || '/'
                    }
                })).catch(error => {
                    console.error('Error sending notification:', error);
                    // Remove invalid subscriptions
                    subscriptions = subscriptions.filter(sub => sub !== subscription);
                });
            });

            Promise.all(promises).then(() => {
                console.log(`Notifications sent to ${promises.length} subscribers`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, sent: promises.length }));
            });
        } catch (error) {
            console.error('Error sending notifications:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Failed to send notifications' }));
        }
    });
}

// Handle VAPID public key request
function handleVapidPublicKey(req, res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ publicKey: vapidKeys.publicKey }));
}

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Push notification server ready');
});
