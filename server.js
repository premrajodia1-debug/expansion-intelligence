if (
  (req.method === 'GET' || req.method === 'HEAD') &&
  (req.url === '/' || req.url === '/index.html')
) {
  const filePath = path.join(__dirname, 'index.html');

  if (!fs.existsSync(filePath)) {
    res.writeHead(500);
    res.end('index.html missing');
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8'
  });

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  res.end(fs.readFileSync(filePath));
  return;
}
