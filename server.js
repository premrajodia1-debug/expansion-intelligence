
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
  if ((req.method === 'GET' || req.method === 'HEAD') &&
      (req.url === '/' || req.url === '/index.html')) {
    const filePath = path.join(__dirname, 'index.html');

    if (!fs.existsSync(filePath)) {
      return send(res, 500, 'index.html missing', 'text/plain; charset=utf-8');
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

    if (req.method === 'HEAD') return res.end();

    return res.end(fs.readFileSync(filePath));
  }

  if (req.method === 'GET' && req.url === '/health') {
    return send(res, 200, 'OK', 'text/plain; charset=utf-8');
  }

  if (req.method === 'POST' && req.url === '/api/analyze') {
    if (!apiKey) {
      return send(res, 503, {
        error: 'AI service is not configured. Set OPENAI_API_KEY on the server.'
      });
    }

    let body = '';

    req.on('data', chunk => {
      body += chunk;
      if (body.length > 100000) req.destroy();
    });

    req.on('end', async () => {
      try {
        const input = JSON.parse(body);

        const company = String(input.company || '').trim();
        const homeMarket = String(input.homeMarket || '').trim();
        const targetMarket = String(input.targetMarket || '').trim();
        const industry = String(input.industry || '').trim();
        const budget = String(input.budget ?? '').trim();

        if (!company || !homeMarket || !targetMarket || !industry || !budget) {
          return send(res, 400, {
            error: 'Please provide all required market-entry details.'
          });
        }

        const prompt = `You are a careful international business expansion analyst.

Create a practical, structured preliminary market-entry assessment.

Clearly distinguish assumptions from verified facts.
You do not have live browsing or current market data.
Do not invent statistics, competitor facts, citations, or claim live research.

Company/product: ${company}
Home market: ${homeMarket}
Target market: ${targetMarket}
Budget: EUR ${budget}
Industry: ${industry}

Include:
1. Executive recommendation
2. Target customer hypotheses
3. Market-entry route options
4. Competitor-analysis framework and what needs verification
5. Localization and pricing considerations
6. Key risks including regulatory issues to investigate
7. Budget considerations
8. A 90-day plan
9. Five research questions
10. Go/no-go checklist

Use concise headings and actionable bullets.
Label assumptions and research gaps clearly.`;

        const aiRes = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${apiKey}\`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ model, input: prompt })
        });

        const data = await aiRes.json();

        if (!aiRes.ok) {
          throw new Error(data.error?.message || 'AI API request failed');
        }

        const analysis = data.output
          ?.flatMap(item => item.content || [])
          ?.filter(c => c.type === 'output_text')
          ?.map(c => c.text)
          ?.join('\\n') || 'No text returned.';

        return send(res, 200, { analysis });

      } catch (error) {
        return send(res, 500, {
          error: error.message || 'Unexpected server error.'
        });
      }
    });

    return;
  }

  return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
});

server.listen(PORT, () => {
 console.log('Expansion Intelligence running on port ' + PORT);
});
