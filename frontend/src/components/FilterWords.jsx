import React, { useState } from 'react'

const DEFAULT_FILTER_WORDS = ['Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Punjabi', 'Bengali']

export default function FilterWords({ words, onChange, dark, onToast }) {
    const [open, setOpen] = useState(false)
    const [input, setInput] = useState('')

    const add = () => {
        const w = input.trim()
        if (!w || words.includes(w)) return
        onChange([...words, w])
        setInput('')
        onToast(`✅ "${w}" added`)
    }

    const remove = (i) => {
        const removed = words[i]
        onChange(words.filter((_, idx) => idx !== i))
        onToast(`🗑 "${removed}" removed`)
    }

    const clear = () => { onChange([]); onToast('✅ All filter words cleared') }

    const reset = () => { onChange(DEFAULT_FILTER_WORDS); onToast('✅ Reset to defaults') }

    return (
        <div className="glass-card p-5 animate-fadeSlideIn" style={{ animationDelay: '50ms' }}>
            <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setOpen(o => !o)}
            >
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">⚙️ Filter Words</span>
                    <span className="badge badge-violet">
                        {words.length} word{words.length !== 1 ? 's' : ''}
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
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-xs mb-4" style={{ color: '#6B6B88' }}>
                        Posts containing these words will be skipped automatically.
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
                        {words.length === 0 && (
                            <span className="text-xs" style={{ color: '#6B6B88' }}>
                                No filter words added yet.
                            </span>
                        )}
                        {words.map((w, i) => (
                            <span key={i} className="chip">
                                {w}
                                <button onClick={() => remove(i)}>×</button>
                            </span>
                        ))}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && add()}
                            placeholder="Type a word to filter..."
                            className="input-glass flex-1"
                            style={{ minWidth: '160px' }}
                        />
                        <button onClick={add} className="btn-primary px-4">
                            + Add
                        </button>
                        {words.length > 0 && (
                            <button
                                onClick={clear}
                                className="px-4 py-2 rounded-full text-xs font-medium transition-colors"
                                style={{
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#6B6B88'
                                }}
                            >
                                Clear All
                            </button>
                        )}
                        {JSON.stringify(words) !== JSON.stringify(DEFAULT_FILTER_WORDS) && (
                            <button
                                onClick={reset}
                                className="px-4 py-2 rounded-full text-xs font-medium transition-colors"
                                style={{
                                    border: '1px solid rgba(155,93,229,0.3)',
                                    color: '#9B5DE5'
                                }}
                            >
                                Reset Defaults
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
