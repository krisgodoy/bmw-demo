import { useTheme } from '@mui/material/styles';
import { Grid, Stack, Typography, Box } from '@mui/material';
import { IconMoodSmile, IconMoodNeutral, IconMoodSad } from '@tabler/icons-react';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { useCSVData } from "../../hooks/CSVDataContext";
import { useEffect, useState } from "react";

interface NPSData {
  avgScore: number;
  serviceTypeScores: {
    [key: string]: number;
  };
  detractors: number;
  passives: number;
  promoters: number;
  npsScore: number;
}

const YearlyBreakup = () => {
  const { csvData } = useCSVData();
  const [npsData, setNpsData] = useState<NPSData>({
    avgScore: 0,
    serviceTypeScores: {},
    detractors: 0,
    passives: 0,
    promoters: 0,
    npsScore: 0
  });
  
  // chart color
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;
  const success = theme.palette.success.main;
  const warning = theme.palette.warning.main;
  const error = theme.palette.error.main;

  useEffect(() => {
    if (csvData && csvData.length > 0) {
      // Calculate NPS averages
      const npsScores = csvData.map(row => Number(row.nps_score)).filter(score => !isNaN(score));
      
      // Calculate average NPS score
      const avgScore = npsScores.length 
        ? npsScores.reduce((sum, score) => sum + score, 0) / npsScores.length 
        : 0;
      
      // Calculate by service type
      const serviceTypes = Array.from(new Set(csvData.map(row => row.service_type as string)));
      const serviceTypeScores: {[key: string]: number} = {};
      
      serviceTypes.forEach(type => {
        const typeScores = csvData
          .filter(row => row.service_type === type)
          .map(row => Number(row.nps_score))
          .filter(score => !isNaN(score));
        
        serviceTypeScores[type] = typeScores.length 
          ? typeScores.reduce((sum, score) => sum + score, 0) / typeScores.length 
          : 0;
      });
      
      // Calculate NPS categories
      const detractors = npsScores.filter(score => score >= 0 && score <= 6).length;
      const passives = npsScores.filter(score => score === 7 || score === 8).length;
      const promoters = npsScores.filter(score => score >= 9 && score <= 10).length;
      
      // Calculate NPS score: (% Promoters - % Detractors) * 100
      const npsScore = npsScores.length 
        ? ((promoters / npsScores.length) - (detractors / npsScores.length)) * 100 
        : 0;
      
      setNpsData({
        avgScore: parseFloat(avgScore.toFixed(1)),
        serviceTypeScores,
        detractors,
        passives,
        promoters,
        npsScore: parseFloat(npsScore.toFixed(0))
      });
    }
  }, [csvData]);

  // Determine mood icon based on NPS score
  const getMoodIcon = () => {
    if (npsData.npsScore >= 50) {
      return <IconMoodSmile size={80} color={success} />;
    } else if (npsData.npsScore >= 0) {
      return <IconMoodNeutral size={80} color={warning} />;
    } else {
      return <IconMoodSad size={80} color={error} />;
    }
  };
  
  // Get color based on NPS score
  const getNpsColor = () => {
    if (npsData.npsScore >= 50) {
      return success;
    } else if (npsData.npsScore >= 0) {
      return warning;
    } else {
      return error;
    }
  };

  return (
    <DashboardCard title="NPS Score">
      <Grid container spacing={3}>
        {/* Left column - Text information */}
        <Grid item xs={7} sm={7}>
          <Typography variant="h3" fontWeight="700" color={getNpsColor()}>
            {npsData.npsScore}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary" gutterBottom>
            Net Promoter Score
          </Typography>
          
          <Box mt={3}>
            <Typography variant="body2" gutterBottom>
              Average Rating: <strong>{npsData.avgScore.toFixed(1)}/10</strong>
            </Typography>
            
            <Stack direction="row" spacing={2} mt={1}>
              <Box>
                <Typography variant="caption" color="error.main">
                  Detractors (0-6)
                </Typography>
                <Typography variant="h6">
                  {npsData.detractors}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="warning.main">
                  Passives (7-8)
                </Typography>
                <Typography variant="h6">
                  {npsData.passives}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="success.main">
                  Promoters (9-10)
                </Typography>
                <Typography variant="h6">
                  {npsData.promoters}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Grid>
        
        {/* Right column - Mood icon */}
        <Grid item xs={5} sm={5}>
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            height="100%"
          >
            {csvData && csvData.length > 0 ? (
              getMoodIcon()
            ) : (
              <Typography variant="body2" color="textSecondary">
                Upload CSV data
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>
    </DashboardCard>
  );
};

export default YearlyBreakup;
