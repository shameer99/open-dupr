"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "@/lib/utils"

// Re-export all recharts primitives
export const Area = RechartsPrimitive.Area
export const AreaChart = RechartsPrimitive.AreaChart
export const Bar = RechartsPrimitive.Bar
export const BarChart = RechartsPrimitive.BarChart
export const CartesianGrid = RechartsPrimitive.CartesianGrid
export const Cell = RechartsPrimitive.Cell
export const ComposedChart = RechartsPrimitive.ComposedChart
export const Curve = RechartsPrimitive.Curve
export const Dot = RechartsPrimitive.Dot
export const Funnel = RechartsPrimitive.Funnel
export const FunnelChart = RechartsPrimitive.FunnelChart
export const Label = RechartsPrimitive.Label
export const LabelList = RechartsPrimitive.LabelList
export const Legend = RechartsPrimitive.Legend
export const Line = RechartsPrimitive.Line
export const LineChart = RechartsPrimitive.LineChart
export const Pie = RechartsPrimitive.Pie
export const PieChart = RechartsPrimitive.PieChart
export const PolarAngleAxis = RechartsPrimitive.PolarAngleAxis
export const PolarGrid = RechartsPrimitive.PolarGrid
export const PolarRadiusAxis = RechartsPrimitive.PolarRadiusAxis
export const Radar = RechartsPrimitive.Radar
export const RadarChart = RechartsPrimitive.RadarChart
export const RadialBar = RechartsPrimitive.RadialBar
export const RadialBarChart = RechartsPrimitive.RadialBarChart
export const Rectangle = RechartsPrimitive.Rectangle
export const ReferenceArea = RechartsPrimitive.ReferenceArea
export const ReferenceDot = RechartsPrimitive.ReferenceDot
export const ReferenceLine = RechartsPrimitive.ReferenceLine
export const ResponsiveContainer = RechartsPrimitive.ResponsiveContainer
export const Scatter = RechartsPrimitive.Scatter
export const ScatterChart = RechartsPrimitive.ScatterChart
export const Sector = RechartsPrimitive.Sector
export const Surface = RechartsPrimitive.Surface
export const Tooltip = RechartsPrimitive.Tooltip
export const XAxis = RechartsPrimitive.XAxis
export const YAxis = RechartsPrimitive.YAxis
export const ZAxis = RechartsPrimitive.ZAxis

// Chart container component
export interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: Record<string, { label?: string; color?: string }>
  children: React.ReactNode
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ config, children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("w-full", className)}
        style={
          {
            "--chart-1": config.singles?.color || "hsl(var(--chart-1))",
            "--chart-2": config.doubles?.color || "hsl(var(--chart-2))",
            "--chart-3": config.chart3?.color || "hsl(var(--chart-3))",
            "--chart-4": config.chart4?.color || "hsl(var(--chart-4))",
            "--chart-5": config.chart5?.color || "hsl(var(--chart-5))",
          } as React.CSSProperties
        }
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    )
  }
)
ChartContainer.displayName = "ChartContainer"

// Chart tooltip component
interface TooltipPayloadItem {
  dataKey?: string
  name?: string
  value?: number
  color?: string
}

export interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  className?: string
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: "line" | "dot" | "dashed"
  nameKey?: string
  labelKey?: string
  label?: string | number
  labelFormatter?: (value: string | number, payload: TooltipPayloadItem[]) => string
  labelClassName?: string
  formatter?: (value: number, name: string, item: TooltipPayloadItem, index: number, payload: TooltipPayloadItem[]) => [string, string]
  color?: string
}

const ChartTooltip = React.forwardRef<HTMLDivElement, ChartTooltipProps>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const key = `${labelKey || payload[0]?.dataKey || payload[0]?.name || "value"}`
      const value =
        typeof label === "string"
          ? label
          : labelFormatter
            ? labelFormatter(label, payload)
            : label

      return (
        <div className={cn("grid gap-1.5", labelClassName)}>
          <div className="flex items-center gap-2.5 px-1">
            {!hideIndicator && (
              <div
                className={cn(
                  "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                  {
                    "h-0 w-4 border-t-2": indicator === "line",
                    "h-2 w-2 rounded-full": indicator === "dot",
                    "h-0 w-4 border-t-2 border-dashed": indicator === "dashed",
                  }
                )}
                style={
                  {
                    "--color-bg": color || item.color,
                    "--color-border": color || item.color,
                  } as React.CSSProperties
                }
              />
            )}
            <div className="flex flex-1 items-center justify-between gap-4">
              <div className="grid gap-1.5">
                <div className="text-[--color-text] text-xs">
                  {typeof value === "string" ? value : key}
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }, [
      color,
      hideIndicator,
      hideLabel,
      indicator,
      label,
      labelClassName,
      labelFormatter,
      labelKey,
      payload,
    ])

    if (!active || !payload?.length) {
      return null
    }

    const [item] = payload

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-[--color-border] bg-[--color-bg] p-2.5 shadow-lg",
          className
        )}
        style={
          {
            "--color-bg": "hsl(var(--background))",
            "--color-border": "hsl(var(--border))",
            "--color-text": "hsl(var(--foreground))",
          } as React.CSSProperties
        }
      >
        {tooltipLabel}
        <div className="grid gap-1.5">
          {payload.map((item: TooltipPayloadItem, index: number) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const value =
              formatter && item.value !== undefined && item.name
                ? formatter(item.value, item.name, item, index, payload)
                : item.value

            return (
              <div key={item.dataKey} className="flex items-center gap-2.5 px-1">
                {!hideIndicator && (
                  <div
                    className={cn(
                      "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                      {
                        "h-0 w-4 border-t-2": indicator === "line",
                        "h-2 w-2 rounded-full": indicator === "dot",
                        "h-0 w-4 border-t-2 border-dashed": indicator === "dashed",
                      }
                    )}
                    style={
                      {
                        "--color-bg": item.color,
                        "--color-border": item.color,
                      } as React.CSSProperties
                    }
                  />
                )}
                <div className="flex flex-1 items-center justify-between gap-4">
                  <div className="grid gap-1.5">
                    <div className="text-[--color-text] text-xs">
                      {typeof key === "string" ? key : item.name}
                    </div>
                  </div>
                  {item.value !== undefined && (
                    <div className="font-mono text-[--color-text] text-xs font-medium tabular-nums">
                      {typeof value === "string" ? value : item.value}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltip.displayName = "ChartTooltip"

const ChartTooltipContent = ChartTooltip

// Chart legend component
interface LegendPayloadItem {
  dataKey?: string
  value?: string
  color?: string
}

export interface ChartLegendProps {
  className?: string
  hideIcon?: boolean
  nameKey?: string
  payload?: LegendPayloadItem[]
  verticalAlign?: "top" | "bottom" | "middle"
  align?: "left" | "center" | "right"
  iconType?: "rect" | "circle"
}

const ChartLegend = React.forwardRef<HTMLDivElement, ChartLegendProps>(
  (
    {
      className,
      hideIcon = false,
      nameKey,
      payload,
      verticalAlign = "bottom",
      iconType = "rect",
      ...props
    },
    ref
  ) => {
    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          {
            "flex-col": verticalAlign === "top" || verticalAlign === "bottom",
            "flex-row": verticalAlign === "middle",
          },
          className
        )}
        {...props}
      >
        {payload.map((item: LegendPayloadItem) => {
          const key = `${nameKey || item.dataKey || "value"}`

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-[--color-text]"
              )}
              style={
                {
                  "--color-text": item.color,
                } as React.CSSProperties
              }
            >
              {!hideIcon &&
                (iconType === "rect" ? (
                  <div
                    className="h-2 w-3 shrink-0 rounded-[2px]"
                    style={{
                      backgroundColor: "var(--color-text)",
                    }}
                  />
                ) : (
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor: "var(--color-text)",
                    }}
                  />
                ))}
              <span className="text-[--color-text] text-xs">
                {typeof key === "string" ? key : item.value}
              </span>
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegend.displayName = "ChartLegend"

const ChartLegendContent = ChartLegend

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
}