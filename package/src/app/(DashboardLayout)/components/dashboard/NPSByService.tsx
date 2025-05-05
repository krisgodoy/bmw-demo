import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Grid, Typography, Box, Divider } from '@mui/material';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { useCSVData } from "../../hooks/CSVDataContext";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface NPSByServiceData {
  serviceTypeNPS: Array<{
    type: string;
    npsScore: number;
    avgRating: number;
    count: number;
  }>;
  bestPerformer: string;
  worstPerformer: string;
}

const NPSByService = () => {
  const { csvData } = useCSVData();
  const [npsData, setNpsData] = useState<NPSByServiceData>({
    serviceTypeNPS: [],
    bestPerformer: '',
    worstPerformer: ''
  });
  
  // Theme colors
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;
  const success = theme.palette.success.main;
  const warning = theme.palette.warning.main;
  const error = theme.palette.error.main;

  useEffect(() => {
    if (csvData && csvData.length > 0) {
      // Get unique service types
      const serviceTypes = Array.from(new Set(csvData.map(row => row.service_type as string)));
      
      // Calculate NPS per service type
      const serviceTypeNPS = serviceTypes.map(type => {
        const serviceData = csvData.filter(row => row.service_type === type);
        const scores = serviceData.map(row => Number(row.nps_score)).filter(score => !isNaN(score));
        
        // Calculate average rating
        const avgRating = scores.length 
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
          : 0;
        
        // Calculate NPS using the standard formula
        const detractors = scores.filter(score => score >= 0 && score <= 6).length;
        const promoters = scores.filter(score => score >= 9 && score <= 10).length;
        const npsScore = scores.length 
          ? ((promoters / scores.length) - (detractors / scores.length)) * 100 
          : 0;
        
        return {
          type,
          npsScore: Math.round(npsScore),
          avgRating: parseFloat(avgRating.toFixed(1)),
          count: serviceData.length
        };
      });
      
      // Sort by NPS score
      const sortedNPS = [...serviceTypeNPS].sort((a, b) => b.npsScore - a.npsScore);
      
      // Find best and worst performers
      const bestPerformer = sortedNPS.length > 0 ? sortedNPS[0].type : '';
      const worstPerformer = sortedNPS.length > 0 
        ? sortedNPS[sortedNPS.length - 1].type 
        : '';
      
      setNpsData({
        serviceTypeNPS: sortedNPS,
        bestPerformer,
        worstPerformer
      });
    }
  }, [csvData]);

  // Get the appropriate color based on NPS score
  const getNPSColor = (score: number) => {
    if (score >= 50) return success;
    if (score >= 0) return warning;
    return error;
  };

  // Chart options
  const options: any = {
    chart: {
      type: 'bar',
      toolbar: {
        show: false,
      },
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '60%',
        borderRadius: 4,
        distributed: true,
      },
    },
    colors: npsData.serviceTypeNPS.map(item => getNPSColor(item.npsScore)),
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val;
      },
      style: {
        fontSize: '12px',
        fontWeight: 'bold',
        colors: ['#fff']
      },
      background: {
        enabled: false
      }
    },
    stroke: {
      width: 1,
      colors: ['transparent'],
    },
    grid: {
      borderColor: 'rgba(0,0,0,0.1)',
      strokeDashArray: 3,
    },
    xaxis: {
      categories: npsData.serviceTypeNPS.map(item => item.type),
      title: {
        text: 'NPS Score',
      },
    },
    yaxis: {
      title: {
        text: 'Service Type',
      },
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val + " NPS";
        },
      },
    },
    legend: {
      show: false,
    },
  };

  const series = [
    {
      name: 'NPS Score',
      data: npsData.serviceTypeNPS.map(item => item.npsScore),
    },
  ];

  return (
    <DashboardCard title="NPS by Service Type">
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box height={250}>
            {csvData && csvData.length > 0 ? (
              <Chart
                options={options}
                series={series}
                type="bar"
                height="250"
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
            {npsData.serviceTypeNPS.map((service) => (
              <Grid item xs={4} key={service.type}>
                <Box 
                  p={1.5} 
                  sx={{ 
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="subtitle2" noWrap>
                    {service.type}
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color={getNPSColor(service.npsScore)}>
                    {service.npsScore}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Avg Rating: {service.avgRating}/10
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </DashboardCard>
  );
};

export default NPSByService; 