import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import CSVUpload from './CSVUpload';
import { useCSVData } from '@/app/(DashboardLayout)/hooks/CSVDataContext';

interface CSVData {
  [key: string]: string | number | boolean;
}

interface CSVUploadExampleProps {
  onDataParsed?: (data: CSVData[]) => void;
}

const CSVUploadExample: React.FC<CSVUploadExampleProps> = ({ onDataParsed }) => {
  const [localParsedData, setLocalParsedData] = useState<CSVData[]>([]);
  const [localHeaders, setLocalHeaders] = useState<string[]>([]);
  const { setCsvData, setHeaders } = useCSVData();

  const handleDataParsed = (data: CSVData[]) => {
    setLocalParsedData(data);
    
    if (data.length > 0) {
      const extractedHeaders = Object.keys(data[0]);
      setLocalHeaders(extractedHeaders);
      
      // Store in context
      setCsvData(data);
      setHeaders(extractedHeaders);

      // Call parent callback if provided
      if (onDataParsed) {
        onDataParsed(data);
      }
    }
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Upload CSV File
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <CSVUpload onDataParsed={handleDataParsed} />
          
          {localParsedData.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Parsed Data ({localParsedData.length} rows)
              </Typography>
              
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {localHeaders.map((header) => (
                        <TableCell key={header}>
                          <Typography variant="subtitle2">
                            {header}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {localParsedData.slice(0, 10).map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {localHeaders.map((header) => (
                          <TableCell key={`${rowIndex}-${header}`}>
                            {row[header]?.toString()}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {localParsedData.length > 10 && (
                <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                  Showing first 10 rows of {localParsedData.length} total rows
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CSVUploadExample; 