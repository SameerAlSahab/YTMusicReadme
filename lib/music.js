const axios = require('axios');
const sharp = require('sharp');

function extractVideoId(url) {
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    const standardMatch = url.match(/[?&]v=([^&]+)/);
    if (shortMatch) return shortMatch[1];
    if (standardMatch) return standardMatch[1];
    return null;
}


async function fetchTrackData(url) {
    const videoId = extractVideoId(url);
    if (!videoId) {
        const err = new Error('Invalid YouTube URL format.');
        err.status = 400;
        throw err;
    }

    const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const oEmbedRes = await axios.get(oEmbedUrl);
    const { title, author_name: artist } = oEmbedRes.data;

    const thumbUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    const imageResponse = await axios({ url: thumbUrl, responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data);

    const metadata = await sharp(imageBuffer).metadata();


    const squareDim = Math.min(metadata.width, metadata.height);
    const squareLeft = Math.max(0, Math.floor((metadata.width - squareDim) / 2));
    const squareTop = Math.max(0, Math.floor((metadata.height - squareDim) / 2));


    const INNER_CROP_RATIO = 0.13; // trim 13% off each side
    const innerDim = Math.round(squareDim * (1 - INNER_CROP_RATIO * 2));
    const innerLeft = squareLeft + Math.round((squareDim - innerDim) / 2);
    const innerTop = squareTop + Math.round((squareDim - innerDim) / 2);

    const croppedBuffer = await sharp(imageBuffer)
        .extract({ left: innerLeft, top: innerTop, width: innerDim, height: innerDim })
        .resize(320, 320)
        .jpeg({ quality: 88 })
        .toBuffer();

    const artDataUri = `data:image/jpeg;base64,${croppedBuffer.toString('base64')}`;

    return { videoId, title, artist, artDataUri, originalUrl: url };
}

module.exports = { extractVideoId, fetchTrackData };
