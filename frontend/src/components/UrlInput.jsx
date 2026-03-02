import React from 'react'

export default function UrlInput({ value, onChange, onStart, onClear, running, dark }) {
    return (
        <div className="glass-card p-5 animate-fadeSlideIn">
            <label
                className="block text-xs font-medium mb-3 tracking-widest uppercase"
                style={{ color: '#6B6B88', letterSpacing: '2px' }}
            >
                BollyFlix Page URLs
            </label>
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                rows={4}
                placeholder="www.example.com"
                className="input-glass resize-none"
                style={{
                    minHeight: '100px',
                    whiteSpace: 'pre',
                    wordBreak: 'break-all'
                }}
            />
            <div className="flex gap-3 mt-4 flex-wrap">
                <button
                    onClick={onStart}
                    disabled={running}
                    className="btn-primary flex items-center gap-2"
                >
                    {running ? (
                        <>
                            <span className="animate-spin">⟳</span>
                            Processing...
                        </>
                    ) : (
                        <>
                            ▶ Start Extraction
                        </>
                    )}
                </button>
                <button
                    onClick={onClear}
                    className="btn-outline flex items-center gap-2"
                >
                    ✕ Clear All
                </button>
            </div>
        </div>
    )
}
