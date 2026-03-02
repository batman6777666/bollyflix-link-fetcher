import React, { useState } from 'react'

export default function LinksBox({ links, dark, onToast }) {
    const [open, setOpen] = useState(true)
    const [copied, setCopied] = useState(false)

    const copyAll = () => {
        if (!links.length) { onToast('⚠️ No links yet'); return }
        navigator.clipboard.writeText(links.join('\n'))
        setCopied(true)
        onToast(`✅ Copied ${links.length} links!`)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="glass-card p-5 animate-fadeSlideIn" style={{ animationDelay: '200ms' }}>
            <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setOpen(o => !o)}
            >
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">📋 Extracted Download Links</span>
                    <span className="badge badge-cyan">
                        {links.length} link{links.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <span
                    className="text-sm transition-transform duration-300"
                    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                    ▼
                </span>
            </div>

            {open && (
                <div className="mt-4">
                    <textarea
                        readOnly
                        value={links.join('\n')}
                        rows={links.length > 0 ? Math.min(links.length + 1, 15) : 6}
                        placeholder="Download links will appear here..."
                        className="input-glass resize-none font-mono text-xs"
                        style={{
                            maxHeight: '300px',
                            lineHeight: '1.75'
                        }}
                    />
                    <button
                        onClick={copyAll}
                        className={`mt-4 w-full btn-primary flex items-center justify-center gap-2 ${copied ? 'animate-pulse-success' : ''
                            }`}
                        style={{
                            background: copied
                                ? 'linear-gradient(135deg, #00F5A0, #00E5FF)'
                                : 'linear-gradient(135deg, #00E5FF, #9B5DE5)'
                        }}
                    >
                        {copied ? (
                            <>✓ Copied {links.length} links!</>
                        ) : (
                            <>📋 Copy All Links</>
                        )}
                    </button>
                </div>
            )}
        </div>
    )
}
