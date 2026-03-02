import React, { useState } from 'react'

export default function ResultCard({ data, dark, onToast, index }) {
    const isSuccess = data.status === 'success'
    const isFailed = data.status === 'failed'
    const isSkipped = data.postType === 'series' || data.postType === 'filtered'

    const [copied, setCopied] = useState(false)

    const copy = (link) => {
        navigator.clipboard.writeText(link)
        setCopied(true)
        onToast('✅ Link copied!')
        setTimeout(() => setCopied(false), 2000)
    }

    const shortUrl = (data.postUrl || '').replace('https://bollyflix.sarl/', '')

    const staggerClass = `stagger-${Math.min(index + 1, 10)}`

    return (
        <div
            className={`result-card glass-card-inner mb-2 ${isSuccess ? 'success' : ''} ${isFailed ? 'failed' : ''} animate-fadeSlideIn ${staggerClass}`}
            style={{ padding: '14px 16px' }}
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-sm flex-1 truncate">
                    {data.title}
                </h3>
                <div className="flex items-center gap-2 shrink-0">
                    {isSuccess && <span className="badge badge-cyan">1080p</span>}
                    {isSkipped && <span className="badge badge-yellow">Skipped</span>}
                    {isFailed && <span className="badge badge-red">Failed</span>}
                    {data.timeTaken > 0 && (
                        <span className="text-xs font-mono" style={{ color: '#6B6B88' }}>
                            {data.timeTaken}s
                        </span>
                    )}
                </div>
            </div>

            <div
                className="text-xs mb-2 truncate"
                style={{ color: '#6B6B88', fontFamily: "'JetBrains Mono', monospace" }}
            >
                {shortUrl}
            </div>

            {data.reason && (
                <div className="text-xs mb-2" style={{ color: '#6B6B88' }}>
                    {data.reason}
                </div>
            )}

            {data.downloadLink && (
                <div className="flex items-center gap-2 mt-2">
                    <a
                        href={data.downloadLink}
                        target="_blank"
                        rel="noreferrer"
                        className="link-cyan text-xs truncate flex-1 font-mono"
                    >
                        {data.downloadLink.substring(0, 60)}...
                    </a>
                    <button
                        onClick={() => copy(data.downloadLink)}
                        className={`shrink-0 px-3 py-1 rounded-full text-xs transition-all ${copied ? 'badge-green animate-pulse-success' : 'glass-card-inner'
                            }`}
                    >
                        {copied ? '✓ Copied!' : '📋 Copy'}
                    </button>
                </div>
            )}

            {data.error && (
                <div className="text-xs mt-2" style={{ color: '#FF4D6D' }}>
                    ⚠️ {data.error}
                </div>
            )}
        </div>
    )
}
