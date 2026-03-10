'use client'

/**
 * ConsumptionChart — year-over-year grouped bar chart.
 *
 * Shows Books / Movies / TV seasons consumed per year.
 * Horizontally scrollable so all years fit on mobile without cramping.
 * Colors stay within the app's navy/blue hue family.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts'
import type { MediaItem } from '@/lib/types'

// ─── Palette ──────────────────────────────────────────────────────────────────
// Three shades of navy/blue matching the app's oklch(* * 258°) palette.

const COLORS = {
  Books:    '#1e3a5f',   // deep navy   — close to app foreground
  Movies:   '#3a6d9e',   // mid blue
  TV:       '#7aafd4',   // sky blue
} as const

type Category = keyof typeof COLORS

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChartRow {
  year: string
  Books: number
  Movies: number
  TV: number
}

interface ConsumptionChartProps {
  items: MediaItem[]
  /** Earliest year to show. Defaults to 2018. */
  fromYear?: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildChartData(items: MediaItem[], fromYear: number): ChartRow[] {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let y = fromYear; y <= currentYear; y++) years.push(y)

  return years.map((year) => {
    const forYear = items.filter(
      (i) => i.status === 'done' && i.consumedYear === year
    )
    return {
      year: String(year),
      Books:  forYear.filter((i) => i.mediaType === 'book').length,
      Movies: forYear.filter((i) => i.mediaType === 'movie').length,
      TV:     forYear.filter((i) => i.mediaType === 'tv_season').length,
    }
  })
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-md text-sm">
      <p className="mb-1.5 font-semibold">{label}</p>
      {(payload as { name: Category; value: number }[]).map(({ name, value }) => (
        <div key={name} className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-sm"
            style={{ background: COLORS[name] }}
          />
          <span className="text-muted-foreground">{name}</span>
          <span className="ml-auto font-medium tabular-nums">{value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function ChartLegend() {
  return (
    <div className="mb-3 flex gap-4">
      {(Object.entries(COLORS) as [Category, string][]).map(([label, color]) => (
        <div key={label} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ConsumptionChart({ items, fromYear = 2018 }: ConsumptionChartProps) {
  const data = buildChartData(items, fromYear)
  const yearCount = data.length

  // Give each year group ~56px so bars never feel cramped.
  // On narrow screens this overflows horizontally — the outer div scrolls.
  const chartWidth = Math.max(yearCount * 56, 280)

  return (
    <div>
      <ChartLegend />

      {/* Horizontal scroll wrapper */}
      <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div style={{ width: chartWidth }}>
          {/* ResponsiveContainer stretches to the explicit pixel width above */}
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={data}
              margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
              barCategoryGap="28%"
              barGap={2}
            >
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={36}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
              />
              <Bar dataKey="Books"  fill={COLORS.Books}  radius={[3, 3, 0, 0]} />
              <Bar dataKey="Movies" fill={COLORS.Movies} radius={[3, 3, 0, 0]} />
              <Bar dataKey="TV"     fill={COLORS.TV}     radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
