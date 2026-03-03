import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import { jsPDF } from "jspdf";
import * as XLSX from 'xlsx';
import 'jspdf-autotable';

import {
  CRITICALITY_OPTIONS,
  STATUS_OPTIONS,
  FUNCTION_OPTIONS,
  APPROVAL_OPTIONS,
  NATURE_OF_POINT_OPTIONS,
  COLUMN_TYPES,
  DEFAULT_COLUMNS
} from './constants';

// Function to load custom options from localStorage
const loadCustomOptions = (key, defaultOptions) => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      return [...defaultOptions, ...parsed];
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
  }
  return defaultOptions;
};

// Function to save custom options to localStorage
const saveCustomOptions = (key, customOptions) => {
  try {
    localStorage.setItem(key, JSON.stringify(customOptions));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

const MeetingTable = ({ meetings, onUpdateMeeting, onDeleteMeeting, onAddMeeting }) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeletePrompt, setShowDeletePrompt] = useState(null);
 
  // Use DEFAULT_COLUMNS without Delete and Actions columns
  const initialColumns = [...DEFAULT_COLUMNS];
 
  // Filter out delete and actions columns
  const filteredColumns = initialColumns.filter(col =>
    !['delete_action', 'view_action'].includes(col.id)
  );
 
  const [columns, setColumns] = useState(filteredColumns);
 
  const [showAddColumnForm, setShowAddColumnForm] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('text');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [editingCell, setEditingCell] = useState({ id: null, column: null });
 
  // State for export options
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAddSummary, setShowAddSummary] = useState(false);
  const [meetingSummary, setMeetingSummary] = useState('');
  const [summaryTitle, setSummaryTitle] = useState('');
 
  // New states for features
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [validationErrors, setValidationErrors] = useState({});
 
  // New states for table-wide edit mode
  const [isTableEditMode, setIsTableEditMode] = useState(false);
  const [tableEditData, setTableEditData] = useState({});
 
  // State for custom nature of point options with localStorage
  const [natureOfPointOptions, setNatureOfPointOptions] = useState(() =>
    loadCustomOptions('nature_of_point_options', NATURE_OF_POINT_OPTIONS)
  );
 
  // State for custom function options with localStorage
  const [functionOptions, setFunctionOptions] = useState(() =>
    loadCustomOptions('function_options', FUNCTION_OPTIONS)
  );
 
  // State for project name filter
  const [projectNameFilter, setProjectNameFilter] = useState('');
 
  const [showNatureOfPointModal, setShowNatureOfPointModal] = useState(false);
  const [showFunctionModal, setShowFunctionModal] = useState(false);
  const [newNatureOption, setNewNatureOption] = useState('');
  const [newFunctionOption, setNewFunctionOption] = useState('');
 
  // State for new row being added
  const [addingNewRow, setAddingNewRow] = useState(false);
  const [newRowData, setNewRowData] = useState({});
 
  // State for delete column modal
  const [showDeleteColumnPrompt, setShowDeleteColumnPrompt] = useState(null);
 
  // NEW STATE: For editing column name
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [editingColumnName, setEditingColumnName] = useState('');
 
  // NEW STATE: For row selection checkboxes
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
 
  // NEW STATE: For nature of point filter in column header
  const [natureFilter, setNatureFilter] = useState('all');
 
  // NEW STATE: For function filter in column header
  const [functionFilter, setFunctionFilter] = useState('all');
 
  // Refs for column header editing
  const newColumnInputRef = useRef(null);
  const summaryInputRef = useRef(null);
 
  // Focus input when needed
  useEffect(() => {
    if (showAddColumnForm && newColumnInputRef.current) {
      newColumnInputRef.current.focus();
    }
   
    if (showAddSummary && summaryInputRef.current) {
      summaryInputRef.current.focus();
    }
  }, [showAddColumnForm, showAddSummary]);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Save custom options to localStorage when they change
  useEffect(() => {
    const customNatureOptions = natureOfPointOptions.filter(opt =>
      !NATURE_OF_POINT_OPTIONS.some(defaultOpt => defaultOpt.value === opt.value)
    );
    saveCustomOptions('nature_of_point_options', customNatureOptions);
   
    // Update column options
    setColumns(prev => prev.map(col => {
      if (col.id === 'nature_of_point') {
        return {
          ...col,
          options: natureOfPointOptions
        };
      }
      return col;
    }));
  }, [natureOfPointOptions]);

  // Save custom function options to localStorage when they change
  useEffect(() => {
    const customFunctionOptions = functionOptions.filter(opt =>
      !FUNCTION_OPTIONS.some(defaultOpt => defaultOpt.value === opt.value)
    );
    saveCustomOptions('function_options', customFunctionOptions);
  }, [functionOptions]);

  // Initialize new row data when adding starts
  const initializeNewRowData = () => {
    const visibleColumns = columns.filter(col => col.visible && col.type !== 'action');
    const initialData = {};
   
    visibleColumns.forEach(col => {
      if (col.id === 'sno') {
        initialData[col.id] = meetings.length + 1;
      } else if (col.id === 'criticality') {
        initialData[col.id] = 'medium'; // Default criticality
      } else if (col.id === 'status') {
        initialData[col.id] = 'pending';  // Default status
      } else if (col.id === 'action_taken_approval') {
        initialData[col.id] = 'pending';
      } else if (col.id === 'target') {
        initialData[col.id] = new Date().toISOString().split('T')[0];
      } else if (col.id === 'function') {
        initialData[col.id] = 'engineering';  // Default function
      } else if (col.id === 'nature_of_point') {
        initialData[col.id] = natureOfPointOptions[0]?.value || 'discussion';  // Default nature
      } else {
        initialData[col.id] = '';
      }
    });
   
    return initialData;
  };

  // Add new meeting row with inline editing
  const handleAddRow = () => {
    // If already adding a row, save it first
    if (addingNewRow && newRowData.id) {
      saveNewRow();
      return;
    }
   
    const newId = Date.now();
    setAddingNewRow(true);
   
    // Initialize with default values
    const initialData = initializeNewRowData();
    initialData.id = newId;
    initialData.created_at = new Date().toISOString();
   
    setNewRowData(initialData);
    setValidationErrors({});
   
    // Auto-focus the first editable column
    setTimeout(() => {
      const firstEditableColumn = columns
        .filter(col => col.visible && col.type !== 'action' && col.editable)
        .find(col => col.id !== 'sno');
     
      if (firstEditableColumn) {
        const inputElement = document.querySelector(`[data-meeting-id="${newId}"][data-column-id="${firstEditableColumn.id}"] input, [data-meeting-id="${newId}"][data-column-id="${firstEditableColumn.id}"] select, [data-meeting-id="${newId}"][data-column-id="${firstEditableColumn.id}"] textarea`);
        if (inputElement) {
          inputElement.focus();
        }
      }
    }, 100);
  };

  // Save new row
  const saveNewRow = () => {
    const errors = validateMeetingForm(newRowData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showNotification('Please fill all required fields', 'error');
      return;
    }

    // Add the new meeting
    if (onAddMeeting) {
      onAddMeeting(newRowData);
    } else {
      // Fallback for backward compatibility
      onUpdateMeeting(newRowData.id, newRowData);
    }
   
    // Reset the adding state
    setAddingNewRow(false);
    setNewRowData({});
    setValidationErrors({});
   
    showNotification('New meeting row added successfully');
  };

  // Cancel adding new row
  const cancelNewRow = () => {
    setAddingNewRow(false);
    setNewRowData({});
    setValidationErrors({});
  };

  // Handle new row data change
  const handleNewRowChange = (field, value) => {
    setNewRowData(prev => ({
      ...prev,
      [field]: value
    }));
   
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle Enter key in new row
  const handleNewRowKeyDown = (e, columnId) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
     
      // For all fields, save the row on Enter
      saveNewRow();
    }
   
    if (e.key === 'Escape') {
      cancelNewRow();
    }
   
    if (e.key === 'Tab') {
      e.preventDefault();
      const inputs = Array.from(document.querySelectorAll(`[data-meeting-id="${newRowData.id}"] input, [data-meeting-id="${newRowData.id}"] select, [data-meeting-id="${newRowData.id}"] textarea`));
      const currentIndex = inputs.indexOf(e.target);
     
      if (e.shiftKey) {
        // Shift+Tab: move to previous input
        if (currentIndex > 0) {
          inputs[currentIndex - 1].focus();
        }
      } else {
        // Tab: move to next input
        if (currentIndex < inputs.length - 1) {
          inputs[currentIndex + 1].focus();
        } else {
          // If last input, save the row
          saveNewRow();
        }
      }
    }
  };

  // Filter meetings based on search and nature filter
  const filteredMeetings = meetings.filter(meeting => {
    // Apply search filter
    const searchMatch = Object.values(meeting).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
   
    // Apply nature filter
    const natureMatch = natureFilter === 'all' ||
      meeting.nature_of_point === natureFilter;
   
    // Apply function filter
    const functionMatch = functionFilter === 'all' ||
      meeting.function === functionFilter;
       
    // Apply project name filter
    const projectNameMatch = !projectNameFilter ||
      (meeting.project_name && meeting.project_name.toLowerCase().includes(projectNameFilter.toLowerCase()));
   
    return searchMatch && natureMatch && functionMatch && projectNameMatch;
  });

  // Sort meetings
  const sortedMeetings = React.useMemo(() => {
    if (!sortConfig.key) return filteredMeetings;

    return [...filteredMeetings].sort((a, b) => {
      const aVal = a[sortConfig.key] || '';
      const bVal = b[sortConfig.key] || '';
     
      if (aVal < bVal) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredMeetings, sortConfig]);

  // Handle row selection
  const handleRowSelect = (meetingId) => {
    setSelectedRows(prev => {
      if (prev.includes(meetingId)) {
        return prev.filter(id => id !== meetingId);
      } else {
        return [...prev, meetingId];
      }
    });
  };

  // Handle select all rows
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      const allMeetingIds = sortedMeetings.map(meeting => meeting.id);
      setSelectedRows(allMeetingIds);
    }
    setSelectAll(!selectAll);
  };

  // Delete selected rows
  const handleDeleteSelectedRows = () => {
    if (selectedRows.length === 0) {
      showNotification('No rows selected', 'error');
      return;
    }

    setShowDeletePrompt({
      type: 'multiple',
      ids: selectedRows,
      count: selectedRows.length
    });
  };

  // Confirm delete multiple rows
  const confirmDeleteMultipleMeetings = () => {
    if (showDeletePrompt && showDeletePrompt.type === 'multiple' && onDeleteMeeting) {
      showDeletePrompt.ids.forEach(id => {
        onDeleteMeeting(id);
      });
      setShowDeletePrompt(null);
      setSelectedRows([]);
      setSelectAll(false);
      showNotification(`${showDeletePrompt.count} meeting(s) deleted successfully`);
    }
  };

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <Icons.ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 opacity-30" />;
    }
    return sortConfig.direction === 'ascending'
      ? <Icons.ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
      : <Icons.ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />;
  };

  // Start editing meeting (full row edit)
  const startEditing = (meeting) => {
    setEditingId(meeting.id);
    const editData = { ...meeting };
    columns.forEach(col => {
      if (!editData.hasOwnProperty(col.id)) {
        editData[col.id] = col.type === 'select' ? '' : '';
      }
    });
    setEditForm(editData);
    setValidationErrors({});
  };

  // Save edit (full row)
  const saveEdit = () => {
    const errors = validateMeetingForm(editForm);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    onUpdateMeeting(editingId, editForm);
    setEditingId(null);
    setEditForm({});
    setValidationErrors({});
    showNotification('Meeting updated successfully');
  };

  // Cancel edit (full row)
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
    setValidationErrors({});
  };

  // Start cell editing (inline)
  const startCellEditing = (meetingId, columnId, currentValue) => {
    setEditingCell({ id: meetingId, column: columnId });
    setEditForm({ [columnId]: currentValue || '' });
    setValidationErrors({});
  };

  // Save cell edit (inline)
  const saveCellEdit = () => {
    if (editingCell.id && editingCell.column) {
      const errors = validateCell(editingCell.column, editForm[editingCell.column]);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }

      onUpdateMeeting(editingCell.id, { [editingCell.column]: editForm[editingCell.column] });
      setEditingCell({ id: null, column: null });
      setEditForm({});
      setValidationErrors({});
      showNotification('Meeting updated successfully');
    }
  };

  // Cancel cell edit (inline)
  const cancelCellEdit = () => {
    setEditingCell({ id: null, column: null });
    setEditForm({});
    setValidationErrors({});
  };

  // Add new column
  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      const newColumnId = newColumnName.toLowerCase().replace(/\s+/g, '_');
     
      // Check if column already exists
      if (columns.find(col => col.id === newColumnId)) {
        showNotification('Column with this name already exists', 'error');
        return;
      }
     
      const newColumn = {
        id: newColumnId,
        label: newColumnName.trim(),
        visible: true,
        sortable: true,
        type: newColumnType,
        editable: true,
        deletable: true,
        required: false
      };
     
      // Add new column to columns
      setColumns([...columns, newColumn]);
     
      // Add empty value for this column to all existing meetings
      meetings.forEach(meeting => {
        onUpdateMeeting(meeting.id, { [newColumnId]: '' });
      });
     
      // Reset form
      setNewColumnName('');
      setNewColumnType('text');
      setShowAddColumnForm(false);
      setShowColumnModal(false);
      showNotification('Column added successfully');
    }
  };

  // Edit column name
  const handleEditColumn = (columnId) => {
    const column = columns.find(col => col.id === columnId);
    if (column) {
      setEditingColumnId(columnId);
      setEditingColumnName(column.label);
    }
  };

  // Save column edit
  const saveColumnEdit = (columnId) => {
    if (editingColumnName.trim()) {
      setColumns(prev => prev.map(col =>
        col.id === columnId ? { ...col, label: editingColumnName.trim() } : col
      ));
      setEditingColumnId(null);
      setEditingColumnName('');
      showNotification('Column name updated successfully');
    }
  };

  // Cancel column edit
  const cancelColumnEdit = () => {
    setEditingColumnId(null);
    setEditingColumnName('');
  };

  // Delete column
  const handleDeleteColumn = (columnId) => {
    const columnToDelete = columns.find(col => col.id === columnId);
    if (!columnToDelete) return;
   
    // Don't allow deleting ALL columns (at least one should remain)
    if (columns.filter(col => col.type !== 'action').length <= 1) {
      showNotification('Cannot delete the last column', 'error');
      return;
    }
   
    // Remove column from columns
    setColumns(columns.filter(col => col.id !== columnId));
    setShowDeleteColumnPrompt(null);
    showNotification(`Column "${columnToDelete.label}" deleted successfully`);
  };

  // Add custom nature of point option
  const addCustomNatureOption = () => {
    if (newNatureOption.trim()) {
      // Check if option already exists
      if (natureOfPointOptions.some(opt => opt.label.toLowerCase() === newNatureOption.trim().toLowerCase())) {
        showNotification('Option already exists', 'error');
        return;
      }
     
      const newOption = {
        value: newNatureOption.trim().toLowerCase().replace(/\s+/g, '_'),
        label: newNatureOption.trim()
      };
     
      setNatureOfPointOptions(prev => [...prev, newOption]);
      setNewNatureOption('');
      showNotification('New nature option added successfully');
    }
  };

  // Add custom function option
  const addCustomFunctionOption = () => {
    if (newFunctionOption.trim()) {
      // Check if option already exists
      if (functionOptions.some(opt => opt.label.toLowerCase() === newFunctionOption.trim().toLowerCase())) {
        showNotification('Option already exists', 'error');
        return;
      }
     
      const newOption = {
        value: newFunctionOption.trim().toLowerCase().replace(/\s+/g, '_'),
        label: newFunctionOption.trim()
      };
     
      setFunctionOptions(prev => [...prev, newOption]);
      setNewFunctionOption('');
      showNotification('New function option added successfully');
    }
  };

  // Remove nature of point option
  const removeNatureOption = (value) => {
    // Don't remove if it's the last option
    if (natureOfPointOptions.length <= 1) {
      showNotification('Cannot delete the last option', 'error');
      return;
    }
   
    setNatureOfPointOptions(prev => prev.filter(opt => opt.value !== value));
    showNotification('Nature option removed');
  };

  // Remove function option
  const removeFunctionOption = (value) => {
    // Don't remove if it's the last option
    if (functionOptions.length <= 1) {
      showNotification('Cannot delete the last option', 'error');
      return;
    }
   
    setFunctionOptions(prev => prev.filter(opt => opt.value !== value));
    showNotification('Function option removed');
  };

  // Show delete confirmation
  const showDeleteConfirmation = (id, projectName) => {
    setShowDeletePrompt({
      type: 'single',
      id,
      projectName
    });
  };

  // Confirm delete
  const confirmDeleteMeeting = () => {
    if (showDeletePrompt && onDeleteMeeting) {
      if (showDeletePrompt.type === 'single') {
        onDeleteMeeting(showDeletePrompt.id);
        showNotification('Meeting deleted successfully');
      }
      setShowDeletePrompt(null);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeletePrompt(null);
  };

  // Handle edit form change
  const handleEditFormChange = (field, value) => {
    setEditForm({...editForm, [field]: value});
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle inline cell edit change
  const handleInlineEditChange = (value) => {
    if (editingCell.column) {
      setEditForm({ [editingCell.column]: value });
      // Clear validation error for this field when user starts typing
      if (validationErrors[editingCell.column]) {
        setValidationErrors(prev => ({ ...prev, [editingCell.column]: '' }));
      }
    }
  };

  // Toggle table-wide edit mode
  const toggleTableEditMode = () => {
    if (isTableEditMode) {
      // Save all changes when exiting edit mode
      Object.keys(tableEditData).forEach(meetingId => {
        onUpdateMeeting(meetingId, tableEditData[meetingId]);
      });
      setTableEditData({});
      setIsTableEditMode(false);
      showNotification('All changes saved successfully');
    } else {
      // Initialize table edit data for all rows
      const initialEditData = {};
      sortedMeetings.forEach(meeting => {
        initialEditData[meeting.id] = { ...meeting };
      });
      setTableEditData(initialEditData);
      setIsTableEditMode(true);
      showNotification('Table edit mode enabled. Edit any cell and click Save All when done.');
    }
  };

  // Handle table-wide edit change
  const handleTableEditChange = (meetingId, field, value) => {
    setTableEditData(prev => ({
      ...prev,
      [meetingId]: {
        ...prev[meetingId],
        [field]: value
      }
    }));
  };

  // Get criticality info
  const getCriticalityInfo = (value) => {
    return CRITICALITY_OPTIONS.find(c => c.value === value) || CRITICALITY_OPTIONS[1];
  };

  // Get status info
  const getStatusInfo = (value) => {
    return STATUS_OPTIONS.find(s => s.value === value) || STATUS_OPTIONS[0];
  };

  // Get function info
  const getFunctionInfo = (value) => {
    return functionOptions.find(f => f.value === value) || functionOptions[0] || { label: value, value };
  };

  // Get approval info
  const getApprovalInfo = (value) => {
    return APPROVAL_OPTIONS.find(a => a.value === value) || APPROVAL_OPTIONS[2];
  };

  // Get nature of point info
  const getNatureOfPointInfo = (value) => {
    return natureOfPointOptions.find(n => n.value === value) || { label: value, value };
  };

  // Get formatted data for export - FIXED FUNCTION
  const getExportData = () => {
    const visibleColumns = columns.filter(col => col.visible && col.type !== 'action');
    const headers = visibleColumns.map(col => col.label);
   
    const rows = sortedMeetings.map(meeting => {
      return visibleColumns.map(col => {
        if (col.id === 'criticality') return getCriticalityInfo(meeting[col.id])?.label || meeting[col.id];
        if (col.id === 'status') return getStatusInfo(meeting[col.id])?.label || meeting[col.id];
        if (col.id === 'function') return getFunctionInfo(meeting[col.id])?.label || meeting[col.id];
        if (col.id === 'action_taken_approval') return getApprovalInfo(meeting[col.id])?.label || meeting[col.id];
        if (col.id === 'nature_of_point') return getNatureOfPointInfo(meeting[col.id])?.label || meeting[col.id];
        return meeting[col.id] || '';
      });
    });

    return { headers, rows };
  };

  // Export to CSV - FIXED FUNCTION
  const exportToCSV = () => {
    const { headers, rows } = getExportData();
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-minutes-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setShowExportMenu(false);
    showNotification('Exported as CSV successfully');
  };

  // Export to Excel (XLSX) - FIXED FUNCTION
  const exportToExcel = () => {
    const { headers, rows } = getExportData();
   
    // Create worksheet data
    const worksheetData = [
      headers,
      ...rows
    ];
   
    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
   
    // Set column widths
    const colWidths = headers.map(() => ({ wch: 20 }));
    worksheet['!cols'] = colWidths;
   
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Meeting Minutes');
   
    // Generate Excel file
    XLSX.writeFile(workbook, `meeting-minutes-${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowExportMenu(false);
    showNotification('Exported as Excel successfully');
  };

  // Export to PDF - FIXED FUNCTION
  const exportToPDF = () => {
    const { headers, rows } = getExportData();
   
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
   
    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Meeting Minutes Report', 148 / 2, 15, { align: 'center' });
   
    // Add date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 148 / 2, 22, { align: 'center' });
   
    // Convert data for autoTable
    const tableData = rows.map(row =>
      row.map(cell => String(cell))
    );
   
    // Add table using autoTable
    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: 30,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: {},
      margin: { left: 10, right: 10 }
    });
   
    // Save PDF
    doc.save(`meeting-minutes-${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
    showNotification('Exported as PDF successfully');
  };

  // Export to Word (DOCX) - FIXED FUNCTION
  const exportToWord = () => {
    const { headers, rows } = getExportData();
   
    // Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Meeting Minutes Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { text-align: center; color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
          .date { text-align: center; color: #666; margin-bottom: 30px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #4CAF50; color: white; padding: 12px; text-align: left; border: 1px solid #ddd; }
          td { padding: 10px; border: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 40px; text-align: center; color: #777; font-size: 12px; padding-top: 20px; border-top: 1px solid #eee; }
          .summary { margin-top: 30px; padding: 15px; background-color: #f0f7f4; border-left: 4px solid #4CAF50; }
        </style>
      </head>
      <body>
        <h1>Meeting Minutes Report</h1>
        <div class="date">Generated: ${new Date().toLocaleDateString()}</div>
       
        <table>
          <thead>
            <tr>
              ${headers.map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                ${row.map(cell => `<td>${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
       
        <div class="summary">
          <strong>Summary:</strong> Total ${rows.length} meeting points exported.
        </div>
       
        <div class="footer">
          Generated by Meeting Minutes System | ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `;

    // Convert HTML to Word document
    const blob = new Blob([htmlContent], {
      type: 'application/msword;charset=utf-8'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-minutes-${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setShowExportMenu(false);
    showNotification('Exported as Word document successfully');
  };

  // Export to JSON - NEW FUNCTION
  const exportToJSON = () => {
    const exportData = sortedMeetings.map(meeting => {
      const meetingData = {};
      columns
        .filter(col => col.visible && col.type !== 'action')
        .forEach(col => {
          if (col.id === 'criticality') meetingData[col.label] = getCriticalityInfo(meeting[col.id])?.label || meeting[col.id];
          else if (col.id === 'status') meetingData[col.label] = getStatusInfo(meeting[col.id])?.label || meeting[col.id];
          else if (col.id === 'function') meetingData[col.label] = getFunctionInfo(meeting[col.id])?.label || meeting[col.id];
          else if (col.id === 'action_taken_approval') meetingData[col.label] = getApprovalInfo(meeting[col.id])?.label || meeting[col.id];
          else if (col.id === 'nature_of_point') meetingData[col.label] = getNatureOfPointInfo(meeting[col.id])?.label || meeting[col.id];
          else meetingData[col.label] = meeting[col.id] || '';
        });
      return meetingData;
    });

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-minutes-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setShowExportMenu(false);
    showNotification('Exported as JSON successfully');
  };

  // Add meeting summary
  const handleAddMeetingSummary = () => {
    if (summaryTitle.trim() && meetingSummary.trim()) {
      // Create a new meeting point for the summary
      const summaryMeeting = {
        id: Date.now(),
        sno: meetings.length + 1,
        function: 'summary',
        project_name: summaryTitle.trim(),
        criticality: 'medium',
        discussion_point: meetingSummary.trim(),
        responsibility: 'All Teams',
        target: new Date().toISOString().split('T')[0],
        status: 'completed',
        action_taken_approval: 'approved',
        nature_of_point: 'summary',
        created_at: new Date().toISOString(),
        is_summary: true
      };
     
      // Add summary to meetings
      onUpdateMeeting(summaryMeeting.id, summaryMeeting);
     
      // Reset form
      setSummaryTitle('');
      setMeetingSummary('');
      setShowAddSummary(false);
      showNotification('Meeting summary added successfully');
    }
  };

  // Validation functions
  const validateMeetingForm = (formData) => {
    const errors = {};
    columns.forEach(col => {
      if (col.required && !formData[col.id]?.toString().trim()) {
        errors[col.id] = `${col.label} is required`;
      }
    });
    return errors;
  };

  const validateCell = (field, value) => {
    const errors = {};
    const column = columns.find(col => col.id === field);
    if (column && column.required && !value?.toString().trim()) {
      errors[field] = `${column.label} is required`;
    }
    return errors;
  };

  // Handle export function
  const handleExport = (format) => {
    switch(format) {
      case 'excel':
        exportToExcel();
        break;
      case 'csv':
        exportToCSV();
        break;
      case 'pdf':
        exportToPDF();
        break;
      case 'word':
        exportToWord();
        break;
      case 'json':
        exportToJSON();
        break;
      default:
        exportToCSV();
    }
  };

  // Render input based on column type (for inline editing)
  const renderInlineInput = (column, value, onChange, error, meetingId = null) => {
    const commonClasses = `w-full px-2 py-1 text-xs sm:text-sm border ${error ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500`;
    const inputProps = {
      value: value || '',
      onChange: (e) => onChange(e.target.value),
      className: commonClasses,
      autoFocus: true,
      onKeyDown: (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          if (meetingId) {
            saveCellEdit();
          } else {
            e.preventDefault();
            // For new row, save on Enter
            saveNewRow();
          }
        }
        if (e.key === 'Escape') {
          if (meetingId) {
            cancelCellEdit();
          } else {
            cancelNewRow();
          }
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          const inputs = Array.from(document.querySelectorAll(`[data-meeting-id="${meetingId}"] input, [data-meeting-id="${meetingId}"] select, [data-meeting-id="${meetingId}"] textarea`));
          const currentIndex = inputs.indexOf(e.target);
          if (e.shiftKey) {
            if (currentIndex > 0) inputs[currentIndex - 1].focus();
          } else {
            if (currentIndex < inputs.length - 1) inputs[currentIndex + 1].focus();
          }
        }
      }
    };

    if (column.type === 'select') {
      let options = column.options || [];
      if (column.id === 'nature_of_point') {
        options = natureOfPointOptions;
      } else if (column.id === 'function') {
        options = functionOptions;
      } else if (column.id === 'criticality') {
        options = CRITICALITY_OPTIONS;
      } else if (column.id === 'status') {
        options = STATUS_OPTIONS;
      } else if (column.id === 'action_taken_approval') {
        options = APPROVAL_OPTIONS;
      } else {
        options = [{ value: 'option1', label: 'Option 1' }, { value: 'option2', label: 'Option 2' }];
      }
     
      return (
        <div>
          <select {...inputProps}>
            <option value="">Select...</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
      );
    } else if (column.type === 'date') {
      return (
        <div>
          <input type="date" {...inputProps} />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
      );
    } else if (column.type === 'textarea') {
      return (
        <div>
          <textarea
            {...inputProps}
            className={`${commonClasses} resize-y min-h-[60px]`}
            rows="2"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (meetingId) {
                  saveCellEdit();
                } else {
                  saveNewRow();
                }
              }
              if (e.key === 'Escape') {
                if (meetingId) {
                  cancelCellEdit();
                } else {
                  cancelNewRow();
                }
              }
            }}
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
      );
    } else if (column.type === 'number') {
      return (
        <div>
          <input
            type="number"
            {...inputProps}
            min={column.id === 'sno' ? "1" : undefined}
            step={column.id === 'sno' ? "1" : "any"}
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
      );
    } else {
      return (
        <div>
          <input
            type="text"
            {...inputProps}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!meetingId) {
                  saveNewRow();
                }
              }
            }}
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
      );
    }
  };

  // Render input for new row
  const renderNewRowInput = (column, value, onChange, error) => {
    return (
      <div data-meeting-id={newRowData.id} data-column-id={column.id}>
        {renderInlineInput(column, value, (val) => handleNewRowChange(column.id, val), error, newRowData.id)}
      </div>
    );
  };

  // Render input for table-wide edit mode
  const renderTableEditInput = (meetingId, column, value, onChange, error) => {
    const commonClasses = `w-full px-2 py-1 text-xs sm:text-sm border ${error ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500`;
   
    if (column.type === 'select') {
      let options = column.options || [];
      if (column.id === 'nature_of_point') {
        options = natureOfPointOptions;
      } else if (column.id === 'function') {
        options = functionOptions;
      } else if (column.id === 'criticality') {
        options = CRITICALITY_OPTIONS;
      } else if (column.id === 'status') {
        options = STATUS_OPTIONS;
      } else if (column.id === 'action_taken_approval') {
        options = APPROVAL_OPTIONS;
      } else {
        options = [{ value: 'option1', label: 'Option 1' }, { value: 'option2', label: 'Option 2' }];
      }
     
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(meetingId, column.id, e.target.value)}
          className={commonClasses}
        >
          <option value="">Select...</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    } else if (column.type === 'date') {
      return (
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(meetingId, column.id, e.target.value)}
          className={commonClasses}
        />
      );
    } else if (column.type === 'textarea') {
      return (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(meetingId, column.id, e.target.value)}
          className={`${commonClasses} resize-y min-h-[60px]`}
          rows="2"
        />
      );
    } else if (column.type === 'number') {
      return (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(meetingId, column.id, e.target.value)}
          className={commonClasses}
          min={column.id === 'sno' ? "1" : undefined}
          step={column.id === 'sno' ? "1" : "any"}
        />
      );
    } else {
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(meetingId, column.id, e.target.value)}
          className={commonClasses}
        />
      );
    }
  };

  // Render input for full row edit mode
  const renderRowEditInput = (column, value, onChange, error) => {
    const commonClasses = `w-full px-2 py-1 text-xs sm:text-sm border ${error ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500`;
   
    if (column.type === 'select') {
      let options = column.options || [];
      if (column.id === 'nature_of_point') {
        options = natureOfPointOptions;
      } else if (column.id === 'function') {
        options = functionOptions;
      } else if (column.id === 'criticality') {
        options = CRITICALITY_OPTIONS;
      } else if (column.id === 'status') {
        options = STATUS_OPTIONS;
      } else if (column.id === 'action_taken_approval') {
        options = APPROVAL_OPTIONS;
      } else {
        options = [{ value: 'option1', label: 'Option 1' }, { value: 'option2', label: 'Option 2' }];
      }
     
      return (
        <div>
          <select
            value={value || ''}
            onChange={(e) => onChange(column.id, e.target.value)}
            className={commonClasses}
          >
            <option value="">Select...</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
      );
    } else if (column.type === 'date') {
      return (
        <div>
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(column.id, e.target.value)}
            className={commonClasses}
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
      );
    } else if (column.type === 'textarea') {
      return (
        <div>
          <textarea
            value={value || ''}
            onChange={(e) => onChange(column.id, e.target.value)}
            className={`${commonClasses} resize-y min-h-[60px]`}
            rows="2"
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
      );
    } else if (column.type === 'number') {
      return (
        <div>
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(column.id, e.target.value)}
            className={commonClasses}
            min={column.id === 'sno' ? "1" : undefined}
            step={column.id === 'sno' ? "1" : "any"}
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
      );
    } else {
      return (
        <div>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(column.id, e.target.value)}
            className={commonClasses}
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
      );
    }
  };

  // Render cell content
  const renderCellContent = (meeting, column) => {
    const value = meeting[column.id] || '';
   
    // TABLE-WIDE EDIT MODE
    if (isTableEditMode && column.editable) {
      const currentValue = tableEditData[meeting.id]?.[column.id] || value;
      return renderTableEditInput(meeting.id, column, currentValue, handleTableEditChange);
    }
   
    // INLINE EDITING MODE - Shows input in the same cell
    if (editingCell.id === meeting.id && editingCell.column === column.id && column.editable) {
      return (
        <div className="relative">
          {renderInlineInput(column, editForm[column.id], handleInlineEditChange, validationErrors[column.id], meeting.id)}
          <div className="absolute -right-8 top-0 flex space-x-1">
            <button
              onClick={() => saveCellEdit()}
              className="p-1 text-green-600 hover:text-green-800 bg-white rounded shadow"
              title="Save (Enter)"
            >
              <Icons.Check className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
            <button
              onClick={cancelCellEdit}
              className="p-1 text-red-600 hover:text-red-800 bg-white rounded shadow"
              title="Cancel (Esc)"
            >
              <Icons.X className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      );
    }

    // VIEW MODE - Normal display
    if (column.id === 'criticality') {
      const criticalityInfo = getCriticalityInfo(value);
     
      return (
        <div className="flex items-center gap-1">
          <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium ${criticalityInfo.color}`}>
            {criticalityInfo.label}
          </span>
        </div>
      );
    } else if (column.id === 'status') {
      const statusInfo = getStatusInfo(value);
      return (
        <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      );
    } else if (column.id === 'function') {
      const functionInfo = getFunctionInfo(value);
      return (
        <span className="text-xs sm:text-sm text-gray-700">
          {functionInfo?.label || value || '-'}
        </span>
      );
    } else if (column.id === 'action_taken_approval') {
      const approvalInfo = getApprovalInfo(value);
      return (
        <span className={`px-2 py-1 rounded text-[10px] sm:text-xs font-medium ${approvalInfo.color}`}>
          {approvalInfo.label}
        </span>
      );
    } else if (column.id === 'nature_of_point') {
      const natureInfo = getNatureOfPointInfo(value);
      return (
        <span className="text-xs sm:text-sm text-gray-700">
          {natureInfo?.label || value || '-'}
        </span>
      );
    } else if (column.id === 'sno') {
      return (
        <div className="text-center">
          <span className="text-xs font-semibold text-gray-600">
            {value}
          </span>
        </div>
      );
    } else if (column.type === 'date' && value) {
      const date = new Date(value);
      const today = new Date();
      const isOverdue = date < today && meeting.status !== 'completed';
     
      return (
        <div className={`text-xs sm:text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
          {date.toLocaleDateString()}
          {isOverdue && <span className="ml-1 text-[10px] text-red-500">(Overdue)</span>}
        </div>
      );
    } else if (column.id === 'project_name') {
      return (
        <div className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
          {value || '-'}
        </div>
      );
    } else if (column.id === 'responsibility') {
      return (
        <div className="text-xs sm:text-sm font-medium text-purple-600 truncate">
          {value || '-'}
        </div>
      );
    } else if (column.id === 'discussion_point') {
      return (
        <div className="text-xs sm:text-sm text-gray-700 line-clamp-5 overflow-hidden max-w-[300px]">
          {value || '-'}
        </div>
      );
    }
   
    // Default text display
    return (
      <div className="text-xs sm:text-sm text-gray-700 truncate">
        {value || '-'}
      </div>
    );
  };

  // Render column header
  const renderColumnHeader = (column) => {
    const isNatureColumn = column.id === 'nature_of_point';
    const isFunctionColumn = column.id === 'function';
    const isProjectNameColumn = column.id === 'project_name';

    if (isNatureColumn) {
      return (
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-1">
            <span className="font-medium text-gray-700">
              {column.label}
            </span>
            {column.required && <span className="text-red-500">*</span>}
            {column.sortable && (
              <button
                onClick={() => handleSort(column.id)}
                className="text-gray-400 hover:text-gray-600"
                title="Sort"
              >
                {getSortIcon(column.id)}
              </button>
            )}
            <button
              onClick={() => setShowNatureOfPointModal(true)}
              className="ml-1 p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
              title="Customize options"
            >
              <Icons.Settings className="h-3 w-3" />
            </button>
          </div>
         
          {/* Nature Filter Dropdown */}
          <div className="relative">
            <select
              value={natureFilter}
              onChange={(e) => setNatureFilter(e.target.value)}
              className="w-full text-[10px] px-2 py-1 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="all">All Types</option>
              {natureOfPointOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    }
   
    if (isFunctionColumn) {
      return (
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-1">
            <span className="font-medium text-gray-700">
              {column.label}
            </span>
            {column.required && <span className="text-red-500">*</span>}
            {column.sortable && (
              <button
                onClick={() => handleSort(column.id)}
                className="text-gray-400 hover:text-gray-600"
                title="Sort"
              >
                {getSortIcon(column.id)}
              </button>
            )}
            <button
              onClick={() => setShowFunctionModal(true)}
              className="ml-1 p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
              title="Customize options"
            >
              <Icons.Settings className="h-3 w-3" />
            </button>
          </div>
         
          {/* Function Filter Dropdown */}
          <div className="relative">
            <select
              value={functionFilter}
              onChange={(e) => setFunctionFilter(e.target.value)}
              className="w-full text-[10px] px-2 py-1 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="all">All Functions</option>
              {functionOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    }
   
    if (isProjectNameColumn) {
      return (
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-1">
            <span className="font-medium text-gray-700">
              {column.label}
            </span>
            {column.required && <span className="text-red-500">*</span>}
            {column.sortable && (
              <button
                onClick={() => handleSort(column.id)}
                className="text-gray-400 hover:text-gray-600"
                title="Sort"
              >
                {getSortIcon(column.id)}
              </button>
            )}
          </div>
         
          {/* Department Name Search Filter */}
          <div className="relative">
            <input
              type="text"
              placeholder="Filter department..."
              value={projectNameFilter}
              onChange={(e) => setProjectNameFilter(e.target.value)}
              className="w-full text-[10px] px-2 py-1 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
            {projectNameFilter && (
              <button
                onClick={() => setProjectNameFilter('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Icons.X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      );
    }
   
    return (
      <div className="flex items-center space-x-1">
        <span className="font-medium text-gray-700">
          {column.label}
        </span>
        {column.required && <span className="text-red-500">*</span>}
        {column.sortable && (
          <button
            onClick={() => handleSort(column.id)}
            className="text-gray-400 hover:text-gray-600"
            title="Sort"
          >
            {getSortIcon(column.id)}
          </button>
        )}
      </div>
    );
  };

  // Function Options Modal
  const renderFunctionOptionsModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900 text-sm sm:text-base">Manage Function Options</h3>
          <button onClick={() => setShowFunctionModal(false)} className="text-gray-400 hover:text-gray-600">
            <Icons.X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
       
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              placeholder="Add new function option..."
              value={newFunctionOption}
              onChange={(e) => setNewFunctionOption(e.target.value)}
              className="flex-grow px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded"
              onKeyDown={(e) => {
                if (e.key === 'Enter') addCustomFunctionOption();
              }}
            />
            <button
              onClick={addCustomFunctionOption}
              className="flex items-center justify-center px-3 py-2 text-xs sm:text-sm bg-black text-white rounded hover:bg-gray-800 whitespace-nowrap"
              title="Add Option"
            >
              <Icons.Plus className="h-4 w-4 mr-1" />
              Add
            </button>
          </div>
         
          <div className="space-y-2 max-h-60 overflow-y-auto">
            <div className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Icons.List className="h-3 w-3 text-blue-600" />
              All Options ({functionOptions.length})
            </div>
            {functionOptions.map((option) => (
              <div key={option.value} className="flex items-center justify-between p-2 border border-gray-200 rounded hover:bg-gray-50">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 rounded text-xs font-medium text-gray-700">
                    {option.label}
                  </span>
                </div>
               
                <div className="flex items-center space-x-1">
                  {/* DELETE BUTTON - Available for all options except if it's the last one */}
                  {functionOptions.length > 1 && (
                    <button
                      onClick={() => removeFunctionOption(option.value)}
                      className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                      title="Remove option"
                    >
                      <Icons.Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
           
            {functionOptions.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <Icons.PlusCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No options added yet</p>
                <p className="text-xs text-gray-400 mt-1">Add options using the input above</p>
              </div>
            )}
          </div>
        </div>
       
        <div className="text-xs text-gray-500 mt-4">
          <p className="flex items-center gap-1 mb-1">
            <Icons.Info className="h-3 w-3" />
            <span>All options can be removed except the last one. At least one option must remain.</span>
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-3 sm:space-y-4 px-0">
      {/* Notification Banner */}
      {notification.show && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
          notification.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
          'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          <div className="flex items-center">
            <span className="text-sm font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification({ show: false, message: '', type: '' })}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              <Icons.X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Meeting Prompt Modal */}
      {showDeletePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                {showDeletePrompt.type === 'multiple' ? 'Confirm Delete Multiple' : 'Confirm Delete'}
              </h3>
              <button onClick={cancelDelete} className="text-gray-400 hover:text-gray-600">
                <Icons.X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            <div className="mb-4">
              {showDeletePrompt.type === 'multiple' ? (
                <p className="text-xs sm:text-sm text-gray-600">
                  Are you sure you want to delete <span className="font-medium">{showDeletePrompt.count} selected meeting(s)</span>?
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-gray-600">
                  Are you sure you want to delete meeting point for <span className="font-medium">{showDeletePrompt.projectName}</span>?
                </p>
              )}
              <p className="text-xs text-red-600 mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelDelete}
                className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={showDeletePrompt.type === 'multiple' ? confirmDeleteMultipleMeetings : confirmDeleteMeeting}
                className="px-3 py-1.5 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                {showDeletePrompt.type === 'multiple' ? `Delete ${showDeletePrompt.count} Meeting(s)` : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Column Prompt Modal */}
      {showDeleteColumnPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Delete Column</h3>
              <button onClick={() => setShowDeleteColumnPrompt(null)} className="text-gray-400 hover:text-gray-600">
                <Icons.X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-xs sm:text-sm text-gray-600">
                Are you sure you want to delete column <span className="font-medium">"{showDeleteColumnPrompt.label}"</span>?
              </p>
              <p className="text-xs text-red-600 mt-1">
                This will remove the column from all meetings. This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteColumnPrompt(null)}
                className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteColumn(showDeleteColumnPrompt.id)}
                className="px-3 py-1.5 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Column
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Column Management Modal */}
      {showColumnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Manage Columns</h3>
              <button onClick={() => setShowColumnModal(false)} className="text-gray-400 hover:text-gray-600">
                <Icons.X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
           
            <div className="mb-4 p-3 rounded bg-gray-50">
              <h4 className="font-medium text-gray-900 text-sm mb-2">Add New Column</h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  ref={newColumnInputRef}
                  type="text"
                  placeholder="Column name"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  className="flex-grow px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddColumn();
                    else if (e.key === 'Escape') setShowAddColumnForm(false);
                  }}
                />
                <button
                  onClick={handleAddColumn}
                  className="flex items-center justify-center px-3 py-2 text-xs sm:text-sm bg-black text-white rounded hover:bg-gray-800 whitespace-nowrap"
                  title="Add Column"
                >
                  <Icons.Plus className="h-4 w-4 mr-1" />
                  Add
                </button>
              </div>
            </div>
           
            <div className="mb-4">
              <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Available Columns ({columns.filter(col => col.type !== 'action').length})</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {columns
                  .filter(col => col.type !== 'action')
                  .map((column) => {
                    const defaultColumnIds = DEFAULT_COLUMNS.map(col => col.id);
                    const isDefaultColumn = defaultColumnIds.includes(column.id) || column.id === 'nature_of_point';
                   
                    return (
                      <div key={column.id} className="flex items-center justify-between p-2 border border-gray-200 rounded hover:bg-gray-50">
                        <div className="flex items-center space-x-2">
                          {editingColumnId === column.id ? (
                            <input
                              type="text"
                              value={editingColumnName}
                              onChange={(e) => setEditingColumnName(e.target.value)}
                              className="px-2 py-1 text-xs sm:text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  saveColumnEdit(column.id);
                                } else if (e.key === 'Escape') {
                                  cancelColumnEdit();
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <>
                              <span className="text-xs sm:text-sm font-medium">{column.label}</span>
                              {column.required && (
                                <span className="text-red-500 text-xs">*</span>
                              )}
                              {isDefaultColumn && (
                                <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Default</span>
                              )}
                            </>
                          )}
                        </div>
                       
                        <div className="flex items-center space-x-1">
                          {/* EDIT BUTTON - Available for all columns */}
                          {editingColumnId === column.id ? (
                            <>
                              <button
                                onClick={() => saveColumnEdit(column.id)}
                                className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                                title="Save"
                              >
                                <Icons.Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </button>
                              <button
                                onClick={cancelColumnEdit}
                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                title="Cancel"
                              >
                                <Icons.X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditColumn(column.id)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                title="Edit column name"
                              >
                                <Icons.Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </button>
                             
                              {/* DELETE BUTTON - Available for all columns except if it's the last column */}
                              {columns.filter(col => col.type !== 'action').length > 1 && (
                                <button
                                  onClick={() => setShowDeleteColumnPrompt({ id: column.id, label: column.label })}
                                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                  title="Delete column"
                                >
                                  <Icons.Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </button>
                              )}
                            </>
                          )}
                         
                          {/* SETTINGS BUTTON for Nature of Point column */}
                          {column.id === 'nature_of_point' && (
                            <button
                              onClick={() => setShowNatureOfPointModal(true)}
                              className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                              title="Customize options"
                            >
                              <Icons.Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                          )}
                         
                          {/* SETTINGS BUTTON for Function column */}
                          {column.id === 'function' && (
                            <button
                              onClick={() => setShowFunctionModal(true)}
                              className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                              title="Customize options"
                            >
                              <Icons.Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
           
            <div className="text-xs text-gray-500 mt-4">
              <p className="flex items-center gap-1 mb-1">
                <Icons.Info className="h-3 w-3" />
                <span>All columns can be edited or deleted. At least one column must remain.</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nature of Point Options Modal */}
      {showNatureOfPointModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Manage Nature of Point Options</h3>
              <button onClick={() => setShowNatureOfPointModal(false)} className="text-gray-400 hover:text-gray-600">
                <Icons.X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
           
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Add new nature option..."
                  value={newNatureOption}
                  onChange={(e) => setNewNatureOption(e.target.value)}
                  className="flex-grow px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addCustomNatureOption();
                  }}
                />
                <button
                  onClick={addCustomNatureOption}
                  className="flex items-center justify-center px-3 py-2 text-xs sm:text-sm bg-black text-white rounded hover:bg-gray-800 whitespace-nowrap"
                  title="Add Option"
                >
                  <Icons.Plus className="h-4 w-4 mr-1" />
                  Add
                </button>
              </div>
             
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <div className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Icons.List className="h-3 w-3 text-blue-600" />
                  All Options ({natureOfPointOptions.length})
                </div>
                {natureOfPointOptions.map((option) => (
                  <div key={option.value} className="flex items-center justify-between p-2 border border-gray-200 rounded hover:bg-gray-50">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 rounded text-xs font-medium text-gray-700">
                        {option.label}
                      </span>
                    </div>
                   
                    <div className="flex items-center space-x-1">
                      {/* DELETE BUTTON - Available for all options except if it's the last one */}
                      {natureOfPointOptions.length > 1 && (
                        <button
                          onClick={() => removeNatureOption(option.value)}
                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Remove option"
                        >
                          <Icons.Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
               
                {natureOfPointOptions.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <Icons.PlusCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No options added yet</p>
                    <p className="text-xs text-gray-400 mt-1">Add options using the input above</p>
                  </div>
                )}
              </div>
            </div>
           
            <div className="text-xs text-gray-500 mt-4">
              <p className="flex items-center gap-1 mb-1">
                <Icons.Info className="h-3 w-3" />
                <span>All options can be removed except the last one. At least one option must remain.</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Function Options Modal */}
      {showFunctionModal && renderFunctionOptionsModal()}

      {/* MAIN BORDER CONTAINER */}
      <div className="bg-white border border-gray-300 rounded mx-0">
       
        {/* TOOLBAR SECTION */}
        <div className="p-4 border-b border-gray-300">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
           
            {/* LEFT SIDE */}
            <div className="flex flex-1 flex-col sm:flex-row gap-2 sm:gap-2 items-start sm:items-center">
              {/* Search */}
              <div className="relative w-full sm:w-auto">
                <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search meetings..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full sm:w-48 h-10 pl-9 pr-3 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            {/* RIGHT SIDE - Top Right +, Edit, and - buttons */}
            <div className="flex gap-2 mt-2 sm:mt-0">
              {/* + Button to add column */}
              <button
                onClick={() => setShowColumnModal(true)}
                className="flex items-center justify-center h-10 w-10 bg-black text-white rounded hover:bg-gray-800"
                title="Manage Columns"
              >
                <Icons.Plus className="h-5 w-5" />
              </button>

              {/* Export Button with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-1 h-10 px-3 bg-black text-white rounded text-xs sm:text-sm hover:bg-gray-800"
                >
                  <Icons.Download className="h-4 w-4" />
                  Export
                </button>
               
                {/* Export Dropdown */}
                {showExportMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowExportMenu(false)}
                    />
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-300 rounded shadow-lg z-50">
                      <button
                        onClick={() => handleExport('excel')}
                        className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 w-full"
                      >
                        <Icons.FileSpreadsheet className="h-4 w-4" />
                        <span>Excel</span>
                      </button>
                      <button
                        onClick={() => handleExport('csv')}
                        className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 w-full"
                      >
                        <Icons.FileText className="h-4 w-4" />
                        <span>CSV</span>
                      </button>
                      <button
                        onClick={() => handleExport('pdf')}
                        className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 w-full"
                      >
                        <Icons.FileText className="h-4 w-4" />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={() => handleExport('word')}
                        className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 w-full"
                      >
                        <Icons.FileText className="h-4 w-4" />
                        <span>Word</span>
                      </button>
                      <button
                        onClick={() => handleExport('json')}
                        className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 w-full"
                      >
                        <Icons.FileCode className="h-4 w-4" />
                        <span>JSON</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
             
              {/* DELETE SELECTED ROWS BUTTON - NEW */}
              {selectedRows.length > 0 && (
                <button
                  onClick={handleDeleteSelectedRows}
                  className="flex items-center gap-1 h-10 px-3 bg-red-600 text-white rounded text-xs sm:text-sm hover:bg-red-700"
                  title="Delete Selected Rows"
                >
                  <Icons.Trash2 className="h-4 w-4" />
                  Delete ({selectedRows.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TABLE SECTION with scroll */}
        <div className="overflow-auto max-h-[calc(100vh-300px)]">
          <table className="min-w-full text-xs sm:text-sm border-collapse">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr className="border-b border-gray-300">
                {/* Checkbox column for row selection */}
                <th className="text-left py-3 px-2 font-medium text-gray-700 whitespace-nowrap border-r border-gray-300 w-10">
                  <input
                    type="checkbox"
                    checked={selectAll && sortedMeetings.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    disabled={sortedMeetings.length === 0}
                  />
                </th>
               
                {/* Rest of columns */}
                {columns
                  .filter(col => col.visible)
                  .map((column) => (
                    <th
                      key={column.id}
                      className={`text-left py-3 px-4 font-medium text-gray-700 whitespace-nowrap border-r border-gray-300 last:border-r-0 ${
                        column.id === 'sno' ? 'w-3' :
                        column.id === 'discussion_point' ? 'w-120' :
                        column.id === 'project_name' ? 'w-48' :
                        column.id === 'nature_of_point' ? 'w-40' :
                        column.id === 'function' ? 'w-40' :
                        column.id === 'criticality' ? 'w-32' : ''
                      }`}
                    >
                      {renderColumnHeader(column)}
                    </th>
                  ))}
              </tr>
            </thead>

            <tbody>
              {/* EXISTING MEETINGS */}
              {sortedMeetings.map((meeting) => (
                <tr
                  key={meeting.id}
                  className="border-b border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  {/* Checkbox for row selection */}
                  <td className="py-3 px-2 whitespace-nowrap border-r border-gray-300">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(meeting.id)}
                      onChange={() => handleRowSelect(meeting.id)}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </td>
                 
                  {/* FULL ROW EDIT MODE */}
                  {editingId === meeting.id ? (
                    <>
                      {columns
                        .filter(col => col.visible)
                        .map((column) => (
                          <td key={column.id} className={`py-3 px-4 whitespace-nowrap border-r border-gray-300 last:border-r-0 ${
                            column.id === 'discussion_point' ? 'max-w-[700px]' : ''
                          }`}>
                            {column.editable ? (
                              renderRowEditInput(column, editForm[column.id], handleEditFormChange, validationErrors[column.id])
                            ) : (
                              <div className="text-xs sm:text-sm text-gray-700">
                                {renderCellContent(meeting, column)}
                              </div>
                            )}
                          </td>
                        ))}
                    </>
                  ) : (
                    <>
                      {/* VIEW MODE WITH INLINE EDITING */}
                      {columns
                        .filter(col => col.visible)
                        .map((column) => (
                          <td
                            key={column.id}
                            className={`py-3 px-4 border-r border-gray-300 last:border-r-0 ${
                              column.id === 'sno' ? 'text-center' :
                              column.id === 'discussion_point' ? 'max-w-[400px] overflow-hidden' :
                              'whitespace-nowrap'
                            }`}
                            onDoubleClick={() => {
                              if (column.editable && column.type !== 'action') {
                                startCellEditing(meeting.id, column.id, meeting[column.id]);
                              }
                            }}
                            style={{ cursor: (column.editable && column.type !== 'action') ? 'pointer' : 'default' }}
                          >
                            {renderCellContent(meeting, column)}
                          </td>
                        ))}
                    </>
                  )}
                </tr>
              ))}

              {/* NEW ROW BEING ADDED */}
              {addingNewRow && (
                <tr className="border-b border-gray-300 bg-blue-50 hover:bg-blue-100">
                  {/* Checkbox for new row */}
                  <td className="py-3 px-2 whitespace-nowrap border-r border-gray-300">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(newRowData.id)}
                      onChange={() => handleRowSelect(newRowData.id)}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </td>
                 
                  {columns
                    .filter(col => col.visible)
                    .map((column) => (
                      <td key={column.id} className={`py-3 px-4 border-r border-gray-300 ${
                        column.id === 'discussion_point' ? 'max-w-[400px]' : ''
                      }`}>
                        {renderNewRowInput(column, newRowData[column.id], handleNewRowChange, validationErrors[column.id])}
                      </td>
                    ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER SECTION */}
        <div className="px-4 py-3 border-t border-gray-300 text-xs text-gray-600 flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* BOTTOM LEFT - + button to add row */}
          <div className="flex items-center gap-2">
            {/* + Button to add row */}
            <button
              onClick={handleAddRow}
              className="flex items-center justify-center h-8 w-8 bg-black text-white rounded hover:bg-gray-800"
              title="Add New Row"
            >
              <Icons.Plus className="h-4 w-4" />
            </button>

            <span className="ml-2">
              Showing {sortedMeetings.length} of {meetings.length} meeting points
              {selectedRows.length > 0 && (
                <span className="ml-2 text-blue-600">
                  ({selectedRows.length} selected)
                </span>
              )}
              {(natureFilter !== 'all' || functionFilter !== 'all' || projectNameFilter) && (
                <span className="ml-2 text-purple-600">
                  (Filtered: {natureFilter !== 'all' ? `Nature: ${natureFilter}` : ''}
                  {natureFilter !== 'all' && (functionFilter !== 'all' || projectNameFilter) && ', '}
                  {functionFilter !== 'all' ? `Function: ${functionFilter}` : ''}
                  {functionFilter !== 'all' && projectNameFilter && ', '}
                  {projectNameFilter ? `Department: ${projectNameFilter}` : ''})
                </span>
              )}
            </span>
          </div>

          {/* BOTTOM RIGHT */}
          <div className="flex items-center gap-2">
            <span className="text-blue-600">
              ({columns.filter(col => col.visible).length} of {columns.length} columns visible)
            </span>
           
            {/* Delete Selected Rows button in footer - ALTERNATIVE LOCATION */}
            {selectedRows.length > 0 && (
              <button
                onClick={handleDeleteSelectedRows}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded text-xs sm:text-sm hover:bg-red-700"
                title="Delete Selected Rows"
              >
                <Icons.Trash2 className="h-4 w-4" />
                Delete {selectedRows.length}
              </button>
            )}
           
            {/* Edit Table button for table-wide edit mode */}
            <button
              onClick={toggleTableEditMode}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs sm:text-sm ${
                isTableEditMode
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              title={isTableEditMode ? "Save all changes" : "Edit entire table"}
            >
              {isTableEditMode ? (
                <>
                  <Icons.Check className="h-4 w-4" />
                </>
              ) : (
                <>
                  <Icons.Edit className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingTable;
