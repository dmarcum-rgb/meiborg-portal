export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-mcleod-token,x-mcleod-company,x-mcleod-user,x-mcleod-pass');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  // Extract path and rebuild query string (excluding 'path' param)
  const { path, ...rest } = req.query;
  const pathStr = Array.isArray(path) ? path.join('/') : (path || '');
  const qs = Object.keys(rest).length ? '?' + new URLSearchParams(rest).toString() : '';
  const url = `https://tms.meiborginc.com/ws/${pathStr}${qs}`;

  const token = req.headers['x-mcleod-token'] || '';
  const company = req.headers['x-mcleod-company'] || 'TMS';

  // Handle login POST (forward body)
  const isPost = req.method === 'POST';
  const body = isPost ? JSON.stringify(req.body) : undefined;

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
        'CompanyID': company
      },
      body
    });
    const ct = upstream.headers.get('content-type') || '';
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (ct.includes('pdf') || ct.includes('octet')) {
      const buf = await upstream.arrayBuffer();
      res.setHeader('Content-Type', 'application/pdf');
      res.status(upstream.status).send(Buffer.from(buf));
    } else {
      const text = await upstream.text();
      res.setHeader('Content-Type', ct || 'application/json');
      res.status(upstream.status).send(text);
    }
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
