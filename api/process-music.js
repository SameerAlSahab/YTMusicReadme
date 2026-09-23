const { fetchTrackData } = require('../lib/music');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const { title, artist, artDataUri } = await fetchTrackData(url);
        res.status(200).json({
            title,
            artist,
            art_path: artDataUri 
        });
    } catch (err) {
        console.error(err.message);
        res.status(err.status || 500).json({ error: err.status ? err.message : 'Failed to process metadata or thumbnail image.' });
    }
};
