import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { useTheme } from '@mui/material/styles';
import { Grid, Stack, Typography, Avatar, Box } from '@mui/material';
import { IconDeviceMobile, IconDeviceDesktopAnalytics } from '@tabler/icons-react';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { useCSVData } from "../../hooks/CSVDataContext";
import { useEffect, useState } from "react";

interface EngagementData {
  digital: number;
  nonDigital: number;
  totalCustomers: number;
  digitalPercentage: number;
}

const DigitalEngagment = () => {
  const { csvData } = useCSVData();
  const [engagementData, setEngagementData] = useState<EngagementData>({
    digital: 0,
    nonDigital: 0,
    totalCustomers: 0,
    digitalPercentage: 0
  });

  // Calculate digital engagement stats
  useEffect(() => {
    if (csvData && csvData.length > 0) {
      // Count digital vs non-digital
      const digital = csvData.filter(row => 
        row.digital_engagement === 'Yes' || 
        row.digital_engagement === true || 
        row.digital_engagement === 'yes'
      ).length;
      
      const nonDigital = csvData.filter(row => 
        row.digital_engagement === 'No' || 
        row.digital_engagement === false || 
        row.digital_engagement === 'no'
      ).length;
      
      const totalCustomers = digital + nonDigital;
      const digitalPercentage = totalCustomers > 0 
        ? Math.round((digital / totalCustomers) * 100) 
        : 0;
      
      setEngagementData({
        digital,
        nonDigital,
        totalCustomers,
        digitalPercentage
      });
    }
  }, [csvData]);

  // chart color
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;
  const successlight = theme.palette.success.light;

  // chart
  const optionscolumnchart: any = {
    chart: {
      type: 'donut',
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
      foreColor: '#adb0bb',
      toolbar: {
        show: false,
      },
      offsetY: -10,
    },
    colors: [primary, secondary],
    plotOptions: {
      pie: {
        startAngle: 0,
        endAngle: 360,
        donut: {
          size: '80%',
          background: 'transparent',
          labels: {
            show: true,
            name: {
              show: true,
              offsetY: 20,
            },
            value: {
              show: true,
              fontSize: '22px',
              fontFamily: "'Plus Jakarta Sans', sans-serif;",
              fontWeight: 600,
              offsetY: -20,
            },
            total: {
              show: false,
            }
          }
        },
      },
    },
    tooltip: {
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
      fillSeriesColor: false,
    },
    stroke: {
      width: 0,
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    responsive: [
      {
        breakpoint: 991,
        options: {
          chart: {
            width: 120,
          },
        },
      },
    ],
    labels: ['Digital', 'Non-Digital'],
  };
  
  const seriescolumnchart: any = csvData && csvData.length > 0 
    ? [engagementData.digital, engagementData.nonDigital] 
    : [50, 50];

  return (
    <DashboardCard title="Digital Engagement">
      <Grid container spacing={3} alignItems="center">
        {/* left column */}
        <Grid item xs={7} sm={7}>
          <Typography variant="h3" fontWeight="700">
            {engagementData.digitalPercentage}%
          </Typography>
          <Typography variant="subtitle1" color="textSecondary" gutterBottom>
            Digital Engagement Rate
          </Typography>
          
          <Stack spacing={3} mt={3}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box 
                sx={{
                  width: 12,
                  height: 12,
                  bgcolor: primary,
                  borderRadius: '50%'
                }}
              />
              <Typography variant="subtitle2" color="textSecondary">
                Digital: {engagementData.digital} customers
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box 
                sx={{
                  width: 12,
                  height: 12,
                  bgcolor: secondary,
                  borderRadius: '50%'
                }}
              />
              <Typography variant="subtitle2" color="textSecondary">
                Non-Digital: {engagementData.nonDigital} customers
              </Typography>
            </Stack>
          </Stack>
        </Grid>
        
        {/* right column */}
        <Grid item xs={5} sm={5}>
          {csvData && csvData.length > 0 ? (
            <Box sx={{ height: 180, display: 'flex', justifyContent: 'center' }}>
              <Chart
                options={optionscolumnchart}
                series={seriescolumnchart}
                type="donut"
                height="180"
                width="180"
              />
            </Box>
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" height="180px">
              <Typography variant="body2" color="textSecondary">
                Upload CSV data
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </DashboardCard>
  );
};

export default DigitalEngagment;
