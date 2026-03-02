const { Router } = require('express');

const router = Router();

router.get('/:token/logo/:tvgId.png', async (req, res) => {
    if (!req.addonInterface) {
        return res.redirect(`https://via.placeholder.com/300x400/333333/FFFFFF?text=${encodeURIComponent(req.params.tvgId)}`);
    }
    const sources = req.addonInterface._logoSources || [];
    if (!sources.length) {
        return res.redirect(`https://via.placeholder.com/300x400/333333/FFFFFF?text=${encodeURIComponent(req.params.tvgId)}`);
    }
    const { tvgId } = req.params;
    const rawId = tvgId;
    const noCountry = rawId.replace(/\.[a-z]{2,3}$/, '');
    const hyphenated = noCountry.replace(/[^a-zA-Z0-9]+/g, '-');
    const underscored = noCountry.replace(/[^a-zA-Z0-9]+/g, '_');
    const candidates = [...new Set([rawId, noCountry, hyphenated, underscored])];
    for (const cand of candidates) {
        for (const template of sources) {
            const url = template.replace('{id}', cand);
            try {
                const headCtrl = new AbortController();
                const headTimer = setTimeout(() => headCtrl.abort(), 7000);
                let head;
                try {
                    head = await fetch(url, { method: 'HEAD', signal: headCtrl.signal });
                } finally {
                    clearTimeout(headTimer);
                }
                if (!head.ok) {
                    const getCtrl = new AbortController();
                    const getTimer = setTimeout(() => getCtrl.abort(), 10000);
                    try {
                        head = await fetch(url, { method: 'GET', signal: getCtrl.signal });
                    } finally {
                        clearTimeout(getTimer);
                    }
                }
                if (head.ok) {
                    const buf = Buffer.from(await head.arrayBuffer());
                    if (buf.length > 50) {
                        const ct = head.headers.get('content-type') || 'image/png';
                        res.setHeader('Content-Type', ct);
                        res.setHeader('Cache-Control', 'public, max-age=21600');
                        return res.end(buf);
                    }
                }
            } catch { /* continue */ }
        }
    }
    res.redirect(`https://via.placeholder.com/300x400/333333/FFFFFF?text=${encodeURIComponent(noCountry.toUpperCase().slice(0, 12))}`);
});

module.exports = router;
