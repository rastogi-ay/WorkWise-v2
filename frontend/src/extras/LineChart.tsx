import { useEffect, useRef, useState } from 'react';
import type { LinePoint } from './analyticsData';

function buildSmoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function LineChart({ data, animate }: { data: LinePoint[]; animate: boolean }) {
  const width = 640;
  const height = 280;
  const paddingLeft = 42;
  const paddingRight = 12;
  const paddingTop = 12;
  const paddingBottom = 28;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;
  const maxValue = 100;
  const stepX = plotWidth / (data.length - 1);

  const points = data.map((datum, index) => ({
    x: paddingLeft + index * stepX,
    y: paddingTop + plotHeight * (1 - datum.value / maxValue),
    ...datum,
  }));

  const linePath = buildSmoothPath(points);
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  const gridLines = [0, 25, 50, 75, 100];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="line-chart__svg">
      {gridLines.map((tick) => {
        const y = paddingTop + plotHeight * (1 - tick / 100);
        return (
          <g key={tick}>
            <line
              x1={paddingLeft}
              y1={y}
              x2={width - paddingRight}
              y2={y}
              className="line-chart__grid"
            />
            <text
              x={paddingLeft - 10}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              className="line-chart__axis-label"
            >
              {tick}%
            </text>
          </g>
        );
      })}
      {points.map((point, index) => (
        <text
          key={point.hour}
          x={point.x}
          y={height - 6}
          textAnchor="middle"
          className="line-chart__axis-label"
          style={{
            opacity: index === 0 || index === points.length - 1 || index % 2 === 1 ? 1 : 0.7,
          }}
        >
          {point.hour}
        </text>
      ))}
      <path
        ref={pathRef}
        d={linePath}
        fill="none"
        className="line-chart__line"
        strokeDasharray={pathLength}
        strokeDashoffset={animate ? 0 : pathLength}
        style={{
          transition: 'stroke-dashoffset 1.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
      {points.map((point, index) => (
        <circle
          key={point.hour}
          cx={point.x}
          cy={point.y}
          r={4}
          className="line-chart__dot"
          style={{
            opacity: animate ? 1 : 0,
            transition: `opacity 300ms ease ${900 + index * 60}ms`,
          }}
        >
          <title>{`${point.hour}: ${point.value}%`}</title>
        </circle>
      ))}
    </svg>
  );
}
