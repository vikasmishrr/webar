const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Create a simple HTTP server that redirects to HTTPS
const httpServer = http.createServer((req, res) => {
    res.writeHead(301, {
        'Location': `https://localhost:8000${req.url}`
    });
    res.end();
});

// Create HTTPS server with self-signed certificate
const httpsOptions = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};

const httpsServer = https.createServer(httpsOptions, (req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './index.html';
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Start HTTP server on port 8000
httpServer.listen(8000, () => {
    console.log('HTTP Server running on http://localhost:8000');
    console.log('Redirecting to HTTPS...');
});

// Start HTTPS server on port 8001
httpsServer.listen(8001, () => {
    console.log('HTTPS Server running on https://localhost:8001');
    console.log('Access your WebAR app at: https://localhost:8001');
});
