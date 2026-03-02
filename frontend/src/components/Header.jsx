import React from 'react'

export default function Header({ dark, onToggle }) {
    return (
        <header
            className="sticky top-0 z-50"
            style={{
                height: '44px',
                background: dark ? 'rgba(10,10,15,0.85)' : 'rgba(245,245,248,0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: 'none',
                position: 'relative'
            }}
        >
            <div
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{
                    background: 'linear-gradient(90deg, #00E5FF, #9B5DE5)',
                    opacity: 0.6
                }}
            />
            <div className="max-w-3xl mx-auto px-4 h-full flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">⚡</span>
                    <div className="flex items-baseline gap-2">
                        <h1
                            className="text-xl font-bold tracking-tight"
                            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                        >
                            BollyFlix
                        </h1>
                        <span
                            className="text-sm font-normal"
                            style={{ color: dark ? '#6B6B88' : '#6B6B88' }}
                        >
                            Link Extractor
                        </span>
                    </div>
                </div>
                <button
                    onClick={onToggle}
                    className="flex items-center justify-center w-7 h-7 rounded-full text-lg transition-all hover:scale-110"
                    style={{
                        background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    {dark ? '🌙' : '☀️'}
                </button>
            </div>
        </header>
    )
}
