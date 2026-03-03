import React, { useState, useEffect } from 'react';
import { 
  Upload, File, CheckCircle, Clock, AlertCircle, Download, Trash2, Eye, Edit,
  Plus, Search, X, ChevronUp, ChevronDown, Filter,
  AlertTriangle, FileText, FileSpreadsheet, Database,
  HardDrive, Archive, Check, Calendar, Save
} from 'lucide-react';
import * as XLSX from 'xlsx';

const UploadTrackers = () => {
  // Initial columns configuration - Added department column
  const initialColumns = [
    { id: 'name', label: 'File Name', sortable: true, type: 'text', required: true },
    { id: 'department', label: 'Department', sortable: true, type: 'text', required: false },
    { id: 'date', label: 'Upload Date', sortable: true, type: 'date', required: true },
    { id: 'uploadedBy', label: 'Uploaded By', sortable: true, type: 'text', required: false },
  ];

  // Load columns from localStorage for column management
  const [availableColumns, setAvailableColumns] = useState(() => {
    const savedColumns = localStorage.getItem('upload_columns');
    return savedColumns ? JSON.parse(savedColumns) : initialColumns;
  });

  const [trackers, setTrackers] = useState(() => {
    const savedTrackers = localStorage.getItem('upload_trackers');
    return savedTrackers ? JSON.parse(savedTrackers) : [
      { id: 3, name: 'Inventory Update.csv', type: 'CSV', department: 'Operations', date: '2024-01-13', uploadedBy: 'Bob Johnson' },
    ];
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeletePrompt, setShowDeletePrompt] = useState(null);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('text');
  const [editingColumn, setEditingColumn] = useState(null);
  const [tempColumnName, setTempColumnName] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [showDeleteColumnPrompt, setShowDeleteColumnPrompt] = useState(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  
  // Excel Viewer State
  const [excelViewerData, setExcelViewerData] = useState(null);
  const [excelEditMode, setExcelEditMode] = useState(false);
  const [excelEditData, setExcelEditData] = useState([]);
  const [currentSheet, setCurrentSheet] = useState(0);
  const [excelHeaders, setExcelHeaders] = useState([]);
  
  // Upload Form Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    id: '',
    name: '',
    department: '',
    file: null
  });
  const [uploadFormErrors, setUploadFormErrors] = useState({});
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  // Filter state
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  // Status configuration
  const statusConfig = {
    'Completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle, bgColor: 'bg-green-50' },
    'Processing': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, bgColor: 'bg-yellow-50' },
    'Failed': { color: 'bg-red-100 text-red-800', icon: AlertCircle, bgColor: 'bg-red-50' },
    'Pending': { color: 'bg-blue-100 text-blue-800', icon: Clock, bgColor: 'bg-blue-50' },
    'Queued': { color: 'bg-purple-100 text-purple-800', icon: Clock, bgColor: 'bg-purple-50' }
  };

  const statusOptions = ['All Status', 'Completed', 'Processing', 'Failed', 'Pending', 'Queued'];

  // Store uploaded file data
  const [uploadedFilesData, setUploadedFilesData] = useState(() => {
    const savedData = localStorage.getItem('uploaded_files_data');
    return savedData ? JSON.parse(savedData) : {};
  });

  // Save trackers, columns, and file data to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('upload_trackers', JSON.stringify(trackers));
    localStorage.setItem('upload_columns', JSON.stringify(availableColumns));
    localStorage.setItem('uploaded_files_data', JSON.stringify(uploadedFilesData));
  }, [trackers, availableColumns, uploadedFilesData]);

  // Get unique departments from trackers data
  const uniqueDepartments = [...new Set(trackers.map(tracker => tracker.department).filter(Boolean))];

  // Filter trackers based on search and filters
  const filteredTrackers = trackers.filter(tracker => {
    const matchesSearch = Object.values(tracker).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesDept = !departmentFilter || tracker.department?.toLowerCase().includes(departmentFilter.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || tracker.status === statusFilter;
    
    return matchesSearch && matchesDept && matchesStatus;
  });

  // Calculate statistics
  const totalUploads = trackers.length;
  const successfulUploads = trackers.filter(t => t.status === 'Completed').length;
  const totalRecords = trackers.reduce((sum, t) => sum + (t.records || 0), 0);
  const failedUploads = trackers.filter(t => t.status === 'Failed').length;

  // Sort trackers
  const sortedTrackers = React.useMemo(() => {
    if (!sortConfig.key) return filteredTrackers;

    return [...filteredTrackers].sort((a, b) => {
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
  }, [filteredTrackers, sortConfig]);

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Get sort icon for a column
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 opacity-30" />;
    }
    return sortConfig.direction === 'ascending' 
      ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /> 
      : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />;
  };

  // Column editing functions
  const startEditColumn = (columnId, currentLabel) => {
    setEditingColumn(columnId);
    setTempColumnName(currentLabel);
  };

  const saveEditColumn = (columnId) => {
    if (tempColumnName.trim()) {
      setAvailableColumns(availableColumns.map(col => 
        col.id === columnId ? { ...col, label: tempColumnName } : col
      ));
      setEditingColumn(null);
      setTempColumnName('');
    }
  };

  const cancelEditColumn = () => {
    setEditingColumn(null);
    setTempColumnName('');
  };

  const handleDeleteColumn = (columnId) => {
    const column = availableColumns.find(col => col.id === columnId);
    const isFixedColumn = ['name', 'department', 'date', 'uploadedBy'].includes(columnId);
    
    if (isFixedColumn) {
      setShowDeleteColumnPrompt({
        id: columnId,
        title: 'Cannot Delete Column',
        message: `Cannot delete fixed column: ${column.label}. Fixed columns are required for the Upload Trackers.`,
        type: 'warning',
        columnLabel: column.label
      });
      return;
    }
    
    setShowDeleteColumnPrompt({
      id: columnId,
      title: 'Delete Column',
      columnLabel: column.label,
      type: 'delete'
    });
  };

  const confirmDeleteColumn = () => {
    if (!showDeleteColumnPrompt) return;
    
    const columnId = showDeleteColumnPrompt.id;
    setAvailableColumns(availableColumns.filter(col => col.id !== columnId));
    
    // Remove this column from all trackers
    setTrackers(trackers.map(tracker => {
      const newTracker = { ...tracker };
      delete newTracker[columnId];
      return newTracker;
    }));
    
    setShowDeleteColumnPrompt(null);
  };

  // Validation
  const validateEditForm = (tracker) => {
    const errors = {};
    for (const col of availableColumns) {
      if (col.required && !tracker[col.id]?.toString().trim()) {
        errors[col.id] = `${col.label} is required`;
      }
    }
    return errors;
  };

  // Start editing tracker
  const startEditing = (tracker) => {
    setEditingId(tracker.id);
    const editData = { ...tracker };
    availableColumns.forEach(col => {
      if (!editData.hasOwnProperty(col.id)) {
        editData[col.id] = col.type === 'select' ? 'Pending' : '';
      }
    });
    setEditForm(editData);
    setValidationErrors({});
  };

  const saveEdit = () => {
    const errors = validateEditForm(editForm);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setTrackers(trackers.map(tracker => 
      tracker.id === editingId ? { ...tracker, ...editForm } : tracker
    ));
    setEditingId(null);
    setEditForm({});
    setValidationErrors({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
    setValidationErrors({});
  };

  // Delete tracker
  const showDeleteConfirmation = (id, name) => setShowDeletePrompt({ id, name });

  const confirmDeleteTracker = () => {
    if (showDeletePrompt) {
      setTrackers(trackers.filter(tracker => tracker.id !== showDeletePrompt.id));
      
      // Remove from uploaded files data
      const newFileData = { ...uploadedFilesData };
      delete newFileData[showDeletePrompt.id];
      setUploadedFilesData(newFileData);
      
      setShowDeletePrompt(null);
    }
  };

  const cancelDelete = () => setShowDeletePrompt(null);

  // Add new column
  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      const newColumnId = newColumnName.toLowerCase().replace(/\s+/g, '_');
      
      // Check if column already exists
      if (availableColumns.find(col => col.id === newColumnId)) {
        alert('Column with this name already exists');
        return;
      }
      
      const newColumn = {
        id: newColumnId,
        label: newColumnName,
        sortable: true,
        type: newColumnType,
        required: false
      };
      
      setAvailableColumns([...availableColumns, newColumn]);
      
      // Reset form
      setNewColumnName('');
      setNewColumnType('text');
    }
  };

  // Upload functions
  const openUploadModal = () => {
    setShowUploadModal(true);
    setUploadForm({
      id: '',
      name: '',
      department: '',
      file: null
    });
    setUploadFormErrors({});
  };

  const readFileData = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const fileExtension = file.name.split('.').pop().toLowerCase();
          
          if (fileExtension === 'csv') {
            const workbook = XLSX.read(data, { type: 'binary' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length > 0) {
              const headers = jsonData[0];
              const rows = jsonData.slice(1);
              
              resolve({
                headers,
                data: rows,
                sheets: [{
                  name: 'Sheet1',
                  headers: headers,
                  data: rows
                }]
              });
            } else {
              resolve({
                headers: ['No Data'],
                data: [],
                sheets: [{
                  name: 'Sheet1',
                  headers: ['No Data'],
                  data: []
                }]
              });
            }
          } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheets = workbook.SheetNames.map(sheetName => {
              const worksheet = workbook.Sheets[sheetName];
              const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
              
              if (jsonData.length > 0) {
                return {
                  name: sheetName,
                  headers: jsonData[0],
                  data: jsonData.slice(1)
                };
              } else {
                return {
                  name: sheetName,
                  headers: ['No Data'],
                  data: []
                };
              }
            });
            
            resolve({
              headers: sheets[0].headers,
              data: sheets[0].data,
              sheets: sheets
            });
          } else if (fileExtension === 'json') {
            const jsonData = JSON.parse(data);
            let headers = [];
            let rows = [];
            
            if (Array.isArray(jsonData) && jsonData.length > 0) {
              headers = Object.keys(jsonData[0]);
              rows = jsonData.map(item => Object.values(item));
            } else if (typeof jsonData === 'object') {
              headers = ['Key', 'Value'];
              rows = Object.entries(jsonData);
            }
            
            resolve({
              headers,
              data: rows,
              sheets: [{
                name: 'Data',
                headers: headers,
                data: rows
              }]
            });
          } else {
            const lines = data.split('\n').filter(line => line.trim() !== '');
            const headers = ['Line', 'Content'];
            const rows = lines.map((line, index) => [index + 1, line.trim()]);
            
            resolve({
              headers,
              data: rows,
              sheets: [{
                name: 'Content',
                headers: headers,
                data: rows
              }]
            });
          }
        } catch (error) {
          console.error('Error parsing file:', error);
          reject(new Error(`Error parsing file: ${error.message}`));
        }
      };
      
      reader.onerror = (error) => {
        reject(new Error(`File reading error: ${error.target.error}`));
      };
      
      if (file.name.endsWith('.json') || file.name.endsWith('.txt')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  };

  const handleModalFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileType = file.name.split('.').pop().toUpperCase();
      const allowedTypes = ['CSV', 'XLSX', 'XLS', 'JSON', 'TXT'];
      
      if (!allowedTypes.includes(fileType)) {
        setUploadFormErrors({...uploadFormErrors, file: 'Please upload CSV, Excel, or JSON files only'});
        return;
      }
      
      if (file.size > 50 * 1024 * 1024) {
        setUploadFormErrors({...uploadFormErrors, file: 'File size must be less than 50MB'});
        return;
      }
      
      setUploadForm({...uploadForm, file});
      setUploadFormErrors({...uploadFormErrors, file: ''});
    }
  };

  const handleUploadSubmit = async () => {
    const errors = {};
    if (!uploadForm.id.trim()) errors.id = 'ID is required';
    if (!uploadForm.name.trim()) errors.name = 'Name is required';
    if (!uploadForm.department.trim()) errors.department = 'Department is required';
    if (!uploadForm.file) errors.file = 'File is required';
    
    if (Object.keys(errors).length > 0) {
      setUploadFormErrors(errors);
      return;
    }
    
    setShowUploadModal(false);
    await handleFileUpload(uploadForm.file);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    setUploading(true);
    setProgress(0);
    setSelectedFile(file);
    
    try {
      const fileData = await readFileData(file);
      
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            
            const newTracker = {
              id: Math.max(...trackers.map(t => t.id), 0) + 1,
              name: file.name,
              type: file.name.split('.').pop().toUpperCase(),
              department: uploadForm.department,
              date: new Date().toISOString().split('T')[0],
              uploadedBy: 'Current User',
              uploadId: uploadForm.id,
              uploadName: uploadForm.name,
              uploadDepartment: uploadForm.department
            };
            
            setUploadedFilesData(prev => ({
              ...prev,
              [newTracker.id]: fileData
            }));
            
            setTrackers([newTracker, ...trackers]);
            
            setUploading(false);
            setProgress(0);
            setSelectedFile(null);
            setUploadForm({
              id: '',
              name: '',
              department: '',
              file: null
            });
            
            return 100;
          }
          return prev + 20;
        });
      }, 300);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploading(false);
      setProgress(0);
      alert(`Error reading file: ${error.message}. Please make sure it's a valid file format.`);
    }
  };

  // Excel viewer functions
  const showExcelViewer = (tracker) => {
    const fileData = uploadedFilesData[tracker.id];
    
    if (!fileData) {
      alert('No file data available. Please re-upload the file.');
      return;
    }
    
    setExcelViewerData({
      ...tracker,
      sheets: fileData.sheets
    });
    
    const currentSheetData = fileData.sheets[0];
    setExcelEditData(currentSheetData.data.map(row => [...(row || [])]));
    setExcelHeaders(currentSheetData.headers || []);
    setExcelEditMode(false);
    setCurrentSheet(0);
  };

  const closeExcelViewer = () => {
    setExcelViewerData(null);
    setExcelEditMode(false);
    setExcelEditData([]);
    setExcelHeaders([]);
  };

  // Export functions
  const handleExport = (format) => {
    const dataToExport = sortedTrackers.map(tracker => {
      const row = {};
      availableColumns.forEach(col => {
        row[col.label] = tracker[col.id] || '';
      });
      return row;
    });
    
    let content, mimeType, filename;
    
    switch(format) {
      case 'excel':
        // For simplicity, creating CSV as Excel can open it
        content = convertToCSV(dataToExport);
        mimeType = 'text/csv';
        filename = 'upload_trackers.csv';
        break;
      case 'csv':
        content = convertToCSV(dataToExport);
        mimeType = 'text/csv';
        filename = 'upload_trackers.csv';
        break;
      case 'json':
        content = JSON.stringify(dataToExport, null, 2);
        mimeType = 'application/json';
        filename = 'upload_trackers.json';
        break;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    setShowExportDropdown(false);
  };

  const convertToCSV = (data) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const cell = row[header];
          return typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  };

  // Render Input Fields
  const handleInputChange = (field, value, isEdit=false) => {
    if (isEdit) {
      setEditForm({ ...editForm, [field]: value });
    }
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderInput = (col, value, onChange, error) => {
    const inputClass = `w-full px-2 py-1 text-xs sm:text-sm border ${error ? 'border-red-500' : 'border-gray-300'} rounded`;
    
    if (col.id === 'status' || col.type === 'select') return (
      <div>
        <select value={value||'Pending'} onChange={e=>onChange(col.id,e.target.value)} className={inputClass}>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Processing">Processing</option>
          <option value="Failed">Failed</option>
        </select>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
    
    if (col.type === 'date') return (
      <div>
        <input type="date" value={value||''} onChange={e=>onChange(col.id,e.target.value)} className={inputClass} />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
    
    return (
      <div>
        <input type="text" value={value||''} onChange={e=>onChange(col.id,e.target.value)} className={inputClass} />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  };

  const renderCellContent = (col, value, tracker) => {
    if (col.id === 'name') {
      const getFileColor = (type) => {
        switch(type) {
          case 'CSV': return 'text-blue-600';
          case 'XLS':
          case 'XLSX': return 'text-green-600';
          case 'JSON': return 'text-purple-600';
          default: return 'text-gray-600';
        }
      };
      
      return (
        <div className="flex items-center">
          <File className="h-4 w-4 text-gray-500 mr-2" />
          <span className={`font-medium ${getFileColor(tracker.type)}`}>{value || '-'}</span>
        </div>
      );
    } else if (col.id === 'department') {
      return (
        <div className="flex items-center">
          <span className="font-medium">{value || '-'}</span>
        </div>
      );
    } else if (col.id === 'date') {
      return (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 text-gray-500 mr-1" />
          <span>{value || '-'}</span>
        </div>
      );
    } else if (col.id === 'uploadedBy') {
      return (
        <div className="flex items-center">
          <span className="font-medium">{value || '-'}</span>
        </div>
      );
    } else if (col.id === 'status') {
      const StatusIcon = statusConfig[value]?.icon || AlertCircle;
      const statusColor = statusConfig[value]?.color || 'bg-gray-100 text-gray-800';
      
      return (
        <div className="flex items-center">
          <StatusIcon className={`h-4 w-4 mr-1 ${
            value === 'Completed' ? 'text-green-500' :
            value === 'Processing' ? 'text-yellow-500' :
            value === 'Failed' ? 'text-red-500' :
            'text-gray-500'
          }`} />
          <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs ${statusColor}`}>
            {value || '-'}
          </span>
        </div>
      );
    }
    return value || '-';
  };

  return (
    <div className="space-y-3 sm:space-y-4 px-0">
      {/* Delete Tracker Modal */}
      {showDeletePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Confirm Delete</h3>
              <button onClick={cancelDelete} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4 sm:h-5 sm:w-5"/></button>
            </div>
            <div className="mb-4">
              <p className="text-xs sm:text-sm text-gray-600">Delete upload record <span className="font-medium">{showDeletePrompt.name}</span>?</p>
              <p className="text-xs text-red-600 mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={cancelDelete} className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDeleteTracker} className="px-3 py-1.5 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Column Prompt */}
      {showDeleteColumnPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">{showDeleteColumnPrompt.title}</h3>
              <button onClick={() => setShowDeleteColumnPrompt(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4 sm:h-5 sm:w-5"/>
              </button>
            </div>
            <div className="mb-4">
              {showDeleteColumnPrompt.type === 'warning' ? (
                <p className="text-xs sm:text-sm text-gray-600">{showDeleteColumnPrompt.message}</p>
              ) : (
                <>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Delete column <span className="font-medium">{showDeleteColumnPrompt.columnLabel}</span>?
                  </p>
                  <p className="text-xs text-red-600 mt-1">This action cannot be undone.</p>
                </>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setShowDeleteColumnPrompt(null)} 
                className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                {showDeleteColumnPrompt.type === 'warning' ? 'OK' : 'Cancel'}
              </button>
              {showDeleteColumnPrompt.type === 'delete' && (
                <button 
                  onClick={confirmDeleteColumn} 
                  className="px-3 py-1.5 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Form Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Upload Details</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">ID *</label>
                <input
                  type="text"
                  placeholder="Enter ID"
                  value={uploadForm.id}
                  onChange={(e) => {
                    setUploadForm({...uploadForm, id: e.target.value});
                    if (uploadFormErrors.id) setUploadFormErrors({...uploadFormErrors, id: ''});
                  }}
                  className={`w-full px-3 py-2 text-xs sm:text-sm border rounded ${
                    uploadFormErrors.id ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {uploadFormErrors.id && <p className="mt-1 text-xs text-red-600">{uploadFormErrors.id}</p>}
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  placeholder="Enter Name"
                  value={uploadForm.name}
                  onChange={(e) => {
                    setUploadForm({...uploadForm, name: e.target.value});
                    if (uploadFormErrors.name) setUploadFormErrors({...uploadFormErrors, name: ''});
                  }}
                  className={`w-full px-3 py-2 text-xs sm:text-sm border rounded ${
                    uploadFormErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {uploadFormErrors.name && <p className="mt-1 text-xs text-red-600">{uploadFormErrors.name}</p>}
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Department *</label>
                <input
                  type="text"
                  placeholder="Enter Department"
                  value={uploadForm.department}
                  onChange={(e) => {
                    setUploadForm({...uploadForm, department: e.target.value});
                    if (uploadFormErrors.department) setUploadFormErrors({...uploadFormErrors, department: ''});
                  }}
                  className={`w-full px-3 py-2 text-xs sm:text-sm border rounded ${
                    uploadFormErrors.department ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {uploadFormErrors.department && <p className="mt-1 text-xs text-red-600">{uploadFormErrors.department}</p>}
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">File *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleModalFileSelect}
                      accept=".csv,.xlsx,.xls,.json,.txt"
                    />
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">
                        {uploadForm.file ? uploadForm.file.name : 'Click to select file'}
                      </p>
                      <p className="text-xs text-gray-500">Supports: CSV, Excel, JSON, TXT (Max 50MB)</p>
                    </div>
                  </label>
                </div>
                {uploadFormErrors.file && <p className="mt-1 text-xs text-red-600">{uploadFormErrors.file}</p>}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button onClick={() => setShowUploadModal(false)} className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button onClick={handleUploadSubmit} className="px-3 py-1.5 text-xs sm:text-sm bg-black text-white rounded hover:bg-gray-800">Upload File</button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Viewer Modal */}
      {excelViewerData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-300 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FileSpreadsheet className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base">{excelViewerData.name}</h3>
                  <p className="text-xs text-gray-600">
                    {excelViewerData.type} • {excelViewerData.date} • Uploaded by {excelViewerData.uploadedBy}
                  </p>
                </div>
              </div>
              <button onClick={closeExcelViewer} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {excelHeaders.length > 0 ? (
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        {excelHeaders.map((header, colIndex) => (
                          <th 
                            key={colIndex} 
                            className="px-4 py-3 text-left font-medium text-gray-700 border-r border-gray-300 last:border-r-0"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {excelEditData.map((row, rowIndex) => (
                        <tr 
                          key={rowIndex} 
                          className="border-t border-gray-200 hover:bg-gray-50"
                        >
                          {excelHeaders.map((_, colIndex) => (
                            <td 
                              key={colIndex} 
                              className="px-4 py-3 border-r border-gray-200 last:border-r-0"
                            >
                              {row[colIndex] || ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                  <p className="text-gray-600">The uploaded file appears to be empty or could not be parsed.</p>
                </div>
              )}
            </div>

            <div className="p-3 sm:p-4 border-t border-gray-300 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="text-xs text-gray-600">
                Showing {excelEditData.length} rows, {excelHeaders.length} columns
              </div>
              <button onClick={closeExcelViewer} className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-100">Close</button>
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
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            
            {/* Add New Column Form */}
            <div className="mb-4 p-3 border border-gray-300 rounded">
              <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Add New Custom Column</h4>
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Column name (e.g., Status)"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  className="flex-grow px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded"
                />
                <button
                  onClick={handleAddColumn}
                  className="px-3 py-2 text-xs sm:text-sm bg-black text-white rounded hover:bg-gray-800 whitespace-nowrap"
                >
                  Add Column
                </button>
              </div>
            </div>

            {/* Existing Columns List */}
            <div className="mb-4">
              <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Available Columns</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableColumns.map((column) => {
                  const isFixedColumn = ['name', 'department', 'date', 'uploadedBy'].includes(column.id);
                  const isEditing = editingColumn === column.id;
                  
                  return (
                    <div key={column.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                      <div className="flex items-center space-x-2">
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={tempColumnName}
                              onChange={(e) => setTempColumnName(e.target.value)}
                              className="px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
                            />
                            <button
                              onClick={() => saveEditColumn(column.id)}
                              className="text-green-600 hover:text-green-800"
                              title="Save"
                            >
                              <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                            <button
                              onClick={cancelEditColumn}
                              className="text-red-600 hover:text-red-800"
                              title="Cancel"
                            >
                              <X className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="">{column.label}</span>
                            {column.required && (
                              <span className="">
                                {/* Required */}
                              </span>
                            )}
                            {isFixedColumn && (
                              <span className="">
                                {/* Fixed */}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Edit button for all columns */}
                        {!isEditing && (
                          <button
                            onClick={() => startEditColumn(column.id, column.label)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        )}
                        
                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteColumn(column.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowColumnModal(false)}
                className="px-3 py-1.5 text-xs sm:text-sm bg-black text-white rounded hover:bg-gray-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD AREA - Keep this separate as requested */}
      <div className="bg-white border border-gray-300 rounded p-4 sm:p-6">
        <div className="text-center">
          <div 
            className="border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-8 hover:border-gray-400 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={openUploadModal}
          >
            <div className="space-y-2 sm:space-y-3">
              <Upload className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto" />
              <div>
                <p className="font-medium text-sm sm:text-base">Drag & drop files or click to browse</p>
                <p className="text-xs text-gray-500">Supports: CSV, Excel, JSON, TXT (Max 50MB)</p>
              </div>
            </div>
          </div>

          {selectedFile && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <File className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                </div>
                <span className="text-xs text-gray-600">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
            </div>
          )}

          {uploading && (
            <div className="mt-4 sm:mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium">Uploading...</span>
                <span className="text-xs sm:text-sm text-gray-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                <div 
                  className="bg-blue-600 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MAIN BORDER CONTAINER - Everything wrapped in one box (UPDATED STRUCTURE) */}
      <div className="bg-white border border-gray-300 rounded mx-0">
        
        {/* TOOLBAR SECTION - Updated with Add Employee button and text filter */}
        <div className="p-4 border-b border-gray-300">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            
            {/* LEFT SIDE - Search, Add Employee, Add Column */}
            <div className="flex flex-1 flex-col sm:flex-row gap-2 sm:gap-2 items-start sm:items-center">
              {/* Search */}
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full sm:w-48 h-10 pl-9 pr-3 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Buttons - Close together */}
              <div className="flex gap-2">
                {/* Add Employee Button (1) */}
                <button
                  onClick={openUploadModal}
                  className="flex items-center gap-1 h-10 px-3 bg-black text-white rounded text-xs sm:text-sm hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4" />
                  Upload Trackers
                </button>

                <button 
                  onClick={() => setShowColumnModal(true)}
                  className="flex items-center gap-1 h-10 px-3 bg-black text-white rounded text-xs sm:text-sm hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4" />
                  Add Column
                </button>
              </div>
            </div>

            {/* RIGHT SIDE - Filter and Export */}
            <div className="flex gap-2 mt-2 sm:mt-0">
              {/* Department Filter as text input (2) */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter by department..."
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="h-10 pl-9 pr-3 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black w-full sm:w-48"
                />
                {departmentFilter && (
                  <button
                    onClick={() => setDepartmentFilter('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                )}
              </div>

              {/*Export Button with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="flex items-center gap-1 h-10 px-3 bg-black text-white rounded text-xs sm:text-sm hover:bg-gray-800"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
                
                {/* Export Dropdown */}
                {showExportDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowExportDropdown(false)}
                    />
                    <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-300 rounded shadow-lg z-50">
                      <button
                        onClick={() => handleExport('excel')}
                        className="block w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Export as Excel
                      </button>
                      <button
                        onClick={() => handleExport('csv')}
                        className="block w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Export as CSV
                      </button>
                      <button
                        onClick={() => handleExport('json')}
                        className="block w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Export as JSON
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TABLE SECTION - With department column (3) */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-100">
                {availableColumns.map(col => (
                  <th 
                    key={col.id} 
                    className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-200 whitespace-nowrap border-r border-gray-300 last:border-r-0" 
                    onClick={() => col.sortable && handleSort(col.id)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{col.label}</span>
                      {col.required && <span className="text-red-500">*</span>}
                      {col.sortable && getSortIcon(col.id)}
                    </div>
                  </th>
                ))}
                <th className="text-left py-3 px-4 font-medium text-gray-700 whitespace-nowrap border-r border-gray-300">Actions</th>
              </tr>
            </thead>
            
            <tbody>
              {sortedTrackers.map((tracker) => (
                <tr 
                  key={tracker.id} 
                  className="border-b border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  {editingId === tracker.id ? 
                    availableColumns.map(col => (
                      <td key={col.id} className="py-3 px-4 whitespace-nowrap border-r border-gray-300 last:border-r-0">
                        {renderInput(col, editForm[col.id], (f,v) => handleInputChange(f,v,true), validationErrors[col.id])}
                      </td>
                    )) : 
                    availableColumns.map(col => (
                      <td key={col.id} className="py-3 px-4 whitespace-nowrap border-r border-gray-300 last:border-r-0">
                        {renderCellContent(col, tracker[col.id], tracker)}
                      </td>
                    ))
                  }
                  <td className="py-3 px-4 whitespace-nowrap border-r border-gray-300">
                    {editingId === tracker.id ? (
                      <div className="flex items-center space-x-2">
                        <button onClick={saveEdit} className="p-1 text-green-600 hover:text-green-800">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={cancelEdit} className="p-1 text-red-600 hover:text-red-800">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button onClick={() => showExcelViewer(tracker)} className="p-1 text-blue-600 hover:text-blue-800">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => startEditing(tracker)} className="p-1 text-yellow-600 hover:text-yellow-800">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => showDeleteConfirmation(tracker.id, tracker.name)} className="p-1 text-red-600 hover:text-red-800">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER SECTION */}
        <div className="px-4 py-3 border-t border-gray-300 text-xs text-gray-600 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Showing {sortedTrackers.length} of {trackers.length} uploads
            {(departmentFilter || statusFilter !== "All Status") && 
              ` (Filtered${departmentFilter ? ` by Dept: ${departmentFilter}` : ''}${statusFilter !== "All Status" ? ` by Status: ${statusFilter}` : ''})`
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadTrackers;