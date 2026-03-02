import React from 'react'

export default function StatsRow({ stats, dark, onSkippedClick }) {
    const skippedCount = stats.series + stats.filtered

    const items = [
        { label: 'Total', value: stats.total, color: '#F0F0F8', bg: 'rgba(255,255,255,0.08)', clickable: false },
        { label: 'Extracted', value: stats.success, color: '#00F5A0', bg: 'rgba(0,245,160,0.12)', clickable: false },
        { label: 'Skipped', value: skippedCount, color: '#FFD93D', bg: 'rgba(255,217,61,0.12)', clickable: true },
        { label: 'Pending', value: 0, color: '#FF8C42', bg: 'rgba(255,140,66,0.12)', clickable: false },
        { label: 'Failed', value: stats.failed, color: '#FF4D6D', bg: 'rgba(255,77,109,0.12)', clickable: false },
    ]
    return (
        <div className="flex gap-2 overflow-x-auto pb-2 animate-fadeSlideIn" style={{ animationDelay: '150ms' }}>
            {items.map(({ label, value, color, bg, clickable }) => (
                <div
                    key={label}
                    onClick={clickable && value > 0 ? onSkippedClick : undefined}
                    className={`glass-card-inner flex-1 min-w-[80px] p-3 text-center ${clickable && value > 0 ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
                    style={{ background: bg }}
                >
                    <div
                        className="text-2xl font-bold"
                        style={{ color, fontFamily: "'Barlow Condensed', sans-serif" }}
                    >
                        {value}
                    </div>
                    <div
                        className="text-[10px] uppercase tracking-wider mt-1"
                        style={{ color: '#6B6B88' }}
                    >
                        {label}
                    </div>
                </div>
            ))}
        </div>
    )
}
