const { chromium } = require('playwright')

// Track all active browsers so we can kill them on /api/clear
const activeBrowsers = []

// ── AD BLOCKER ────────────────────────────────────────────────
// Applied to every browser context before any navigation.
// CRITICAL: This is what makes pages load fast.
// Without this, BollyFlix pages NEVER reach networkidle
// because ads keep firing requests forever.
async function applyAdBlocker(context) {
    await context.route('**/*', (route) => {
        const url = route.request().url()
        const type = route.request().resourceType()

        // Block by resource type (images/video not needed for link extraction)
        const blockedTypes = ['image', 'media', 'font']

        // Block by URL pattern (ad networks and trackers)
        const blockedPatterns = [
            'googlesyndication', 'doubleclick', 'adservice',
            'googletagmanager', 'googletagservices', 'google-analytics',
            'analytics.google', 'facebook.net', 'connect.facebook',
            'amazon-adsystem', 'adnxs', 'adsrvr', 'popads', 'popcash',
            'propellerads', 'exoclick', 'trafficjunky', 'juicyads',
            'hilltopads', 'adsterra', 'mgid', 'revcontent', 'outbrain',
            'taboola', 'hotjar', 'clarity.ms', 'onesignal', 'pushcrew',
            'mc.yandex', '/ads/', '/ad/', 'banner', 'popup', 'popunder',
            '/tracker', '/pixel', '/beacon', '/analytics'
        ]

        const block = blockedTypes.includes(type) ||
            blockedPatterns.some(p => url.includes(p))

        block ? route.abort() : route.continue()
    })
}

// ── SERIES + FILTER DETECTION ─────────────────────────────────
function detectPostType(title, filterWords) {
    // Always detect series
    const seriesPatterns = [
        /\bSeason\s*\d+/i, /\bS\d{2}\b/, /\bEpisode\s*\d+/i,
        /\bEP\s*\d+/i, /\bE\d{2}\b/, /\bComplete\s+Series\b/i,
        /\bWeb\s*Series\b/i, /\bTV\s*Series\b/i
    ]
    for (const p of seriesPatterns) {
        if (p.test(title)) {
            return { type: 'series', reason: `TV Series: "${title.match(p)[0]}"` }
        }
    }

    // Check custom filter words (default: HDTS, HDTC)
    for (const word of filterWords) {
        const escaped = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
        const regex = new RegExp(`(^|[\\s\\[\\(|])${escaped}([\\s\\]\\)|]|$)`, 'i')
        if (regex.test(title)) {
            return { type: 'filtered', reason: `Filtered: "${word}"` }
        }
    }

    return { type: 'movie', reason: null }
}

// ── PAGE 1: Get all 20 posts from BollyFlix list page ─────────
// Real HTML verified: posts are inside <h2><a href="...">title</a></h2>
async function getPostsFromPage(pageUrl) {
    const browser = await chromium.launch({ headless: true })
    activeBrowsers.push(browser)
    try {
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        await applyAdBlocker(context)
        const page = await context.newPage()

        // IMPORTANT: Use 'domcontentloaded' NOT 'networkidle'
        // BollyFlix never reaches networkidle due to constant ad requests
        await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })

        // Wait for h2 elements to appear in DOM
        await page.waitForFunction(
            () => document.querySelectorAll('h2 a').length > 0,
            { timeout: 10000 }
        ).catch(() => { })

        // Use page.evaluate with Array.from — avoids ALL "not iterable" / "map not a function" errors
        // NEVER use page.$$eval because it passes NodeList which has no .map()
        const posts = await page.evaluate(() => {
            // Try h2 a first (verified real selector)
            let links = Array.from(document.querySelectorAll('h2 a'))

            // Fallback selectors if h2 a doesn't work
            if (links.length === 0) links = Array.from(document.querySelectorAll('.entry-title a'))
            if (links.length === 0) links = Array.from(document.querySelectorAll('article a'))

            return links
                .filter(a => a.href && a.href.includes('bollyflix') && a.textContent.trim().length > 5)
                .map(a => ({ title: a.textContent.trim(), url: a.href }))
        })

        if (!posts.length) throw new Error(`No posts found on: ${pageUrl}`)
        return posts
    } finally {
        await browser.close()
        const i = activeBrowsers.indexOf(browser)
        if (i > -1) activeBrowsers.splice(i, 1)
    }
}

// ── PAGES 2-3-4: Process one movie through all steps ──────────
async function processMovie(post) {
    const startTime = Date.now()
    const browser = await chromium.launch({ headless: true })
    activeBrowsers.push(browser)

    try {
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        await applyAdBlocker(context)

        // ════════════════════════════════════════════════════════
        // PAGE 2: BollyFlix individual movie page
        // Real HTML structure:
        //   <h5>Movie Title 1080p [2.5GB]</h5>
        //   <a href="https://fastdlserver.life/..."></a>
        // ════════════════════════════════════════════════════════
        const page2 = await context.newPage()

        // MUST use domcontentloaded — networkidle NEVER fires on BollyFlix
        await page2.goto(post.url, { waitUntil: 'domcontentloaded', timeout: 30000 })

        // Wait for h5 elements to appear (quality rows load after DOM)
        await page2.waitForFunction(
            () => document.querySelectorAll('h5').length > 0,
            { timeout: 10000 }
        ).catch(() => { })

        // Find the h5 with 1080p then get the first anchor after it
        const googleDriveHref = await page2.evaluate(() => {
            const h5List = Array.from(document.querySelectorAll('h5'));

            // Find the h5 whose text contains "1080p" 
            // but NOT "2160p" and NOT "10bit"
            const target1080p = h5List.find(h5 => {
                const t = (h5.textContent || '').toLowerCase();
                return t.includes('1080p') && !t.includes('2160p') && !t.includes('10bit');
            });

            if (!target1080p) return null;

            // Now walk ALL next siblings after this h5
            // and return the FIRST anchor tag found
            let el = target1080p.nextElementSibling;
            let steps = 0;
            while (el && steps < 15) {
                // If we hit another h5, we've gone past our section — stop
                if (el.tagName === 'H5') break;

                // Direct anchor tag
                if (el.tagName === 'A') {
                    const href = el.href || '';
                    if (href.includes('fastdlserver')) return href;
                }

                // Anchor tag nested inside another element (p, div, span, etc.)
                const nestedAnchors = Array.from(el.querySelectorAll('a'));
                for (const a of nestedAnchors) {
                    if ((a.href || '').includes('fastdlserver')) return a.href;
                }

                el = el.nextElementSibling;
                steps++;
            }

            return null;
        });

        if (!googleDriveHref) {
            throw new Error('fastdlserver link not found on PAGE 2 (BollyFlix movie page)')
        }

        // ════════════════════════════════════════════════════════
        // PAGE 3: GDFlix page
        // fastdlserver.life URL automatically HTTP-redirects to GDFlix
        // Real HTML verified:
        //   <a href="https://instant.busycdn.xyz/LONG_HASH">Instant DL [10GBPS]</a>
        // ════════════════════════════════════════════════════════
        const page3 = await context.newPage()
        await page3.goto(googleDriveHref, { waitUntil: 'domcontentloaded', timeout: 30000 })

        // Wait for Instant DL link to appear
        await page3.waitForFunction(
            () => Array.from(document.querySelectorAll('a'))
                .some(a => /instant\s*(dl|download)/i.test(a.textContent || '')),
            { timeout: 10000 }
        ).catch(() => { })

        const instantDLHref = await page3.evaluate(() => {
            const allLinks = Array.from(document.querySelectorAll('a'))

            // Primary: "Instant DL" text + busycdn href
            for (const a of allLinks) {
                const text = a.textContent || ''
                const href = a.href || ''
                if (/instant\s*(dl|download)/i.test(text) && href.includes('busycdn')) {
                    return href
                }
            }

            // Fallback: any busycdn link
            for (const a of allLinks) {
                if ((a.href || '').includes('busycdn')) return a.href
            }

            return null
        })

        if (!instantDLHref) {
            throw new Error('Instant DL button not found on PAGE 3 (GDFlix page)')
        }

        // ════════════════════════════════════════════════════════
        // PAGE 4: instant.busycdn.xyz
        // Get the Download Here button href and extract the direct URL from ?url= parameter
        // ════════════════════════════════════════════════════════
        const page4 = await context.newPage();
        await page4.goto(instantDLHref, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait for Download Here button
        await page4.waitForFunction(
            () => Array.from(document.querySelectorAll('a'))
                .some(a => /download\s*here/i.test(a.textContent || '')),
            { timeout: 10000 }
        ).catch(() => { });

        // Get the href of the Download Here button
        // It looks like: https://fastcdn-dl.pages.dev/?url=https://video-downloads.googleusercontent.com/ADGPM2...
        const buttonHref = await page4.evaluate(() => {
            const allLinks = Array.from(document.querySelectorAll('a'));
            for (const a of allLinks) {
                if (/download\s*here/i.test(a.textContent || '')) {
                    return a.href || a.getAttribute('href') || '';
                }
            }
            return '';
        });

        if (!buttonHref) {
            throw new Error('Download Here button not found on PAGE 4 (instant.busycdn.xyz)');
        }

        // ════════════════════════════════════════════════════════
        // EXTRACT DIRECT URL FROM ?url= PARAMETER
        // The button href is a WRAPPER URL like:
        //   https://fastcdn-dl.pages.dev/?url=https://video-downloads.googleusercontent.com/ADGPM2...
        // The DIRECT download link is the VALUE of the ?url= query parameter
        // ════════════════════════════════════════════════════════
        let finalDownloadLink = null;

        // Method 1: Use URL API to get the ?url= parameter value
        try {
            const parsed = new URL(buttonHref);
            const urlParam = parsed.searchParams.get('url');
            if (urlParam && urlParam.startsWith('https://video-downloads.googleusercontent.com/')) {
                finalDownloadLink = urlParam;
            }
        } catch (e) { }

        // Method 2: If URL API fails, use regex to extract googleusercontent URL from the string
        if (!finalDownloadLink) {
            const match = buttonHref.match(/https:\/\/video-downloads\.googleusercontent\.com\/[^&\s"'#)]+/);
            if (match) {
                finalDownloadLink = match[0];
            }
        }

        // Method 3: If the href itself is already a direct googleusercontent URL
        if (!finalDownloadLink && buttonHref.includes('video-downloads.googleusercontent.com')) {
            finalDownloadLink = buttonHref;
        }

        if (!finalDownloadLink) {
            throw new Error(`Could not extract direct URL from PAGE 4 button href: ${buttonHref}`);
        }

        return {
            title: post.title,
            postUrl: post.url,
            type: 'movie',
            status: 'success',
            quality: '1080p',
            downloadLink: finalDownloadLink,
            timeTaken: parseFloat(((Date.now() - startTime) / 1000).toFixed(1)),
            error: null
        }

    } catch (err) {
        return {
            title: post.title,
            postUrl: post.url,
            type: 'movie',
            status: 'failed',
            quality: null,
            downloadLink: null,
            timeTaken: parseFloat(((Date.now() - startTime) / 1000).toFixed(1)),
            error: err.message
        }
    } finally {
        await browser.close()
        const i = activeBrowsers.indexOf(browser)
        if (i > -1) activeBrowsers.splice(i, 1)
    }
}

// ── MAIN: process all URLs in batches of 2 ───────────────────
async function processAllUrls(urls, filterWords, emitEvent) {
    const allPosts = []

    for (const url of urls) {
        try {
            const posts = await getPostsFromPage(url)
            allPosts.push(...posts)
        } catch (err) {
            emitEvent({ type: 'error', message: `Failed to load: ${url} — ${err.message}` })
        }
    }

    emitEvent({ type: 'total', count: allPosts.length })

    // Classify all posts first
    const classified = allPosts.map(post => ({
        ...post,
        ...detectPostType(post.title, filterWords)
    }))

    // Immediately emit series + filtered (no automation needed)
    for (const post of classified) {
        if (post.type !== 'movie') {
            emitEvent({
                type: 'result',
                title: post.title,
                postUrl: post.url,
                postType: post.type,
                status: 'skipped',
                reason: post.reason,
                quality: null,
                downloadLink: null,
                timeTaken: 0,
                error: null
            })
        }
    }

    // Process movies in batches of 2 (parallel within each batch)
    const moviePosts = classified.filter(p => p.type === 'movie')
    const BATCH = 2

    for (let i = 0; i < moviePosts.length; i += BATCH) {
        const batch = moviePosts.slice(i, i + BATCH)
        const results = await Promise.all(batch.map(post => processMovie(post)))
        for (const r of results) {
            emitEvent({
                type: 'result',
                title: r.title,
                postUrl: r.postUrl,
                postType: 'movie',
                status: r.status,
                quality: r.quality,
                downloadLink: r.downloadLink,
                timeTaken: r.timeTaken,
                error: r.error
            })
        }
    }

    emitEvent({ type: 'done' })
}

// Kill all active browsers (called by /api/clear)
async function clearAllBrowsers() {
    for (const b of activeBrowsers) {
        try { await b.close() } catch (e) { }
    }
    activeBrowsers.length = 0
}

module.exports = { processAllUrls, clearAllBrowsers }
