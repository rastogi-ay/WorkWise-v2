import type { DonutDatum } from './analyticsData';

export function DonutChart({ data, animate }: { data: DonutDatum[]; animate: boolean }) {
  const size = 200;
  const center = size / 2;
  const radius = 70;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;
  const labelRadius = radius + strokeWidth / 2 + 16;

  function polarPoint(angleDeg: number, r: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: center + r * Math.sin(rad), y: center - r * Math.cos(rad) };
  }

  let cumulative = 0;
  const segments = data.map((datum) => {
    const segmentLength = (datum.value / 100) * circumference;
    const offset = cumulative;
    cumulative += segmentLength;
    const midAngle = ((offset + segmentLength / 2) / circumference) * 360;
    return { ...datum, segmentLength, offset, midAngle };
  });

  return (
    <div className="donut-chart">
      <svg viewBox={`0 0 ${size} ${size}`} className="donut-chart__svg">
        <g transform={`rotate(-90 ${center} ${center})`}>
          {segments.map((segment, index) => (
            <circle
              key={segment.label}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={
                animate
                  ? `${segment.segmentLength} ${circumference - segment.segmentLength}`
                  : `0 ${circumference}`
              }
              strokeDashoffset={-segment.offset}
              style={{
                transition: `stroke-dasharray 700ms cubic-bezier(0.4, 0, 0.2, 1) ${index * 90}ms`,
              }}
            />
          ))}
        </g>
        {segments.map((segment, index) => {
          const pos = polarPoint(segment.midAngle, labelRadius);
          return (
            <text
              key={`${segment.label}-label`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="donut-chart__label"
              style={{
                fill: segment.color,
                opacity: animate ? 1 : 0,
                transition: `opacity 300ms ease ${500 + index * 90}ms`,
              }}
            >
              {segment.value}%
            </text>
          );
        })}
      </svg>
      <ul className="donut-chart__legend">
        {data.map((datum) => (
          <li key={datum.label}>
            <span className="donut-chart__legend-dot" style={{ backgroundColor: datum.color }} />
            {datum.label} ({datum.value}%)
          </li>
        ))}
      </ul>
    </div>
  );
}
