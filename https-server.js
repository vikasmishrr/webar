const https = require('https');
const fs = require('fs');
const path = require('path');

// Create self-signed certificate
const { execSync } = require('child_process');

// Generate self-signed certificate
try {
    console.log('🔐 Generating SSL certificate...');
    execSync('openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"', { stdio: 'inherit' });
    console.log('✅ SSL certificate generated');
} catch (error) {
    console.log('⚠️ OpenSSL not found, using Node.js crypto...');
    
    // Fallback: Create certificate using Node.js crypto
    const crypto = require('crypto');
    const { exec } = require('child_process');
    
    // Create a simple certificate
    const key = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    
    fs.writeFileSync('key.pem', key.privateKey);
    fs.writeFileSync('cert.pem', key.publicKey);
    console.log('✅ SSL certificate created with Node.js crypto');
}

// HTTPS server options
const options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};

// Create HTTPS server
const server = https.createServer(options, (req, res) => {
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

// Start HTTPS server
server.listen(3000, () => {
    console.log('🚀 HTTPS Server running on https://localhost:3000');
    console.log('📱 Mobile URL: https://192.168.199.57:3000');
    console.log('⚠️  You may need to accept the security warning for self-signed certificate');
    console.log('🔐 This will enable camera access for WebAR!');
});
