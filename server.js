
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const filePath = path.join(__dirname, 'index.html');

    if (!fs.existsSync(filePath)) {
      res.writeHead(500);
      res.end('index.html missing');
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8'
    });

    res.end(fs.readFileSync(filePath));
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  if (req.method === 'POST' && req.url === '/api/analyze') {
    if (!apiKey) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }));
      return;
    }

    let body = '';

    req.on('data', chunk => body += chunk);

    req.on('end', async () => {
      try {
        const input = JSON.parse(body);

        const response = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            input: JSON.stringify(input)
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'AI request failed');
        }

        const analysis = data.output
          ?.flatMap(item => item.content || [])
          ?.filter(item => item.type === 'output_text')
          ?.map(item => item.text)
          ?.join('\n') || 'No analysis generated';

        res.writeHead(200, {
          'Content-Type': 'application/json'
        });

        res.end(JSON.stringify({ analysis }));
      } catch (error) {
        res.writeHead(500, {
          'Content-Type': 'application/json'
        });

        res.end(JSON.stringify({ error: error.message }));
      }
    });

    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Expansion Intelligence running on port ${PORT}`);
});
