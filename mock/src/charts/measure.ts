import { format } from "echarts/core";

/**
 * Width in pixels of one line of text. It asks ECharts' own measurer, which
 * uses the browser's canvas with the real font when there is one, so the fit
 * decisions follow the same text widths the chart draws with.
 */
export function textWidth(text: string, sizePx: number, weight: number, family: string): number {
  return format.getTextRect(text, `${weight} ${sizePx}px ${family}`).width;
}
