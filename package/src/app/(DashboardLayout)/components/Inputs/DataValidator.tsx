import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack
} from '@mui/material';
import { DeleteOutline, Edit, CheckCircleOutline, CheckCircle } from '@mui/icons-material';
import { useCSVData } from '../../hooks/CSVDataContext';

interface DataIssue {
  rowIndex: number;
  column: string;
  value: any;
  issue: string;
  original: any;
  canConfirm?: boolean;
}

// Create a unique identifier for each issue
interface ConfirmedIssue {
  rowIndex: number;
  column: string;
  value: any;
}

interface DataValidatorProps {
  onFixData?: (updatedData: any[]) => void;
  onValidationComplete?: (isComplete: boolean) => void;
}

const DataValidator: React.FC<DataValidatorProps> = ({ onFixData, onValidationComplete }) => {
  const { csvData, setCsvData, headers } = useCSVData();
  const [issues, setIssues] = useState<DataIssue[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEdit, setCurrentEdit] = useState<DataIssue | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [filteredIssues, setFilteredIssues] = useState<DataIssue[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [confirmedIssues, setConfirmedIssues] = useState<ConfirmedIssue[]>([]);

  // Helper function to check if an issue is already confirmed
  const isIssueConfirmed = (rowIndex: number, column: string, value: any): boolean => {
    return confirmedIssues.some(
      confirmed => 
        confirmed.rowIndex === rowIndex && 
        confirmed.column === column && 
        confirmed.value === value
    );
  };

  // Validate data based on requirements
  useEffect(() => {
    if (csvData && csvData.length > 0) {
      const dataIssues: DataIssue[] = [];

      // Calculate average cost for comparison
      const validCosts = csvData
        .map(row => Number(row.cost))
        .filter(cost => !isNaN(cost) && cost >= 0);
      
      const averageCost = validCosts.length > 0 
        ? validCosts.reduce((sum, cost) => sum + cost, 0) / validCosts.length 
        : 0;

      csvData.forEach((row, rowIndex) => {
        // Check digital_engagement
        const digitalValue = String(row.digital_engagement).toLowerCase();
        if (digitalValue !== 'yes' && digitalValue !== 'no' && digitalValue !== 'true' && digitalValue !== 'false') {
          dataIssues.push({
            rowIndex,
            column: 'digital_engagement',
            value: row.digital_engagement,
            issue: "Must be 'Yes' or 'No'",
            original: row
          });
        }

        // Check nps_score
        const npsScore = Number(row.nps_score);
        if (isNaN(npsScore) || npsScore < 0 || npsScore > 10) {
          dataIssues.push({
            rowIndex,
            column: 'nps_score',
            value: row.nps_score,
            issue: "Must be a number between 0-10",
            original: row
          });
        }

        // Check cost (updated logic with confirmed issues check)
        const cost = Number(row.cost);
        if (isNaN(cost)) {
          dataIssues.push({
            rowIndex,
            column: 'cost',
            value: row.cost,
            issue: "Must be a valid number",
            original: row
          });
        } else if (cost < 0 && !isIssueConfirmed(rowIndex, 'cost', row.cost)) {
          dataIssues.push({
            rowIndex,
            column: 'cost',
            value: row.cost,
            issue: "Cost is negative - confirm or correct",
            original: row,
            canConfirm: true
          });
        } else if (averageCost > 0 && cost > (averageCost + 200) && !isIssueConfirmed(rowIndex, 'cost', row.cost)) {
          dataIssues.push({
            rowIndex,
            column: 'cost',
            value: row.cost,
            issue: `$${cost.toFixed(2)} is more than $200 above average ($${averageCost.toFixed(2)})`,
            original: row,
            canConfirm: true
          });
        }

        // Check service_date
        if (!row.service_date || !isValidDate(String(row.service_date))) {
          dataIssues.push({
            rowIndex,
            column: 'service_date',
            value: row.service_date,
            issue: "Must be a valid date (MM/DD/YY)",
            original: row
          });
        }

        // Check service_type
        if (!row.service_type || String(row.service_type).trim() === '') {
          dataIssues.push({
            rowIndex,
            column: 'service_type',
            value: row.service_type,
            issue: "Cannot be empty",
            original: row
          });
        }
      });

      setIssues(dataIssues);
      setFilteredIssues(dataIssues);
      
      // Notify parent if validation is complete (no issues)
      if (onValidationComplete) {
        onValidationComplete(dataIssues.length === 0);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [csvData, onValidationComplete, confirmedIssues]);

  // Check if a string is a valid date in MM/DD/YY format
  const isValidDate = (dateString: string) => {
    // Check if matches format MM/DD/YY
    if (!/^\d{1,2}\/\d{1,2}\/\d{1,2}$/.test(dateString)) return false;
    
    const parts = dateString.split('/');
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    // Check the ranges
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    
    return true;
  };

  // Open edit dialog for a specific issue
  const handleEdit = (issue: DataIssue) => {
    setCurrentEdit(issue);
    setEditValue(String(issue.value));
    setEditDialogOpen(true);
  };

  // Delete a row with an issue
  const handleDelete = (issue: DataIssue) => {
    const updatedData = csvData.filter((_, index) => index !== issue.rowIndex);
    setCsvData(updatedData);
    if (onFixData) onFixData(updatedData);
  };
  
  // Confirm a value is correct (for cost validation)
  const handleConfirm = (issue: DataIssue) => {
    // Add to confirmed issues so it won't show up again
    setConfirmedIssues([
      ...confirmedIssues,
      {
        rowIndex: issue.rowIndex,
        column: issue.column,
        value: issue.value
      }
    ]);
    
    // Remove this issue from the issues list
    const updatedIssues = issues.filter(
      item => !(item.rowIndex === issue.rowIndex && item.column === issue.column)
    );
    setIssues(updatedIssues);
    setFilteredIssues(
      filteredIssues.filter(
        item => !(item.rowIndex === issue.rowIndex && item.column === issue.column)
      )
    );
    
    // Check if all issues are now resolved
    if (updatedIssues.length === 0 && onValidationComplete) {
      onValidationComplete(true);
    }
  };

  // Save edited value
  const handleSaveEdit = () => {
    if (!currentEdit) return;

    const updatedData = [...csvData];
    const rowToUpdate = { ...updatedData[currentEdit.rowIndex] };

    switch (currentEdit.column) {
      case 'digital_engagement':
        rowToUpdate.digital_engagement = editValue.toLowerCase();
        break;
      case 'nps_score':
        rowToUpdate.nps_score = Number(editValue);
        break;
      case 'cost':
        rowToUpdate.cost = Number(editValue);
        break;
      case 'service_date':
      case 'service_type':
        rowToUpdate[currentEdit.column] = editValue;
        break;
    }

    updatedData[currentEdit.rowIndex] = rowToUpdate;
    setCsvData(updatedData);
    setEditDialogOpen(false);
    setCurrentEdit(null);
    if (onFixData) onFixData(updatedData);
  };

  // Filter issues by column
  const handleFilterClick = (column: string) => {
    if (activeFilters.includes(column)) {
      // Remove the filter
      const newFilters = activeFilters.filter(f => f !== column);
      setActiveFilters(newFilters);
      
      if (newFilters.length === 0) {
        setFilteredIssues(issues);
      } else {
        setFilteredIssues(issues.filter(issue => newFilters.includes(issue.column)));
      }
    } else {
      // Add the filter
      const newFilters = [...activeFilters, column];
      setActiveFilters(newFilters);
      setFilteredIssues(issues.filter(issue => newFilters.includes(issue.column)));
    }
  };

  // Close edit dialog
  const handleCloseEdit = () => {
    setEditDialogOpen(false);
    setCurrentEdit(null);
  };

  // Get validation controls based on column type
  const getValidationField = () => {
    if (!currentEdit) return null;

    switch (currentEdit.column) {
      case 'digital_engagement':
        return (
          <FormControl fullWidth margin="normal">
            <InputLabel>Digital Engagement</InputLabel>
            <Select
              value={editValue.toLowerCase()}
              onChange={(e) => setEditValue(e.target.value)}
              label="Digital Engagement"
            >
              <MenuItem value="yes">Yes</MenuItem>
              <MenuItem value="no">No</MenuItem>
            </Select>
          </FormControl>
        );
        
      case 'nps_score':
        return (
          <TextField
            label="NPS Score"
            type="number"
            fullWidth
            value={editValue}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (!isNaN(val) && val >= 0 && val <= 10) {
                setEditValue(e.target.value);
              }
            }}
            inputProps={{ min: 0, max: 10 }}
            margin="normal"
            helperText="Value must be between 0-10"
          />
        );
        
      case 'cost':
        return (
          <TextField
            label="Cost"
            type="number"
            fullWidth
            value={editValue}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (!isNaN(val)) {
                setEditValue(e.target.value);
              }
            }}
            inputProps={{ step: 0.01 }}
            margin="normal"
            helperText="Enter the correct cost value"
          />
        );
        
      case 'service_date':
        return (
          <TextField
            label="Service Date"
            fullWidth
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            margin="normal"
            helperText="Format: MM/DD/YY"
          />
        );
        
      case 'service_type':
        return (
          <TextField
            label="Service Type"
            fullWidth
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            margin="normal"
            helperText="Cannot be empty"
          />
        );
        
      default:
        return (
          <TextField
            label={currentEdit.column}
            fullWidth
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            margin="normal"
          />
        );
    }
  };

  if (issues.length === 0) {
    return (
      <Box mt={3}>
        <Alert severity="success" icon={<CheckCircleOutline />}>
          All data is valid
        </Alert>
      </Box>
    );
  }

  return (
    <Box mt={3}>
      <Paper elevation={0} sx={{ p: 3, border: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Typography variant="h6" gutterBottom>
          Data Issues Found ({issues.length})
        </Typography>
        
        <Box my={2}>
          <Typography variant="subtitle2" gutterBottom>
            Filter by issue type:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip 
              label={`All (${issues.length})`}
              color={activeFilters.length === 0 ? "primary" : "default"}
              onClick={() => setActiveFilters([])}
              sx={{ mb: 1 }}
            />
            {['digital_engagement', 'nps_score', 'cost', 'service_date', 'service_type'].map(column => {
              const count = issues.filter(issue => issue.column === column).length;
              if (count === 0) return null;
              
              return (
                <Chip 
                  key={column}
                  label={`${column} (${count})`}
                  color={activeFilters.includes(column) ? "primary" : "default"}
                  onClick={() => handleFilterClick(column)}
                  sx={{ mb: 1 }}
                />
              );
            })}
          </Stack>
        </Box>

        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Row</TableCell>
                <TableCell>Column</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Issue</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredIssues.map((issue, index) => (
                <TableRow key={index} hover>
                  <TableCell>{issue.rowIndex + 1}</TableCell>
                  <TableCell>{issue.column}</TableCell>
                  <TableCell>{String(issue.value)}</TableCell>
                  <TableCell>{issue.issue}</TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => handleEdit(issue)} size="small">
                      <Edit />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(issue)} size="small">
                      <DeleteOutline />
                    </IconButton>
                    {issue.canConfirm && (
                      <IconButton color="success" onClick={() => handleConfirm(issue)} size="small" title="Confirm value is correct">
                        <CheckCircle />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEdit} fullWidth maxWidth="xs">
        <DialogTitle>
          Edit {currentEdit?.column}
        </DialogTitle>
        <DialogContent>
          <Box mt={1}>
            <Typography variant="body2" color="error" gutterBottom>
              Issue: {currentEdit?.issue}
            </Typography>
            {getValidationField()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit} color="inherit">Cancel</Button>
          <Button 
            onClick={handleSaveEdit} 
            color="primary" 
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataValidator; 