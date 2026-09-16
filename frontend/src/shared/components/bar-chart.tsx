import { formatCurrency, num } from '@/lib/format'

export function BarChart({
  data,
}: {
  data: { label: string; value: number }[]
}) {
  const max = Math.max(...data.map((d) => num(d.value)), 1)
  
  // Y-axis labels (3 levels)
  const yLabels = [max, max / 2, 0].map(val => formatCurrency(val));

  return (
    <div className="flex h-56 w-full gap-4">
      {/* Y Axis Labels */}
      <div className="flex flex-col justify-between text-[11px] font-medium text-muted-foreground py-6 text-right w-16 shrink-0">
        <span>{yLabels[0]}</span>
        <span>{yLabels[1]}</span>
        <span>{yLabels[2]}</span>
      </div>
      
      {/* Bars */}
      <div className="flex flex-1 items-end justify-between gap-3 border-b border-border/40 pb-2 relative">
        {/* Horizontal grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
          <div className="w-full border-t border-border/20 h-0"></div>
          <div className="w-full border-t border-border/20 h-0"></div>
          <div className="w-full border-t border-border/20 h-0"></div>
        </div>
        
        {data.map((d, i) => {
          // Usando escala de raíz cuadrada para que las barras pequeñas se vean
          const rawValue = num(d.value)
          const ratio = Math.sqrt(rawValue) / Math.sqrt(max)
          const height = rawValue === 0 ? 0 : Math.max(ratio * 100, 4)
          
          return (
            <div key={i} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-2 z-10">
              <div className="relative flex w-full flex-1 items-end justify-center">
                <div
                  className={`w-full max-w-[40px] rounded-t-md transition-all duration-300 ease-out hover:opacity-80 cursor-pointer ${rawValue === 0 ? 'bg-[#e5e7eb]' : 'bg-[#dc2626]'}`}
                  style={{ height: `${height}%`, minHeight: rawValue === 0 ? 4 : 6 }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#1f2937] px-2.5 py-1.5 text-[11px] font-bold tracking-wide text-white opacity-0 shadow-md transition-all duration-200 group-hover:opacity-100 group-hover:-translate-y-1 pointer-events-none z-20">
                    {formatCurrency(rawValue)}
                    {/* Tooltip triangle */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-[#1f2937]"></div>
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">{d.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
