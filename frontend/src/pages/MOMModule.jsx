import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import API from '../utils/api';

import SpeechToText from './SpeechToText';
import MeetingTable from './MeetingTable';
import MOMDashboard from '../components/MOMDashboard';

const MOMModule = () => {
  const [view, setView] = useState('projects'); // 'projects', 'meetings', 'mom'
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [projectMeetings, setProjectMeetings] = useState([]);
  const [allMeetings, setAllMeetings] = useState([]);
  const [momPoints, setMomPoints] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'table', 'speech'
  const [currentMeetingId, setCurrentMeetingId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [departmentModalMode, setDepartmentModalMode] = useState('add');
  const [departmentForm, setDepartmentForm] = useState({ name: '', manager: '' });
  const [activeDepartment, setActiveDepartment] = useState(null);
  const [departmentSaving, setDepartmentSaving] = useState(false);
  const [openDepartmentMenuId, setOpenDepartmentMenuId] = useState(null);

  // Notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch all projects on mount
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch projects
      const projectsResponse = await API.get('/projects/');
      const uniqueProjects = [];
      const seenNames = new Set();
      projectsResponse.data.forEach(project => {
        if (!seenNames.has(project.name)) {
          uniqueProjects.push(project);
          seenNames.add(project.name);
        }
      });
      setProjects(uniqueProjects);

      // Fetch all meetings for the "Recent" section
      const meetingsResponse = await API.get('/meetings/');
      setAllMeetings(meetingsResponse.data);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch meetings when a project is selected
  const fetchProjectMeetings = async (projectName) => {
    setLoading(true);
    try {
      // The API seems to support fetching by project name or id
      // Based on handleProjectClick, we use project.name
      const response = await API.get(`/meetings/project/${projectName}`);
      
      // Enrich meetings with their MOM points to calculate status
      const meetingsWithMoms = await Promise.all(response.data.map(async (meeting) => {
        try {
          const momResponse = await API.get(`/mom/list?meeting_id=${meeting.id}`);
          return { ...meeting, moms: momResponse.data };
        } catch (e) {
          return { ...meeting, moms: [] };
        }
      }));
      
      setProjectMeetings(meetingsWithMoms);
    } catch (error) {
      console.error('Error loading project meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch MOM points when a meeting is selected
  const fetchMOMPoints = async (meetingId) => {
    setLoading(true);
    try {
      const response = await API.get(`/mom/list?meeting_id=${meetingId}`);
      const mapped = response.data.map((item, index) => ({
        id: item.id,
        sno: index + 1,
        project_name: item.project_name || item.meeting_title,
        discussion_point: item.action_item,
        responsibility: item.owner,
        criticality: item.criticality,
        target: item.target_date ? item.target_date.split('T')[0] : '',
        function: item.function_dept,
        remainder: item.remainder,
        action_taken_approval: item.approval_status,
        attendees: item.attendees,
        status: item.status,
        nature_of_point: item.nature_of_point,
        created_at: item.created_at
      }));
      setMomPoints(mapped);
    } catch (error) {
      console.error('Error loading MOM points:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    fetchProjectMeetings(project.name);
    setView('meetings');
  };

  const handleMeetingClick = (meeting) => {
    setSelectedMeeting(meeting);
    setCurrentMeetingId(meeting.id);
    
    // Find and set project if not already set
    if (!selectedProject && meeting.project_id) {
        const project = projects.find(p => p.id === meeting.project_id);
        if (project) setSelectedProject(project);
    }
    
    fetchMOMPoints(meeting.id);
    setView('mom');
  };

  const handleBack = () => {
    if (view === 'mom') {
      setView('meetings');
      setSelectedMeeting(null);
      setCurrentMeetingId(null);
    } else if (view === 'meetings') {
      setView('projects');
      setSelectedProject(null);
      setProjectMeetings([]);
    }
  };

  const handleStartMeeting = async (meetingData) => {
    try {
      const payload = {
        title: meetingData.meeting_title || 'Untitled Meeting',
        project_id: selectedProject?.id || null,
        project_name: selectedProject?.name || meetingData.project_name || null,
        meeting_type: meetingData.meeting_type || 'General',
        meeting_date: new Date().toISOString()
      };
      
      console.log("Starting meeting with payload:", payload);
      const response = await API.post('/meetings/', payload);
      if (response.data && response.data.data && response.data.data.id) {
        const newMeeting = response.data.data;
        setCurrentMeetingId(newMeeting.id);
        setSelectedMeeting(newMeeting);
        setMomPoints([]); // Clear points for the new meeting
        
        // Update meetings list if we are in the meetings view
        if (view === 'meetings') {
            setProjectMeetings(prev => [newMeeting, ...prev]);
        }
        
        setView('mom');
        setActiveTab('speech');
        showNotification('Meeting started successfully');
        console.log("Meeting started with ID:", newMeeting.id);
        
        // Refresh meetings lists
        fetchInitialData();
      } else {
        showNotification('Failed to create meeting', 'error');
      }
    } catch (error) {
      console.error("Error starting meeting:", error);
      showNotification('Error starting meeting', 'error');
    }
  };

  const handleStopMeeting = async (data) => {
    if (currentMeetingId && data.transcript) {
      try {
        await API.put(`/meetings/${currentMeetingId}`, { 
          transcript: data.transcript 
        });
        console.log("Transcript saved to meeting record");
      } catch (error) {
        console.error("Error saving transcript to meeting:", error);
      }
    }
  };

  const handleProcessSpeech = async (points) => {
    try {
      setLoading(true);
      for (const point of points) {
        const payload = {
          meeting_id: currentMeetingId,
          meeting_title: selectedMeeting?.title || 'Untitled',
          action_item: point.discussion_point || '',
          owner: point.responsibility || '',
          criticality: point.criticality || 'medium',
          target_date: point.target ? new Date(point.target).toISOString() : null,
          function_dept: point.function || 'engineering',
          remainder: point.remainder || 'none',
          approval_status: point.action_taken_approval || 'pending-approval',
          attendees: point.attendees || '',
          status: point.status || 'pending',
          nature_of_point: point.nature_of_point || 'discussion'
        };
        await API.post('/mom/create', payload);
      }
      if (currentMeetingId) await fetchMOMPoints(currentMeetingId);
      setActiveTab('table');
      showNotification('MOM points saved successfully');
    } catch (error) {
      console.error("Error saving speech points", error);
      const errorMessage = error.response?.data?.detail || "Error saving speech points";
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentMeetingCount = (projectId) => {
    return allMeetings.filter(meeting => meeting.project_id === projectId).length;
  };

  const handleDepartmentSubmit = async () => {
    if (!departmentForm.name.trim() || !departmentForm.manager.trim()) {
      showNotification('Please fill in department name and manager', 'error');
      return;
    }

    try {
      setDepartmentSaving(true);
      const payload = {
        name: departmentForm.name.trim(),
        manager: departmentForm.manager.trim(),
        status: activeDepartment?.status || 'Planning',
        budget: activeDepartment?.budget ?? 0,
        timeline: activeDepartment?.timeline ?? null
      };

      if (departmentModalMode === 'add') {
        await API.post('/projects/', payload);
      } else if (activeDepartment) {
        await API.put(`/projects/${activeDepartment.id}`, payload);
      }

      await fetchInitialData();
      setDepartmentModalOpen(false);
      setActiveDepartment(null);
      setDepartmentForm({ name: '', manager: '' });
      showNotification(
        departmentModalMode === 'add'
          ? 'Department created successfully'
          : 'Department updated successfully'
      );
    } catch (error) {
      console.error('Error saving department:', error);
      showNotification('Error saving department', 'error');
    } finally {
      setDepartmentSaving(false);
    }
  };

  const handleDeleteDepartment = async (project) => {
    const count = getDepartmentMeetingCount(project.id);
    if (count > 0) {
      showNotification('Cannot delete department with existing meetings', 'error');
      return;
    }

    const confirmed = window.confirm(
      `Delete department "${project.name}"? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await API.delete(`/projects/${project.id}`);
      await fetchInitialData();
      showNotification('Department deleted successfully');
    } catch (error) {
      console.error('Error deleting department:', error);
      showNotification('Error deleting department', 'error');
    }
  };

  const handleUpdateMeeting = async (id, data) => {
    try {
      const payload = {
        meeting_title: data.project_name,
        action_item: data.discussion_point,
        owner: data.responsibility,
        criticality: data.criticality,
        target_date: data.target ? new Date(data.target).toISOString() : null,
        function_dept: data.function,
        remainder: data.remainder,
        approval_status: data.action_taken_approval,
        attendees: data.attendees,
        status: data.status,
        nature_of_point: data.nature_of_point
      };
      await API.put(`/mom/update/${id}`, payload);
      if (currentMeetingId) fetchMOMPoints(currentMeetingId);
    } catch (error) {
      console.error("Error updating meeting", error);
    }
  };

  const handleDeleteMeeting = async (id) => {
    try {
      await API.delete(`/mom/delete/${id}`);
      if (currentMeetingId) fetchMOMPoints(currentMeetingId);
    } catch (error) {
      console.error("Error deleting meeting", error);
    }
  };

  const handleAddMeeting = async (data = null) => {
    const newMeetingPayload = {
        meeting_id: currentMeetingId,
        meeting_title: selectedMeeting?.title || '',
        action_item: data?.discussion_point || '',
        owner: data?.responsibility || '',
        criticality: data?.criticality || 'medium',
        target_date: data?.target ? new Date(data.target).toISOString() : new Date().toISOString(),
        function_dept: data?.function || 'engineering',
        remainder: data?.remainder || 'none',
        approval_status: data?.action_taken_approval || 'pending-approval',
        attendees: data?.attendees || '',
        status: data?.status || 'pending',
        nature_of_point: data?.nature_of_point || 'discussion'
    };
    
    try {
      await API.post('/mom/create', newMeetingPayload);
      if (currentMeetingId) fetchMOMPoints(currentMeetingId);
    } catch (error) {
      console.error("Error creating meeting", error);
    }
  };

  const countUniqueAttendees = () => {
    const allAttendees = [];
    momPoints.forEach(point => {
      const attendees = point.attendees || '';
      if (attendees) {
        const attendeeList = attendees.split(/[,;]| and /).map(a => a.trim()).filter(a => a);
        allAttendees.push(...attendeeList);
      }
    });
    return [...new Set(allAttendees)].length;
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <Icons.LayoutDashboard className="h-4 w-4" /> },
    { id: 'table', label: 'Meeting Table', icon: <Icons.FileText className="h-4 w-4" /> },
    { id: 'speech', label: 'Speech to Text', icon: <Icons.Mic className="h-4 w-4" /> },
  ];

  if (loading && view === 'projects') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-sm text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border animate-in fade-in slide-in-from-top-4 duration-300 ${
          notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'error' ? <Icons.AlertCircle className="h-5 w-5" /> : <Icons.CheckCircle2 className="h-5 w-5" />}
            <p className="font-medium">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Breadcrumbs & Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
        <button 
          onClick={() => { setView('projects'); setSelectedProject(null); setSelectedMeeting(null); }}
          className="hover:text-black font-medium transition-colors"
        >
          MOM
        </button>
        {selectedProject && (
          <>
            <Icons.ChevronRight className="h-4 w-4 text-gray-400" />
            <button 
              onClick={() => { setView('meetings'); setSelectedMeeting(null); }}
              className="hover:text-black font-medium transition-colors"
            >
              {selectedProject.name}
            </button>
          </>
        )}
        {selectedMeeting && (
          <>
            <Icons.ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="text-black font-semibold">{selectedMeeting.title}</span>
          </>
        )}
        <div className="flex-1"></div>
        {view !== 'projects' && (
          <button 
            onClick={handleBack}
            className="flex items-center space-x-1 text-gray-500 hover:text-black transition-colors px-2 py-1 hover:bg-gray-100 rounded"
          >
            <Icons.ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
        )}
      </div>

      {/* View: Projects (Folders) - MOM Dashboard */}
      {view === 'projects' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">MOM Dashboard</h2>
            <button
              onClick={() => {
                setDepartmentModalMode('add');
                setActiveDepartment(null);
                setDepartmentForm({ name: '', manager: '' });
                setDepartmentModalOpen(true);
              }}
              className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center space-x-2 shadow-sm"
            >
              <Icons.Plus className="h-4 w-4" />
              <span>Add Department</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => handleProjectClick(project)}
                className="relative flex flex-col items-center p-6 bg-white border border-gray-200 rounded-xl hover:border-black hover:shadow-lg transition-all group"
              >
                <div className="flex w-full items-start justify-between mb-3">
                  <Icons.Folder className="h-14 w-14 text-yellow-500 group-hover:text-yellow-600 transition-transform group-hover:scale-110" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDepartmentMenuId(
                        openDepartmentMenuId === project.id ? null : project.id
                      );
                    }}
                    className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <Icons.MoreVertical className="h-4 w-4" />
                  </button>
                </div>
                <div className="w-full text-left">
                  <div className="text-sm font-semibold text-gray-800 line-clamp-2">
                    {project.name}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {getDepartmentMeetingCount(project.id)} meetings
                  </div>
                  {project.manager && (
                    <div className="mt-1 text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                      {project.manager}
                    </div>
                  )}
                </div>
                {openDepartmentMenuId === project.id && (
                  <div className="absolute top-3 right-3 z-10 w-44 bg-white border border-gray-200 rounded-md shadow-lg py-1 text-sm">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDepartmentModalMode('edit');
                        setActiveDepartment(project);
                        setDepartmentForm({
                          name: project.name || '',
                          manager: project.manager || ''
                        });
                        setDepartmentModalOpen(true);
                        setOpenDepartmentMenuId(null);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50"
                    >
                      Edit Department
                    </button>
                    {getDepartmentMeetingCount(project.id) === 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDepartment(project);
                          setOpenDepartmentMenuId(null);
                        }}
                        className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50"
                      >
                        Delete Department
                      </button>
                    )}
                  </div>
                )}
              </button>
            ))}
            {projects.length === 0 && (
              <div className="col-span-full py-16 text-center text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <Icons.FolderPlus className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-lg font-medium">No departments found</p>
                <p className="text-sm">
                  Please create a department in the Project Master module or add one above.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View: Meetings List - Project View */}
      {view === 'meetings' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">{selectedProject?.name}</h2>
            <button 
               onClick={() => {
                 const title = prompt("Enter meeting title:");
                 if (title) handleStartMeeting({ meeting_title: title });
               }}
               className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center space-x-2 shadow-sm"
            >
              <Icons.Plus className="h-4 w-4" />
              <span>+ Create Meeting</span>
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Meeting Title</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {projectMeetings.map(meeting => {
                    const isCompleted = meeting.moms && meeting.moms.length > 0 && meeting.moms.every(mom => mom.status === 'completed');
                    const statusLabel = isCompleted ? 'Completed' : 'In Progress';
                    const statusColor = isCompleted ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700';

                    return (
                      <tr 
                        key={meeting.id}
                        onClick={() => handleMeetingClick(meeting)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-white transition-colors">
                              <Icons.Video className="h-5 w-5 text-gray-600" />
                            </div>
                            <span className="font-medium text-gray-900 group-hover:text-black">{meeting.title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(meeting.meeting_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Icons.ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-600" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {projectMeetings.length === 0 && (
              <div className="p-16 text-center text-gray-500">
                <Icons.Inbox className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-lg font-medium">No meetings recorded</p>
                <p className="text-sm">Start by creating a new meeting for this department.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View: MOM Points (Table/Speech) */}
      {view === 'mom' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Stats for the meeting */}
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-white border border-gray-300 rounded p-3 sm:p-4 flex items-center">
              <div className="bg-gray-100 p-1.5 sm:p-2 rounded mr-2 sm:mr-3">
                <Icons.FileText className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Total Points</p>
                <p className="text-sm sm:text-base font-bold text-gray-900">{momPoints.length}</p>
              </div>
            </div>
            <div className="bg-white border border-gray-300 rounded p-3 sm:p-4 flex items-center">
              <div className="bg-green-100 p-1.5 sm:p-2 rounded mr-2 sm:mr-3">
                <Icons.Users className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500"> Attendees</p>
                <p className="text-sm sm:text-base font-bold text-green-600">
                  {countUniqueAttendees()}
                </p>
              </div>
            </div>
            <div className="bg-white border border-gray-300 rounded p-3 sm:p-4 flex items-center">
              <div className="bg-red-100 p-1.5 sm:p-2 rounded mr-2 sm:mr-3">
                <Icons.AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">High Priority</p>
                <p className="text-sm sm:text-base font-bold text-red-600">
                  {momPoints.filter(m => m.criticality === 'high').length}
                </p>
              </div>
            </div>
            <div className="bg-white border border-gray-300 rounded p-3 sm:p-4 flex items-center">
              <div className="bg-yellow-100 p-1.5 sm:p-2 rounded mr-2 sm:mr-3">
                <Icons.Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Pending Actions</p>
                <p className="text-sm sm:text-base font-bold text-yellow-600">
                  {momPoints.filter(m => m.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-300 rounded">
            <div className="flex border-b border-gray-300">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1 px-4 py-3 text-xs sm:text-sm transition-colors border-b-2 -mb-px ${
                    activeTab === tab.id
                      ? 'text-black border-black bg-gray-50 font-semibold'
                      : 'text-gray-500 hover:text-gray-900 border-transparent hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
            
            <div className="p-3 sm:p-4">
              {activeTab === 'dashboard' && (
                <MOMDashboard 
                  momPoints={momPoints} 
                  selectedMeeting={{
                    ...selectedMeeting,
                    project_name: selectedProject?.name
                  }} 
                />
              )}

              {activeTab === 'speech' && (
                <SpeechToText 
                  onProcessSpeech={handleProcessSpeech} 
                  meetings={momPoints} 
                  onStartMeeting={handleStartMeeting}
                  onStopMeeting={handleStopMeeting}
                  meetingId={currentMeetingId}
                  initialProjectName={selectedProject?.name || ''}
                />
              )}

              {activeTab === 'table' && (
                <MeetingTable 
                  meetings={momPoints}
                  onUpdateMeeting={handleUpdateMeeting}
                  onDeleteMeeting={handleDeleteMeeting}
                  onAddMeeting={handleAddMeeting}
                />
              )}
            </div>
          </div>
        </div>
      )}
      {departmentModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {departmentModalMode === 'add' ? 'Add Department' : 'Edit Department'}
              </h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                onClick={() => {
                  if (!departmentSaving) {
                    setDepartmentModalOpen(false);
                    setActiveDepartment(null);
                    setDepartmentForm({ name: '', manager: '' });
                  }
                }}
              >
                <Icons.X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name
                </label>
                <input
                  type="text"
                  value={departmentForm.name}
                  onChange={(e) =>
                    setDepartmentForm({ ...departmentForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/80"
                  placeholder="Enter department name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Manager
                </label>
                <input
                  type="text"
                  value={departmentForm.manager}
                  onChange={(e) =>
                    setDepartmentForm({ ...departmentForm, manager: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/80"
                  placeholder="Enter manager name"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  if (!departmentSaving) {
                    setDepartmentModalOpen(false);
                    setActiveDepartment(null);
                    setDepartmentForm({ name: '', manager: '' });
                  }
                }}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDepartmentSubmit}
                disabled={
                  departmentSaving ||
                  !departmentForm.name.trim() ||
                  !departmentForm.manager.trim()
                }
                className="px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {departmentModalMode === 'add' ? 'Create Department' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MOMModule;
