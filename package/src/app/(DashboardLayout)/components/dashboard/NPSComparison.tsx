import React, { useEffect, useState } from 'react';
import { useTheme, alpha } from '@mui/material/styles';
import { Grid, Stack, Typography, Box } from '@mui/material';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { useCSVData } from "../../hooks/CSVDataContext";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface NPSComparisonData {
  digital: {
    npsScore: number;
    avgRating: number;
    count: number;
  };
  nonDigital: {
    npsScore: number;
    avgRating: number;
    count: number;
  };
  difference: number;
}

const NPSComparison = () => {
  const { csvData } = useCSVData();
  const [comparisonData, setComparisonData] = useState<NPSComparisonData>({
    digital: { npsScore: 0, avgRating: 0, count: 0 },
    nonDigital: { npsScore: 0, avgRating: 0, count: 0 },
    difference: 0
  });
  
  // Theme colors
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;
  const success = theme.palette.success.main;
  const error = theme.palette.error.main;

  useEffect(() => {
    if (csvData && csvData.length > 0) {
      // Extract digital and non-digital data
      const digitalData = csvData.filter(row => 
        row.digital_engagement === 'Yes' || 
        row.digital_engagement === true || 
        row.digital_engagement === 'yes'
      );
      
      const nonDigitalData = csvData.filter(row => 
        row.digital_engagement === 'No' || 
        row.digital_engagement === false || 
        row.digital_engagement === 'no'
      );
      
      // Calculate NPS for digital customers
      const digitalScores = digitalData.map(row => Number(row.nps_score)).filter(score => !isNaN(score));
      const digitalAvg = digitalScores.length 
        ? digitalScores.reduce((sum, score) => sum + score, 0) / digitalScores.length 
        : 0;
      
      const digitalDetractors = digitalScores.filter(score => score >= 0 && score <= 6).length;
      const digitalPromoters = digitalScores.filter(score => score >= 9 && score <= 10).length;
      const digitalNPS = digitalScores.length 
        ? ((digitalPromoters / digitalScores.length) - (digitalDetractors / digitalScores.length)) * 100 
        : 0;
      
      // Calculate NPS for non-digital customers
      const nonDigitalScores = nonDigitalData.map(row => Number(row.nps_score)).filter(score => !isNaN(score));
      const nonDigitalAvg = nonDigitalScores.length 
        ? nonDigitalScores.reduce((sum, score) => sum + score, 0) / nonDigitalScores.length 
        : 0;
      
      const nonDigitalDetractors = nonDigitalScores.filter(score => score >= 0 && score <= 6).length;
      const nonDigitalPromoters = nonDigitalScores.filter(score => score >= 9 && score <= 10).length;
      const nonDigitalNPS = nonDigitalScores.length 
        ? ((nonDigitalPromoters / nonDigitalScores.length) - (nonDigitalDetractors / nonDigitalScores.length)) * 100 
        : 0;
      
      // Calculate difference
      const difference = digitalNPS - nonDigitalNPS;
      
      setComparisonData({
        digital: {
          npsScore: Math.round(digitalNPS),
          avgRating: parseFloat(digitalAvg.toFixed(1)),
          count: digitalData.length
        },
        nonDigital: {
          npsScore: Math.round(nonDigitalNPS),
          avgRating: parseFloat(nonDigitalAvg.toFixed(1)),
          count: nonDigitalData.length
        },
        difference: Math.round(difference)
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
    xaxis: {
      categories: ['Digital', 'Non-Digital'],
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
  };

  const series = [
    {
      name: 'NPS Score',
      data: [comparisonData.digital.npsScore, comparisonData.nonDigital.npsScore],
    },
  ];

  return (
    <DashboardCard title="Digital vs Non-Digital NPS">
      <Grid container spacing={3}>
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
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box 
                p={2} 
                sx={{ 
                  bgcolor: 'background.paper', 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider' 
                }}
              >
                <Typography variant="subtitle2" color="textSecondary">
                  Digital Customers
                </Typography>
                <Typography variant="h4" color={primary} fontWeight="bold">
                  {comparisonData.digital.npsScore}
                </Typography>
                <Typography variant="body2">
                  Avg Rating: {comparisonData.digital.avgRating} · {comparisonData.digital.count} customers
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6}>
              <Box 
                p={2} 
                sx={{ 
                  bgcolor: 'background.paper', 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="subtitle2" color="textSecondary">
                  Non-Digital Customers
                </Typography>
                <Typography variant="h4" color={secondary} fontWeight="bold">
                  {comparisonData.nonDigital.npsScore}
                </Typography>
                <Typography variant="body2">
                  Avg Rating: {comparisonData.nonDigital.avgRating} · {comparisonData.nonDigital.count} customers
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box 
                p={2} 
                sx={{ 
                  bgcolor: comparisonData.difference > 0 ? alpha(success, 0.1) : alpha(error, 0.1),
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: comparisonData.difference > 0 ? success : error,
                }}
              >
                <Typography variant="subtitle2" align="center">
                  Difference in NPS
                </Typography>
                <Typography 
                  variant="h4" 
                  align="center" 
                  color={comparisonData.difference > 0 ? success : error}
                  fontWeight="bold"
                >
                  {comparisonData.difference > 0 ? '+' : ''}{comparisonData.difference} points
                </Typography>
                <Typography variant="body2" align="center">
                  {comparisonData.difference > 0 
                    ? "Digital customers have higher NPS"
                    : comparisonData.difference < 0
                      ? "Non-digital customers have higher NPS"
                      : "Equal NPS between both groups"
                  }
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </DashboardCard>
  );
};

export default NPSComparison; 