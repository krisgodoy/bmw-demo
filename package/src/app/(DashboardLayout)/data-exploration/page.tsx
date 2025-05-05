"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Alert,
  Stack,
  Divider,
  Tabs,
  Tab,
} from "@mui/material";
import { useRouter } from "next/navigation";
import PageContainer from "../components/container/PageContainer";
import { useCSVData } from "@/app/(DashboardLayout)/hooks/CSVDataContext";
import MonthlyEarnings from "../components/dashboard/MonthlyEarnings";
import SalesOverview from "../components/dashboard/SalesOverview";
import NPSScore from "../components/dashboard/NPSScore";
import DigitalEngagment from "../components/dashboard/DigitalEngagment";
import NPSComparison from "../components/dashboard/NPSComparison";
import ServiceCost from "../components/dashboard/ServiceCost";
import NPSByService from "../components/dashboard/NPSByService";
import NPSServiceDigital from "../components/dashboard/NPSServiceDigital";
import PriceVariance from "../components/dashboard/PriceVariance";

const DataExplorationPage = () => {
  const { csvData, headers } = useCSVData();
  const router = useRouter();
  const [hasData, setHasData] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    // Check if we have data
    setHasData(csvData.length > 0);
  }, [csvData]);

  const handleBack = () => {
    router.push("/");
  };

  if (!hasData) {
    return (
      <PageContainer
        title="Data Exploration"
        description="Explore and analyze your CSV data"
      >
        <Container maxWidth="lg">
          <Card>
            <CardContent>
              <Alert severity="warning" sx={{ mb: 2 }}>
                No CSV data found. Please upload a CSV file first.
              </Alert>
              <Button variant="contained" onClick={handleBack}>
                Go to Upload Page
              </Button>
            </CardContent>
          </Card>
        </Container>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Data Exploration"
      description="Explore and analyze your CSV data"
    >
      <Container maxWidth="xl" sx={{ width: '100%' }}>
        <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h3">Service Data Analysis</Typography>
          <Button variant="outlined" onClick={handleBack}>
            Back to Upload
          </Button>
        </Box>

        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" />
          <Tab label="Service Analysis" />
          <Tab label="Customer Experience" />
          <Tab label="Raw Data" />
        </Tabs>

        {/* Overview Tab */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <SalesOverview />
            </Grid>
            <Grid item xs={12} lg={4}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <NPSScore />
                </Grid>
                <Grid item xs={12}>
                  <DigitalEngagment />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} lg={6}>
              <ServiceCost />
            </Grid>
            <Grid item xs={12} lg={6}>
              <NPSComparison />
            </Grid>
          </Grid>
        )}

        {/* Service Analysis Tab */}
        {tabValue === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <ServiceCost />
            </Grid>
            <Grid item xs={12} lg={6}>
              <SalesOverview />
            </Grid>
            <Grid item xs={12}>
              <PriceVariance />
            </Grid>
            <Grid item xs={12}>
              <NPSByService />
            </Grid>
          </Grid>
        )}

        {/* Customer Experience Tab */}
        {tabValue === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <NPSScore />
            </Grid>
            <Grid item xs={12} lg={6}>
              <DigitalEngagment />
            </Grid>
            <Grid item xs={12}>
              <NPSComparison />
            </Grid>
            <Grid item xs={12}>
              <NPSServiceDigital />
            </Grid>
          </Grid>
        )}

        {/* Raw Data Tab */}
        {tabValue === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    CSV Data ({csvData.length} rows)
                  </Typography>

                  <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          {headers.map((header) => (
                            <TableCell key={header}>
                              <Typography variant="subtitle2">
                                {header}
                              </Typography>
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {csvData.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {headers.map((header) => (
                              <TableCell key={`${rowIndex}-${header}`}>
                                {row[header]?.toString()}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Container>
    </PageContainer>
  );
};

export default DataExplorationPage;
