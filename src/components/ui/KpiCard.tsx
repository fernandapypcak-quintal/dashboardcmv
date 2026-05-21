interface KpiCardProps {
  label: string
  value: string
  sub?: string
  subColor?: 'red' | 'green' | 'default'
  icon?: string
  iconBg?: string
}

export default function KpiCard({ label, value, sub, subColor = 'default', icon, iconBg }: KpiCardProps) {
  const subClass =
    subColor === 'red'   ? 'text-[#c0392b]' :
    subColor === 'green' ? 'text-[#2d6a00]' :
    'text-[#666]'

  return (
    <div className="bg-white border border-[#e8e8e6] rounded-xl p-4 relative">
      {icon && (
        <div className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg flex items-center
                        justify-center text-sm" style={{ background: iconBg }}>
          {icon}
        </div>
      )}
      <div className="text-[10.5px] font-semibold text-[#aaa] uppercase tracking-wide mb-2">
        {label}
      </div>
      <div className="text-[26px] font-bold text-[#111] tracking-tight leading-none">
        {value}
      </div>
      {sub && (
        <div className={`text-[12px] mt-1.5 font-medium ${subClass}`}>{sub}</div>
      )}
    </div>
  )
}
