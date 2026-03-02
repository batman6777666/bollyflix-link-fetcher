import React, { useState, useEffect, useRef } from 'react'
import Header from './components/Header'
import UrlInput from './components/UrlInput'
import FilterWords from './components/FilterWords'
import ProgressBar from './components/ProgressBar'
import StatsRow from './components/StatsRow'
import ResultCard from './components/ResultCard'
import LinksBox from './components/LinksBox'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
const DEFAULT_FILTER_WORDS = ['Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Punjabi', 'Bengali']

export default function App() {
    const [dark, setDark] = useState(true)
    const [urls, setUrls] = useState('')
    const [filterWords, setFilterWords] = useState(DEFAULT_FILTER_WORDS)
    const [running, setRunning] = useState(false)
    const [results, setResults] = useState([])
    const [links, setLinks] = useState([])
    const [skippedPosts, setSkippedPosts] = useState([])
    const [stats, setStats] = useState({ total: 0, success: 0, series: 0, filtered: 0, failed: 0 })
    const [progress, setProgress] = useState(0)
    const [processed, setProcessed] = useState(0)
    const [elapsed, setElapsed] = useState(0)
    const [toast, setToast] = useState(null)
    const [started, setStarted] = useState(false)
    const [showSkipped, setShowSkipped] = useState(false)

    const readerRef = useRef(null)
    const timerRef = useRef(null)
    const startTimeRef = useRef(null)

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme')
        const savedWords = localStorage.getItem('filterWords')
        if (savedTheme === 'light') setDark(false)
        if (savedWords) {
            try { setFilterWords(JSON.parse(savedWords)) } catch (e) { }
        }
    }, [])

    useEffect(() => {
        document.body.classList.toggle('light', !dark)
        localStorage.setItem('theme', dark ? 'dark' : 'light')
    }, [dark])

    useEffect(() => {
        localStorage.setItem('filterWords', JSON.stringify(filterWords))
    }, [filterWords])

    const showToast = (msg, duration = 3000) => {
        setToast(msg)
        setTimeout(() => setToast(null), duration)
    }

    const startTimer = () => {
        startTimeRef.current = Date.now()
        timerRef.current = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
        }, 1000)
    }

    const stopTimer = () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }

    const resetAll = () => {
        setResults([])
        setLinks([])
        setSkippedPosts([])
        setStats({ total: 0, success: 0, series: 0, filtered: 0, failed: 0 })
        setProgress(0)
        setProcessed(0)
        setElapsed(0)
        setStarted(false)
        setShowSkipped(false)
        stopTimer()
    }

    const startExtraction = async () => {
        const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean)
        if (!urlList.length) { showToast('⚠️ Please enter at least one URL'); return }

        resetAll()
        setRunning(true)
        setStarted(true)
        startTimer()

        let total = 0
        let proc = 0

        try {
            const res = await fetch(`${BACKEND}/api/extract`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ urls: urlList, filterWords })
            })

            if (!res.ok) throw new Error(`Backend error: ${res.status}`)

            readerRef.current = res.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await readerRef.current.read()
                if (done) break
                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop()

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue
                    try {
                        const data = JSON.parse(line.slice(6))

                        if (data.type === 'total') {
                            total = data.count
                            setStats(s => ({ ...s, total: data.count }))
                        }

                        if (data.type === 'result') {
                            proc++
                            setProcessed(proc)
                            setProgress(total > 0 ? Math.round((proc / total) * 100) : 0)
                            setResults(prev => [...prev, data])

                            if (data.status === 'success') {
                                setStats(s => ({ ...s, success: s.success + 1 }))
                                if (data.downloadLink) {
                                    setLinks(prev => [...prev, data.downloadLink])
                                }
                            } else if (data.postType === 'series') {
                                setStats(s => ({ ...s, series: s.series + 1 }))
                                setSkippedPosts(prev => [...prev, {
                                    title: data.title,
                                    url: data.postUrl,
                                    reason: data.reason
                                }])
                            } else if (data.postType === 'filtered') {
                                setStats(s => ({ ...s, filtered: s.filtered + 1 }))
                                setSkippedPosts(prev => [...prev, {
                                    title: data.title,
                                    url: data.postUrl,
                                    reason: data.reason
                                }])
                            } else if (data.status === 'failed') {
                                setStats(s => ({ ...s, failed: s.failed + 1 }))
                            }
                        }

                        if (data.type === 'done') {
                            stopTimer()
                            setProgress(100)
                            showToast(`🎉 Done! ${proc} processed`)
                        }

                        if (data.type === 'error') {
                            showToast(`❌ ${data.message}`)
                        }
                    } catch (e) { }
                }
            }
        } catch (err) {
            showToast(`❌ ${err.message}`)
        } finally {
            setRunning(false)
            stopTimer()
        }
    }

    const clearAll = async () => {
        if (readerRef.current) {
            try { await readerRef.current.cancel() } catch (e) { }
            readerRef.current = null
        }
        try { await fetch(`${BACKEND}/api/clear`, { method: 'POST' }) } catch (e) { }
        resetAll()
        showToast('🗑 Cleared!')
    }

    return (
        <div className="min-h-screen pb-12">
            <Header dark={dark} onToggle={() => setDark(d => !d)} />

            <main className="max-w-[720px] mx-auto px-4 pt-6 flex flex-col gap-4">
                <UrlInput
                    value={urls}
                    onChange={setUrls}
                    onStart={startExtraction}
                    onClear={clearAll}
                    running={running}
                    dark={dark}
                />

                <FilterWords
                    words={filterWords}
                    onChange={setFilterWords}
                    dark={dark}
                    onToast={showToast}
                />

                {started && (
                    <>
                        <ProgressBar
                            progress={progress}
                            processed={processed}
                            total={stats.total}
                            elapsed={elapsed}
                            running={running}
                        />
                        <StatsRow
                            stats={stats}
                            dark={dark}
                            onSkippedClick={() => setShowSkipped(!showSkipped)}
                        />

                        {showSkipped && skippedPosts.length > 0 && (
                            <div className="glass-card p-5 animate-fadeSlideIn">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold">Skipped Posts ({skippedPosts.length})</h3>
                                    <button
                                        onClick={() => setShowSkipped(false)}
                                        className="text-xs"
                                        style={{ color: '#6B6B88' }}
                                    >
                                        ✕ Close
                                    </button>
                                </div>
                                <div className="max-h-[320px] overflow-y-auto space-y-2 pr-2">
                                    {skippedPosts.map((post, i) => (
                                        <div
                                            key={i}
                                            className="glass-card-inner p-3 flex items-start justify-between gap-2"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-sm truncate">{post.title}</span>
                                                    <span className="badge badge-orange text-[10px]">SKIPPED</span>
                                                </div>
                                                <a
                                                    href={post.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="link-cyan text-xs truncate block"
                                                >
                                                    {post.url.replace('https://bollyflix.sarl/', '')}
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {showSkipped && skippedPosts.length === 0 && (
                            <div className="glass-card p-5 animate-fadeSlideIn text-center" style={{ color: '#6B6B88' }}>
                                No posts were skipped.
                            </div>
                        )}

                        <div className="glass-card p-5 animate-fadeSlideIn" style={{ animationDelay: '150ms' }}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-semibold">🎬 Results</h2>
                                <span className="badge badge-violet">{results.length} results</span>
                            </div>
                            {results.map((r, i) => (
                                <React.Fragment key={i}>
                                    <ResultCard data={r} dark={dark} onToast={showToast} index={i} />
                                    {i < results.length - 1 && (
                                        <div className="my-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        <LinksBox links={links} dark={dark} onToast={showToast} />
                    </>
                )}
            </main>

            {toast && (
                <div
                    className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm shadow-xl animate-fadeSlideIn glass-card"
                >
                    {toast}
                </div>
            )}
        </div>
    )
}
