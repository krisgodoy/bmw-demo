import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Grid, Typography, Box, Divider } from '@mui/material';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { useCSVData } from "../../hooks/CSVDataContext";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ServiceCostData {
  averageCost: number;
  serviceTypeCosts: Array<{
    type: string;
    averageCost: number;
    totalCost: number;
    count: number;
  }>;
  highestCost: string;
  lowestCost: string;
}

const ServiceCost = () => {
  const { csvData } = useCSVData();
  const [costData, setCostData] = useState<ServiceCostData>({
    averageCost: 0,
    serviceTypeCosts: [],
    highestCost: '',
    lowestCost: ''
  });
  
  // Theme colors
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;
  const warning = theme.palette.warning.main;

  useEffect(() => {
    if (csvData && csvData.length > 0) {
      // Calculate overall average cost
      const allCosts = csvData.map(row => Number(row.cost)).filter(cost => !isNaN(cost));
      const overallAverage = allCosts.length 
        ? allCosts.reduce((sum, cost) => sum + cost, 0) / allCosts.length 
        : 0;
      
      // Get unique service types
      const serviceTypes = Array.from(new Set(csvData.map(row => row.service_type as string)));
      
      // Calculate costs per service type
      const serviceTypeCosts = serviceTypes.map(type => {
        const serviceData = csvData.filter(row => row.service_type === type);
        const costs = serviceData.map(row => Number(row.cost)).filter(cost => !isNaN(cost));
        const totalCost = costs.reduce((sum, cost) => sum + cost, 0);
        const averageCost = costs.length ? totalCost / costs.length : 0;
        
        return {
          type,
          averageCost,
          totalCost,
          count: serviceData.length
        };
      });
      
      // Sort by average cost
      const sortedServiceCosts = [...serviceTypeCosts].sort((a, b) => b.averageCost - a.averageCost);
      
      // Find highest and lowest cost service types
      const highestCost = sortedServiceCosts.length > 0 ? sortedServiceCosts[0].type : '';
      const lowestCost = sortedServiceCosts.length > 0 
        ? sortedServiceCosts[sortedServiceCosts.length - 1].type 
        : '';
      
      setCostData({
        averageCost: parseFloat(overallAverage.toFixed(2)),
        serviceTypeCosts: sortedServiceCosts,
        highestCost,
        lowestCost
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
    colors: costData.serviceTypeCosts.map((_, index) => {
      const colors = [primary, secondary, warning];
      return colors[index % colors.length];
    }),
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '50%',
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return '$' + val.toFixed(0);
      },
      offsetX: 10,
      style: {
        fontSize: '12px',
        fontWeight: 'bold',
      },
    },
    stroke: {
      width: 1,
      colors: ['transparent'],
    },
    xaxis: {
      categories: costData.serviceTypeCosts.map(item => item.type),
      labels: {
        formatter: function (val: number) {
          return '$' + val.toFixed(0);
        },
      },
      title: {
        text: 'Average Cost ($)',
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
          return '$' + val.toFixed(2);
        },
      },
    },
  };

  const series = [
    {
      name: 'Average Cost',
      data: costData.serviceTypeCosts.map(item => parseFloat(item.averageCost.toFixed(2))),
    },
  ];

  return (
    <DashboardCard title="Service Cost Analysis">
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h3" fontWeight="700" gutterBottom>
            ${costData.averageCost}
          </Typography>
          <Typography variant="subtitle2" color="textSecondary">
            Overall Average Service Cost
          </Typography>
          
          <Divider sx={{ my: 2 }} />
        </Grid>
        
        <Grid item xs={12}>
          <Box height={200}>
            {csvData && csvData.length > 0 ? (
              <Chart
                options={options}
                series={series}
                type="bar"
                height="200"
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
            {costData.serviceTypeCosts.map((service, index) => (
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
                  <Typography variant="caption" color="textSecondary" noWrap>
                    {service.type}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    ${service.averageCost.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {service.count} services
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

export default ServiceCost; 