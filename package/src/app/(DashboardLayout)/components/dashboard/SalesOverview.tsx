import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import dynamic from "next/dynamic";
import { useCSVData } from '../../hooks/CSVDataContext';
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const SalesOverview = () => {
    const { csvData } = useCSVData();
    const [chartData, setChartData] = useState<any>({
        categories: [],
        series: []
    });
    
    // chart color
    const theme = useTheme();
    const primary = theme.palette.primary.main;
    const secondary = theme.palette.secondary.main;
    const warning = theme.palette.warning.main;

    useEffect(() => {
        if (csvData && csvData.length > 0) {
            // Process the data to get service types per month
            const serviceTypesSet = new Set(csvData.map(item => item.service_type));
            const serviceTypes = Array.from(serviceTypesSet);
            
            // Extract month from date (format MM/DD/YY)
            const getMonthFromDate = (dateStr: string) => {
                const parts = dateStr.split('/');
                const monthNum = parseInt(parts[0]);
                return monthNum;
            };

            // Get all unique months in the data
            const monthsSet = new Set(csvData.map(item => {
                const dateStr = item.service_date as string;
                return getMonthFromDate(dateStr);
            }));
            const months = Array.from(monthsSet).sort((a, b) => a - b);

            // Month names
            const monthNames = [
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
            ];
            
            // Create series data
            const seriesData = serviceTypes.map(type => {
                const data = months.map(month => {
                    return csvData.filter(item => {
                        const itemMonth = getMonthFromDate(item.service_date as string);
                        return item.service_type === type && itemMonth === month;
                    }).length;
                });
                
                return {
                    name: type,
                    data: data
                };
            });
            
            // Set chart data
            setChartData({
                categories: months.map(m => monthNames[m-1]),
                series: seriesData
            });
        }
    }, [csvData]);

    // chart options
    const optionscolumnchart: any = {
        chart: {
            type: 'bar',
            fontFamily: "'Plus Jakarta Sans', sans-serif;",
            foreColor: '#adb0bb',
            toolbar: {
                show: true,
            },
            height: 370,
            stacked: false,
        },
        colors: [primary, secondary, warning],
        plotOptions: {
            bar: {
                horizontal: false,
                barHeight: '60%',
                columnWidth: '42%',
                borderRadius: [6],
                borderRadiusApplication: 'end',
                borderRadiusWhenStacked: 'all',
            },
        },
        stroke: {
            show: true,
            width: 5,
            lineCap: "butt",
            colors: ["transparent"],
        },
        dataLabels: {
            enabled: false,
        },
        legend: {
            show: true,
            position: 'top',
        },
        grid: {
            borderColor: 'rgba(0,0,0,0.1)',
            strokeDashArray: 3,
            xaxis: {
                lines: {
                    show: false,
                },
            },
        },
        yaxis: {
            title: {
                text: 'Number of Services',
            },
        },
        xaxis: {
            categories: chartData.categories,
            axisBorder: {
                show: false,
            },
            title: {
                text: 'Months',
            },
        },
        tooltip: {
            theme: 'dark',
            fillSeriesColor: false,
        },
    };

    return (
        <DashboardCard title="Service Types by Month">
            {csvData && csvData.length > 0 ? (
                <Chart
                    options={optionscolumnchart}
                    series={chartData.series}
                    type="bar"
                    height={370} 
                    width={"100%"}
                />
            ) : (
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '370px' 
                }}>
                    Please upload CSV data to view service analysis
                </div>
            )}
        </DashboardCard>
    );
};

export default SalesOverview;
