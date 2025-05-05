import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Grid, Typography, Box, Divider, ToggleButton, ToggleButtonGroup } from '@mui/material';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { useCSVData } from "../../hooks/CSVDataContext";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface NPSServiceDigitalData {
  categories: string[];
  digital: number[];
  nonDigital: number[];
}

const NPSServiceDigital = () => {
  const { csvData } = useCSVData();
  const [chartData, setChartData] = useState<NPSServiceDigitalData>({
    categories: [],
    digital: [],
    nonDigital: []
  });
  
  // Theme colors
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;
  const success = theme.palette.success.main;
  const error = theme.palette.error.main;

  useEffect(() => {
    if (csvData && csvData.length > 0) {
      // Get unique service types
      const serviceTypes = Array.from(new Set(csvData.map(row => row.service_type as string)));
      
      // Calculate NPS for each service type split by digital engagement
      const digitalNPS = serviceTypes.map(type => {
        const serviceDigitalData = csvData.filter(row => 
          row.service_type === type && 
          (row.digital_engagement === 'Yes' || row.digital_engagement === true || row.digital_engagement === 'yes')
        );
        
        const scores = serviceDigitalData.map(row => Number(row.nps_score)).filter(score => !isNaN(score));
        
        // Calculate NPS using the standard formula
        const detractors = scores.filter(score => score >= 0 && score <= 6).length;
        const promoters = scores.filter(score => score >= 9 && score <= 10).length;
        const npsScore = scores.length 
          ? ((promoters / scores.length) - (detractors / scores.length)) * 100 
          : 0;
        
        return Math.round(npsScore);
      });
      
      // Calculate non-digital NPS for each service type
      const nonDigitalNPS = serviceTypes.map(type => {
        const serviceNonDigitalData = csvData.filter(row => 
          row.service_type === type && 
          (row.digital_engagement === 'No' || row.digital_engagement === false || row.digital_engagement === 'no')
        );
        
        const scores = serviceNonDigitalData.map(row => Number(row.nps_score)).filter(score => !isNaN(score));
        
        // Calculate NPS using the standard formula
        const detractors = scores.filter(score => score >= 0 && score <= 6).length;
        const promoters = scores.filter(score => score >= 9 && score <= 10).length;
        const npsScore = scores.length 
          ? ((promoters / scores.length) - (detractors / scores.length)) * 100 
          : 0;
        
        return Math.round(npsScore);
      });
      
      setChartData({
        categories: serviceTypes,
        digital: digitalNPS,
        nonDigital: nonDigitalNPS
      });
    }
  }, [csvData]);

  // Chart options
  const options: any = {
    chart: {
      type: 'bar',
      toolbar: {
        show: false,
      },
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
      stacked: false,
    },
    colors: [primary, secondary],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    grid: {
      borderColor: 'rgba(0,0,0,0.1)',
      strokeDashArray: 3,
    },
    xaxis: {
      categories: chartData.categories,
      title: {
        text: 'Service Type',
      },
    },
    yaxis: {
      title: {
        text: 'NPS Score',
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val + " NPS";
        },
      },
    },
    legend: {
      position: 'top',
    },
  };

  const series = [
    {
      name: 'Digital',
      data: chartData.digital,
    },
    {
      name: 'Non-Digital',
      data: chartData.nonDigital,
    },
  ];

  // Find best performers for each service type
  const getBestPerformer = (serviceIndex: number) => {
    const digitalNPS = chartData.digital[serviceIndex];
    const nonDigitalNPS = chartData.nonDigital[serviceIndex];
    
    if (digitalNPS > nonDigitalNPS) return 'Digital';
    if (nonDigitalNPS > digitalNPS) return 'Non-Digital';
    return 'Equal';
  };

  // Calculate the difference between digital and non-digital
  const getDifference = (serviceIndex: number) => {
    return chartData.digital[serviceIndex] - chartData.nonDigital[serviceIndex];
  };

  return (
    <DashboardCard title="NPS by Service Type & Digital Engagement">
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box height={300}>
            {csvData && csvData.length > 0 ? (
              <Chart
                options={options}
                series={series}
                type="bar"
                height="300"
              />
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography variant="body2" color="textSecondary">
                  Upload CSV data
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
          <Grid container spacing={2}>
            {chartData.categories.map((service, index) => (
              <Grid item xs={12} sm={4} key={service}>
                <Box 
                  p={2} 
                  sx={{ 
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold" noWrap>
                    {service}
                  </Typography>
                  
                  <Grid container spacing={1} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">
                        Digital
                      </Typography>
                      <Typography variant="h6" color={primary}>
                        {chartData.digital[index]}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">
                        Non-Digital
                      </Typography>
                      <Typography variant="h6" color={secondary}>
                        {chartData.nonDigital[index]}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Box 
                    mt={1} 
                    py={0.5} 
                    px={1} 
                    sx={{ 
                      bgcolor: getDifference(index) > 0 ? 'success.light' : 
                                getDifference(index) < 0 ? 'error.light' : 'action.selected',
                      borderRadius: 1,
                      display: 'inline-block'
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      fontWeight="bold"
                      color={getDifference(index) > 0 ? 'success.dark' : 
                              getDifference(index) < 0 ? 'error.dark' : 'text.primary'}
                    >
                      {getBestPerformer(index)} 
                      {getDifference(index) !== 0 && 
                        ` by ${Math.abs(getDifference(index))} points`
                      }
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </DashboardCard>
  );
};

export default NPSServiceDigital; 