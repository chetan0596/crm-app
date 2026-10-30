import { useTheme } from '@mui/material/styles';
import { varAlpha } from '../../theme/utils';

// Minimal-styled apexcharts defaults driven by the MUI theme.
export function useChart(options = {}) {
  const theme = useTheme();

  const palette = theme.vars ? theme.vars.palette : theme.palette;

  const baseOptions = {
    colors: [
      palette.primary.main,
      palette.warning.main,
      palette.info.main,
      palette.error.main,
      palette.success.main,
      palette.secondary.main,
    ],
    chart: {
      fontFamily: theme.typography.fontFamily,
      foreColor: palette.text.disabled,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { speed: 400 },
      parentHeightOffset: 0,
    },
    grid: {
      borderColor: palette.divider,
      strokeDashArray: 3,
      xaxis: { lines: { show: false } },
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
    },
    stroke: { curve: 'smooth', width: 2.5 },
    dataLabels: { enabled: false },
    tooltip: {
      theme: 'light',
      fillSeriesColor: false,
      style: { fontSize: theme.typography.pxToRem(13) },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontWeight: 600,
      fontSize: theme.typography.pxToRem(13),
      markers: { size: 5, shape: 'circle' },
      labels: { colors: palette.text.primary },
      itemMargin: { horizontal: 12 },
    },
    xaxis: {
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: palette.text.secondary, fontSize: theme.typography.pxToRem(12) } },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: { style: { colors: palette.text.secondary, fontSize: theme.typography.pxToRem(12) } },
    },
    states: {
      hover: { filter: { type: 'none' } },
      active: { filter: { type: 'none' } },
    },
    fill: { opacity: 1 },
  };

  // Deep merge (simple, handles nested plain objects)
  const merge = (target, source) => {
    const out = { ...target };
    Object.keys(source || {}).forEach((key) => {
      const sv = source[key];
      if (sv && typeof sv === 'object' && !Array.isArray(sv) && target[key] && typeof target[key] === 'object') {
        out[key] = merge(target[key], sv);
      } else {
        out[key] = sv;
      }
    });
    return out;
  };

  return merge(baseOptions, options);
}

export function bgGradient({ color, imgUrl }) {
  if (imgUrl) {
    return {
      background: `linear-gradient(${color}), url(${imgUrl})`,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center center',
    };
  }
  return { background: `linear-gradient(${color})` };
}

export function chartGradient(colorChannel) {
  return {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.4,
      opacityTo: 0.05,
      stops: [0, 100],
      colorStops: [
        [
          { offset: 0, color: varAlpha(colorChannel, 0.4), opacity: 1 },
          { offset: 100, color: varAlpha(colorChannel, 0.05), opacity: 1 },
        ],
      ],
    },
  };
}
