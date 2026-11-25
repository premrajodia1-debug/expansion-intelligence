import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

function send(res, status, payload, contentType = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': contentType });
  res.end(typeof payload === 'string' ? payload : JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Homepage
  if ((req.method === 'GET' || req.method === 'HEAD') &&
      (url.pathname === '/' || url.pathname === '/index.html')) {
    const filePath = path.join(__dirname, 'index.html');

    if (!fs.existsSync(filePath)) {
      return send(res, 500, 'index.html missing', 'text/plain; charset=utf-8');
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

    if (req.method === 'HEAD') {
      return res.end();
    }

    return res.end(fs.readFileSync(filePath));
  }

  // Health check
  if (req.method === 'GET' && url.pathname === '/health') {
    return send(res, 200, 'OK', 'text/plain; charset=utf-8');
  }

  // AI Market Analysis
  if (req.method === 'POST' && url.pathname === '/api/analyze') {
    if (!apiKey) {
      return send(res, 500, {
        error: 'OPENAI_API_KEY is not configured in Render.'
      });
    }

    let body = '';

    req.on('data', chunk => {
      body += chunk;

      if (body.length > 1_000_000) {
        req.destroy();
      }
    });

    req.on('end', async () => {
      try {
        const input = JSON.parse(body);

        const prompt = `
You are a senior international market-entry consultant.

Analyze the following business and market-entry information:
${JSON.stringify(input, null, 2)}

Provide a structured, professional market-entry assessment covering:
1. Executive recommendation
2. Target market attractiveness
3. Customer and demand considerations
4. Competitor landscape
5. Pricing strategy
6. Distribution strategy
7. Localization recommendations
8. Regulatory and operational risks
9. Recommended market-entry mode
10. A practical 90-day action plan

Be specific, clear, realistic, and professional.
Clearly distinguish assumptions from verified facts.
Do not invent live statistics, sources, or citations.
`;

        const response = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            input: prompt
          })
        });

        const data = await response.json();

        if (!response.ok) {
          return send(res, response.status, {
            error: data.error?.message || 'AI request failed'
          });
        }

        const analysis = data.output
          ?.flatMap(item => item.content || [])
          ?.filter(item => item.type === 'output_text')
          ?.map(item => item.text)
          ?.join('\n') || 'No analysis generated.';

        return send(res, 200, { analysis });
      } catch (error) {
        return send(res, 500, {
          error: error.message || 'Server error during analysis'
        });
      }
    });

    return;
  }

  // Unknown route
  return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
});

server.listen(PORT, () => {
  console.log(`Expansion Intelligence running on port ${PORT}`);
});
