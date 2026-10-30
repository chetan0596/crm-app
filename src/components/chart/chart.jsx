import { lazy, Suspense } from 'react';
import { Box } from '@mui/material';

const ApexChart = lazy(() => import('react-apexcharts'));

export function Chart({ type = 'line', series = [], options = {}, height = 320, width = '100%', sx, ...other }) {
  const fallback = <Box sx={{ height, minHeight: 120, width: '100%' }} />;

  return (
    <Box
      dir="ltr"
      className="component-chart"
      sx={{
        width: '100%',
        '& .apexcharts-canvas': { mx: 'auto' },
        '& .apexcharts-tooltip': {
          backgroundColor: '#FFFFFF !important',
          color: '#1C252E !important',
          border: '1px solid rgba(145, 158, 171, 0.2) !important',
          boxShadow: '0 8px 16px rgba(145, 158, 171, 0.24) !important',
          borderRadius: '8px !important',
        },
        '& .apexcharts-tooltip-title': {
          backgroundColor: '#F4F6F8 !important',
          color: '#1C252E !important',
          borderColor: 'rgba(145, 158, 171, 0.2) !important',
        },
        '& .apexcharts-tooltip-series-group': {
          backgroundColor: 'transparent !important',
        },
        '& .apexcharts-legend-text': {
          color: '#637381 !important',
        },
        ...sx,
      }}
      {...other}
    >
      <Suspense fallback={fallback}>
        <ApexChart type={type} series={series} options={options} width={width} height={height} />
      </Suspense>
    </Box>
  );
}
