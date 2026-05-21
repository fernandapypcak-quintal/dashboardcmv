interface AlertBoxProps {
  type: 'error' | 'warning'
  title: string
  body: string
}

export default function AlertBox({ type, title, body }: AlertBoxProps) {
  const styles = type === 'error'
    ? { bg: 'bg-[#fdf0ef]', border: 'border-[#f0c4c1]', icon: '⚠', iconColor: 'text-[#c0392b]' }
    : { bg: 'bg-[#fdf6e3]', border: 'border-[#edd870]', icon: '⚠', iconColor: 'text-[#c8920a]' }

  return (
    <div className={`flex gap-2.5 p-3 rounded-lg border ${styles.bg} ${styles.border}`}>
      <span className={`text-sm mt-0.5 flex-shrink-0 ${styles.iconColor}`}>{styles.icon}</span>
      <div className="text-[12.5px] text-[#111] leading-snug">
        <strong className="font-medium">{title}</strong>
        <br />{body}
      </div>
    </div>
  )
}
