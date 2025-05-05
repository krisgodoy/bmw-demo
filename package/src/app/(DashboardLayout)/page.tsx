'use client'
import { useState } from 'react';
import { Grid, Box, Typography, Divider, Button } from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import CSVUploadExample from '@/app/(DashboardLayout)/components/Inputs/CSVUploadExample';
import DataValidator from '@/app/(DashboardLayout)/components/Inputs/DataValidator';
import { useCSVData } from '@/app/(DashboardLayout)/hooks/CSVDataContext';
import { useRouter } from 'next/navigation';
import { ArrowForward } from '@mui/icons-material';

const Dashboard = () => {
  const { csvData } = useCSVData();
  const [showValidation, setShowValidation] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);
  const router = useRouter();

  // Handle when CSV data is parsed, show validation
  const handleDataParsed = (data: any[]) => {
    setShowValidation(true);
    setValidationComplete(false);
  };

  // Handle when data is fixed by the validator
  const handleFixedData = (updatedData: any[]) => {
    // This function is called when data is fixed in the DataValidator
    console.log("Data fixed, rows remaining:", updatedData.length);
  };

  // Handle when validation is complete (no issues)
  const handleValidationComplete = (isComplete: boolean) => {
    setValidationComplete(isComplete);
  };

  // Navigate to data exploration page
  const goToDataExploration = () => {
    router.push('/data-exploration');
  };

  return (
    <PageContainer title="Dashboard" description="this is Dashboard">
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h3" mb={3}>
              CSV Data Analysis
            </Typography>
          </Grid>
          {showValidation && csvData.length > 0 && (
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h5" mb={2}>
                Data Validation
              </Typography>
              <DataValidator 
                onFixData={handleFixedData} 
                onValidationComplete={handleValidationComplete} 
              />
              
              {validationComplete && (
                <Box mt={3} display="flex" justifyContent="flex-end">
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="large" 
                    onClick={goToDataExploration}
                    endIcon={<ArrowForward />}
                  >
                    Go to Data Exploration
                  </Button>
                </Box>
              )}
            </Grid>
          )}
          
          <Grid item xs={12}>
            <CSVUploadExample onDataParsed={handleDataParsed} />
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  )
}

export default Dashboard;
