'use client'

interface CancerTypeStat {
  cancerType: string
  count: number
  percentage: number
}

interface CancerTypeChartProps {
  data: CancerTypeStat[]
  total: number
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#a855f7', // violet
]

const CANCER_TYPE_LABELS: Record<string, string> = {
  breast: 'Breast Cancer',
  lung: 'Lung Cancer',
  colorectal: 'Colorectal Cancer',
  prostate: 'Prostate Cancer',
  pancreatic: 'Pancreatic Cancer',
  liver: 'Liver Cancer',
  stomach: 'Stomach Cancer',
  esophageal: 'Esophageal Cancer',
  bladder: 'Bladder Cancer',
  kidney: 'Kidney Cancer',
  cervical: 'Cervical Cancer',
  ovarian: 'Ovarian Cancer',
  leukemia: 'Leukemia',
  lymphoma: 'Lymphoma',
  melanoma: 'Melanoma',
  brain: 'Brain Cancer',
  other: 'Other',
}

export function CancerTypeBarChart({ data, total }: CancerTypeChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No data available
      </div>
    )
  }

  const maxCount = Math.max(...data.map((d) => d.count))

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {data.map((item, index) => {
          const width = maxCount > 0 ? (item.count / maxCount) * 100 : 0
          const color = COLORS[index % COLORS.length]
          const label = CANCER_TYPE_LABELS[item.cancerType] || item.cancerType

          return (
            <div key={item.cancerType} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{label}</span>
                <span className="text-muted-foreground">
                  {item.count} ({item.percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${width}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function CancerTypePieChart({ data, total }: CancerTypeChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No data available
      </div>
    )
  }

  // Calculate angles for pie chart
  let currentAngle = -90 // Start at top
  const segments = data.map((item, index) => {
    const percentage = item.percentage
    const angle = (percentage / 100) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle

    const color = COLORS[index % COLORS.length]
    const label = CANCER_TYPE_LABELS[item.cancerType] || item.cancerType

    // Calculate path for SVG arc
    const radius = 80
    const centerX = 100
    const centerY = 100

    const startAngleRad = (startAngle * Math.PI) / 180
    const endAngleRad = (endAngle * Math.PI) / 180

    const x1 = centerX + radius * Math.cos(startAngleRad)
    const y1 = centerY + radius * Math.sin(startAngleRad)
    const x2 = centerX + radius * Math.cos(endAngleRad)
    const y2 = centerY + radius * Math.sin(endAngleRad)

    const largeArcFlag = angle > 180 ? 1 : 0

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ')

    return {
      ...item,
      label,
      color,
      pathData,
      startAngle,
      endAngle,
    }
  })

  return (
    <div className="flex flex-col items-center space-y-4">
      <svg width="200" height="200" viewBox="0 0 200 200" className="overflow-visible">
        {segments.map((segment, index) => (
          <path
            key={segment.cancerType}
            d={segment.pathData}
            fill={segment.color}
            stroke="white"
            strokeWidth="2"
            className="hover:opacity-80 transition-opacity cursor-pointer"
          >
            <title>{`${segment.label}: ${segment.count} (${segment.percentage}%)`}</title>
          </path>
        ))}
      </svg>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full max-w-md">
        {segments.map((segment) => (
          <div
            key={segment.cancerType}
            className="flex items-center gap-2 text-sm"
          >
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: segment.color }}
            />
            <span className="font-medium">{segment.label}</span>
            <span className="text-muted-foreground">
              {segment.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

