require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { processAllUrls, clearAllBrowsers } = require('./automator')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'https://bollyflix-link-fetcher.pages.dev'
    ],
    methods: ['GET', 'POST'],
    credentials: false
}))
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.post('/api/extract', async (req, res) => {
    const { urls, filterWords } = req.body
    if (!urls || !Array.isArray(urls) || !urls.length)
        return res.status(400).json({ error: 'urls array required' })

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.flushHeaders()

    const emit = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`)

    try {
        await processAllUrls(urls, filterWords || [], emit)
    } catch (err) {
        emit({ type: 'error', message: err.message })
    } finally {
        res.end()
    }
})

app.post('/api/clear', async (req, res) => {
    try {
        await clearAllBrowsers()
        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
})

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`))
