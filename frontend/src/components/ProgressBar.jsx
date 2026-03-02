import React from 'react'

export default function ProgressBar({ progress, processed, total, elapsed, running }) {
    const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

    return (
        <div className="glass-card p-4 animate-fadeSlideIn" style={{ animationDelay: '100ms' }}>
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <span
                        className="w-2 h-2 rounded-full"
                        style={{
                            background: running ? '#00F5A0' : '#6B6B88',
                            boxShadow: running ? '0 0 8px #00F5A0' : 'none'
                        }}
                    />
                    <span className="text-sm font-medium">
                        {running
                            ? `Processing ${processed}/${total} posts...`
                            : progress === 100
                                ? `✅ Completed! ${processed}/${total} processed`
                                : `${processed}/${total} processed`
                        }
                    </span>
                </div>
                <div
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono"
                    style={{
                        background: 'rgba(0,245,160,0.15)',
                        color: '#00F5A0'
                    }}
                >
                    🕐 {fmt(elapsed)}
                </div>
            </div>
            <div className="progress-bar">
                <div
                    className="progress-bar-fill"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    )
}
