import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Grid, Typography, Box, Divider } from '@mui/material';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { useCSVData } from "../../hooks/CSVDataContext";
import dynamic from "next/dynamic";
import { ApexOptions } from 'apexcharts';
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ServicePriceStats {
  type: string;
  min: number;
  max: number;
  avg: number;
  variance: number;
  stdDev: number;
  count: number;
}

interface PriceVarianceData {
  serviceStats: ServicePriceStats[];
  highestVariance: string;
  lowestVariance: string;
  overallAvg: number;
}

// Function to calculate coefficient of variation (relative standard deviation)
const calculateCV = (stdDev: number, mean: number) => {
  if (!stdDev || !mean || mean === 0) return 0;
  return (stdDev / mean) * 100;
};

// Function to format price with dollar sign
const formatPrice = (price: number) => {
  if (typeof price !== 'number' || isNaN(price)) return '$0.00';
  return '$' + price.toFixed(2);
};

const PriceVariance = () => {
  const { csvData } = useCSVData();
  const [priceData, setPriceData] = useState<PriceVarianceData>({
    serviceStats: [],
    highestVariance: '',
    lowestVariance: '',
    overallAvg: 0
  });
  
  // Theme colors
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;
  const warning = theme.palette.warning.main;
  const error = theme.palette.error.main;
  const info = theme.palette.info.main;
  const success = theme.palette.success.main;

  useEffect(() => {
    if (csvData && csvData.length > 0) {
      try {
        // Get unique service types
        const serviceTypes = Array.from(new Set(csvData.map(row => 
          (row.service_type as string) || 'Unknown'
        ))).filter(type => type !== 'Unknown');
        
        // Calculate stats for each service type
        const stats = serviceTypes.map(type => {
          const serviceData = csvData.filter(row => row.service_type === type);
          const prices = serviceData
            .map(row => Number(row.cost))
            .filter(price => !isNaN(price) && price >= 0);
          
          // Handle empty price arrays
          if (prices.length === 0) {
            return {
              type,
              min: 0,
              max: 0,
              avg: 0,
              variance: 0,
              stdDev: 0,
              count: 0
            };
          }
          
          // Calculate min, max, average
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
          
          // Calculate variance and standard deviation
          const variance = prices.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / prices.length;
          const stdDev = Math.sqrt(variance);
          
          return {
            type,
            min,
            max,
            avg,
            variance,
            stdDev,
            count: prices.length
          };
        });
        
        // Filter out any stats with no data or invalid data
        const validStats = stats.filter(stat => stat.count > 0 && !isNaN(stat.avg));
        
        // Calculate overall average price
        const allPrices = csvData
          .map(row => Number(row.cost))
          .filter(price => !isNaN(price) && price >= 0);
        
        const overallAvg = allPrices.length > 0 
          ? allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length 
          : 0;
        
        // Find service with highest and lowest price variance
        const withVariance = validStats.map(s => ({
          ...s,
          cvPercent: calculateCV(s.stdDev, s.avg)
        }));
        
        const sortedByVariance = [...withVariance].sort((a, b) => b.cvPercent - a.cvPercent);
        const highestVariance = sortedByVariance.length > 0 ? sortedByVariance[0].type : '';
        const lowestVariance = sortedByVariance.length > 0 
          ? sortedByVariance[sortedByVariance.length - 1].type 
          : '';
        
        setPriceData({
          serviceStats: validStats,
          highestVariance,
          lowestVariance,
          overallAvg
        });
      } catch (error) {
        console.error("Error processing price data:", error);
        setPriceData({
          serviceStats: [],
          highestVariance: '',
          lowestVariance: '',
          overallAvg: 0
        });
      }
    }
  }, [csvData]);

  // Only render the chart if we have valid data
  const hasValidData = priceData.serviceStats && priceData.serviceStats.length > 0;

  // Fix chart options type
  const options: ApexOptions = {
    chart: {
      type: 'bar' as const,
      toolbar: {
        show: false,
      },
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
      stacked: false,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 4,
        dataLabels: {
          position: 'top',
        }
      },
    },
    colors: hasValidData ? priceData.serviceStats.map(stat => {
      const cv = calculateCV(stat.stdDev, stat.avg);
      if (cv > 25) return error;
      if (cv > 15) return warning;
      return success;
    }) : [primary],
    dataLabels: {
      enabled: true,
      formatter: function(val: number) {
        if (val === undefined || val === null || isNaN(val)) return '';
        return '$' + val.toFixed(0);
      },
      offsetY: -20,
      style: {
        fontSize: '12px',
        colors: ["#304758"]
      }
    },
    xaxis: {
      categories: hasValidData ? priceData.serviceStats.map(s => s.type) : [],
      position: 'bottom',
      labels: {
        rotate: -45,
        rotateAlways: false,
        style: {
          fontSize: '12px'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      },
      title: {
        text: 'Service Type',
        offsetY: 100
      }
    },
    yaxis: {
      title: {
        text: 'Average Price ($)'
      },
      labels: {
        formatter: function(val: number) {
          if (val === undefined || val === null || isNaN(val)) return '';
          return '$' + val.toFixed(0);
        }
      },
      min: 0
    },
    grid: {
      borderColor: 'rgba(0,0,0,0.1)',
      strokeDashArray: 3,
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: function(val: number) {
          if (val === undefined || val === null || isNaN(val)) return '';
          return '$' + val.toFixed(2);
        }
      },
      x: {
        formatter: function(val: number, { dataPointIndex }: any) {
          if (!hasValidData || dataPointIndex === undefined || 
              dataPointIndex < 0 || 
              dataPointIndex >= priceData.serviceStats.length) {
            return val.toString() || '';
          }
          
          const stat = priceData.serviceStats[dataPointIndex];
          if (!stat) return val.toString() || '';
          
          return `${val.toString()}<br>
            Min: ${formatPrice(stat.min)}<br>
            Max: ${formatPrice(stat.max)}<br>
            Range: ${formatPrice(stat.max - stat.min)}`;
        }
      }
    },
    legend: {
      show: false
    },
    responsive: [
      {
        breakpoint: 600,
        options: {
          plotOptions: {
            bar: {
              columnWidth: '80%'
            }
          },
          xaxis: {
            labels: {
              rotate: -90
            }
          }
        }
      }
    ]
  };

  const series = hasValidData ? [
    {
      name: 'Average Price',
      data: priceData.serviceStats.map(stat => {
        const price = parseFloat(stat.avg.toFixed(2));
        return isNaN(price) ? 0 : price;
      })
    }
  ] : [];

  return (
    <DashboardCard title="Price Variance Analysis">
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box height={350}>
            {hasValidData ? (
              <Chart
                options={options}
                series={series}
                type="bar"
                width="100%"
                height="350"
              />
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography variant="body2" color="textSecondary">
                  {csvData && csvData.length > 0 
                    ? "Processing data or no valid price information found" 
                    : "Upload CSV data"}
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>
        
        {hasValidData && (
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Grid container spacing={2}>
              {priceData.serviceStats.map((stat) => (
                <Grid item xs={12} md={4} key={stat.type}>
                  <Box 
                    p={2} 
                    sx={{ 
                      bgcolor: 'background.paper',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold">
                      {stat.type}
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">
                          Price Range
                        </Typography>
                        <Typography variant="body2">
                          {formatPrice(stat.min)} - {formatPrice(stat.max)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">
                          Average
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {formatPrice(stat.avg)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Box 
                          mt={1}
                          sx={{ 
                            width: '100%', 
                            height: 10, 
                            bgcolor: 'background.default',
                            borderRadius: 5,
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          <Box 
                            sx={{ 
                              position: 'absolute',
                              height: '100%',
                              left: '0%',
                              width: '100%',
                              background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${
                                calculateCV(stat.stdDev, stat.avg) > 25 ? error :
                                calculateCV(stat.stdDev, stat.avg) > 15 ? warning : 
                                success
                              } 100%)`
                            }}
                          />
                          
                          {stat.max > 0 && (
                            <>
                              <Box 
                                sx={{ 
                                  position: 'absolute',
                                  height: '100%',
                                  left: `${Math.min(100, Math.max(0, 100 * (stat.min / stat.max)))}%`,
                                  width: '2px',
                                  bgcolor: 'background.paper'
                                }}
                              />
                              
                              <Box 
                                sx={{ 
                                  position: 'absolute',
                                  height: '100%',
                                  left: `${Math.min(100, Math.max(0, 100 * (stat.avg / stat.max)))}%`,
                                  width: '2px',
                                  bgcolor: 'background.paper'
                                }}
                              />
                            </>
                          )}
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="textSecondary">
                          Price Variability
                        </Typography>
                        <Typography 
                          variant="body2" 
                          fontWeight="bold"
                          color={
                            calculateCV(stat.stdDev, stat.avg) > 25 ? error :
                            calculateCV(stat.stdDev, stat.avg) > 15 ? warning : 
                            success
                          }
                        >
                          {calculateCV(stat.stdDev, stat.avg).toFixed(1)}% {
                            calculateCV(stat.stdDev, stat.avg) > 25 ? 'High' :
                            calculateCV(stat.stdDev, stat.avg) > 15 ? 'Medium' : 
                            'Low'
                          }
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>
        )}
      </Grid>
    </DashboardCard>
  );
};

export default PriceVariance; 