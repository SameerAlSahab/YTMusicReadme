const { fetchTrackData } = require('../lib/music');

const FONT_STACK = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif";

function escapeXml(str = '') {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}


function buildBars() {
    const areaX = 146;
    const areaWidth = 230;
    const centerY = 110;
    const barCount = 22;
    const gap = 3;
    const barWidth = (areaWidth - gap * (barCount - 1)) / barCount;
    const radius = barWidth / 2;
    const minAmp = 3; 

    let bars = '';
    for (let i = 0; i < barCount; i++) {
        const x = areaX + i * (barWidth + gap);
        const dur = (0.5 + (i % 5) * 0.13).toFixed(2);
        const delay = (i * 0.035).toFixed(2);
        const hue = 285 + i * 4;
        const maxAmp = 9 + (i % 6) * 3; 
        const midAmp = Math.max(minAmp + 1, maxAmp - 6);

        const amps = [minAmp, maxAmp, minAmp + 1, midAmp, minAmp];
        const heights = amps.map(a => (a * 2).toFixed(1)).join(';');
        const ys = amps.map(a => (centerY - a).toFixed(1)).join(';');

        bars += `<rect x="${x.toFixed(1)}" y="${(centerY - minAmp).toFixed(1)}" width="${barWidth.toFixed(1)}" height="${(minAmp * 2).toFixed(1)}" rx="${radius.toFixed(1)}" fill="hsl(${hue},70%,68%)">
      <animate attributeName="height" values="${heights}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite" />
      <animate attributeName="y" values="${ys}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite" />
    </rect>`;
    }
    return bars;
}

function buildSvg({ title, artist, artDataUri }) {
    const safeTitle = escapeXml(title).slice(0, 42);
    const safeArtist = escapeXml(artist).slice(0, 42);
    const bars = buildBars();

    return `<svg width="400" height="140" viewBox="0 0 400 140" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="artClip"><rect x="10" y="10" width="120" height="120" rx="14" /></clipPath>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e1b2e"/>
      <stop offset="100%" stop-color="#2d1b3d"/>
    </linearGradient>
  </defs>

  <rect width="400" height="140" rx="18" fill="url(#bg)" />

  <g clip-path="url(#artClip)">
    <image href="${artDataUri}" x="10" y="10" width="120" height="120" preserveAspectRatio="xMidYMid slice" />
  </g>
  <rect x="10" y="10" width="120" height="120" rx="14" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>

  <text x="146" y="40" font-family="${FONT_STACK}" font-size="16" font-weight="700" fill="#ffffff">${safeTitle}</text>
  <text x="146" y="62" font-family="${FONT_STACK}" font-size="13" fill="#c9bfe0">${safeArtist}</text>
  <text x="146" y="86" font-family="${FONT_STACK}" font-size="11" fill="#8a7fa8">
    <tspan>&#9654; Now Playing</tspan>
    <animate attributeName="opacity" values="1;0.4;1" dur="1.6s" repeatCount="indefinite" />
  </text>

  ${bars}
</svg>`;
}

module.exports = async (req, res) => {
    const { url } = req.query;
    if (!url) {
        res.status(400).send('Missing url parameter');
        return;
    }

    try {
        const data = await fetchTrackData(url);
        const svg = buildSvg(data);
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
        res.status(200).send(svg);
    } catch (err) {
        console.error(err.message);
        const fallback = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="140"><rect width="400" height="140" rx="18" fill="#2d1b3d"/><text x="20" y="75" fill="#fff" font-family="sans-serif" font-size="14">Widget unavailable</text></svg>`;
        res.setHeader('Content-Type', 'image/svg+xml');
        res.status(200).send(fallback);
    }
};
