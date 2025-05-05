import React, { useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  LinearProgress,
  Alert,
  Stack
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface CSVData {
  [key: string]: string | number | boolean;
}

interface CSVUploadProps {
  onDataParsed?: (data: CSVData[]) => void;
  acceptedFileTypes?: string;
  maxFileSizeMB?: number;
}

const CSVUpload: React.FC<CSVUploadProps> = ({
  onDataParsed,
  acceptedFileTypes = '.csv',
  maxFileSizeMB = 5
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (csvText: string): CSVData[] => {
    try {
      const lines = csvText.split('\n');
      const headers = lines[0].split(',').map(header => header.trim());
      
      const result: CSVData[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(value => value.trim());
        const obj: CSVData = {};
        
        headers.forEach((header, index) => {
          let value: string | number | boolean = values[index] || '';
          
          // Try to convert to number if possible
          if (!isNaN(Number(value)) && value !== '') {
            obj[header] = Number(value);
          } 
          // Handle boolean values
          else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'yes') {
            obj[header] = true;
          } 
          else if (value.toLowerCase() === 'false' || value.toLowerCase() === 'no') {
            obj[header] = false;
          } 
          else {
            obj[header] = value;
          }
        });
        
        result.push(obj);
      }
      
      return result;
    } catch (error) {
      console.error('Error parsing CSV:', error);
      setErrorMessage('Failed to parse CSV file. Please check the format.');
      return [];
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!file) return;
    
    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setErrorMessage('Please upload a CSV file.');
      return;
    }
    
    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSizeMB) {
      setErrorMessage(`File size exceeds the limit of ${maxFileSizeMB}MB.`);
      return;
    }
    
    setIsLoading(true);
    setFileName(file.name);
    
    try {
      const text = await file.text();
      const parsedData = parseCSV(text);
      
      if (parsedData.length > 0) {
        setSuccessMessage(`Successfully parsed ${parsedData.length} rows from ${file.name}`);
        if (onDataParsed) {
          onDataParsed(parsedData);
        }
      } else {
        setErrorMessage('No data found in the CSV file or the file format is incorrect.');
      }
    } catch (error) {
      console.error('Error reading file:', error);
      setErrorMessage('Failed to read the CSV file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        border: '1px dashed rgba(0, 0, 0, 0.12)',
        bgcolor: 'background.paper',
        textAlign: 'center' 
      }}
    >
      <input
        type="file"
        accept={acceptedFileTypes}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        ref={fileInputRef}
      />
      
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: 2 
        }}
      >
        <CloudUploadIcon color="primary" sx={{ fontSize: 48 }} />
        
        <Typography variant="h6" component="div">
          Upload CSV File
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          Drag and drop your CSV file here or click the button below
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleButtonClick}
          disabled={isLoading}
        >
          Browse Files
        </Button>
        
        {fileName && (
          <Typography variant="body2" color="text.secondary">
            Selected file: {fileName}
          </Typography>
        )}
        
        {isLoading && (
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress />
          </Box>
        )}
        
        <Stack spacing={1} sx={{ width: '100%', mt: 1 }}>
          {errorMessage && (
            <Alert severity="error">{errorMessage}</Alert>
          )}
          
          {successMessage && (
            <Alert severity="success">{successMessage}</Alert>
          )}
        </Stack>
      </Box>
    </Paper>
  );
};

export default CSVUpload;
