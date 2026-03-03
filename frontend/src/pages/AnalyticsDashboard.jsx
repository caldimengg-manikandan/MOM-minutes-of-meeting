import React, { useState, useMemo } from 'react';
import * as Icons from 'lucide-react';

const Analytics = ({ meetings }) => {
  const [timeRange, setTimeRange] = useState('all');
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' or 'events'

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    const filteredMeetings = meetings.filter(meeting => {
      if (timeRange === 'all') return true;
      const meetingDate = new Date(meeting.created_at || new Date());
      const now = new Date();
      const daysAgo = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
      const cutoffDate = new Date(now.setDate(now.getDate() - daysAgo));
      return meetingDate >= cutoffDate;
    });

    // Basic statistics
    const stats = {
      total: filteredMeetings.length,
      completed: filteredMeetings.filter(m => m.status === 'completed').length,
      inProgress: filteredMeetings.filter(m => m.status === 'in_progress').length,
      pending: filteredMeetings.filter(m => m.status === 'pending').length,
      critical: filteredMeetings.filter(m => m.criticality === 'critical' || m.criticality === '1').length,
      high: filteredMeetings.filter(m => m.criticality === 'high' || m.criticality === '2').length,
      medium: filteredMeetings.filter(m => m.criticality === 'medium' || m.criticality === '3').length,
      low: filteredMeetings.filter(m => m.criticality === 'low' || m.criticality === '4').length,
    };

    // Calculate rates
    stats.completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    stats.highPriorityRate = stats.total > 0 ? Math.round(((stats.critical + stats.high) / stats.total) * 100) : 0;
    stats.pendingRate = stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0;

    // Top attendees (instead of speakers)
    const attendeeCount = {};
    filteredMeetings.forEach(meeting => {
      const attendees = meeting.attendees || meeting.speaker || 'Unknown';
      const attendeeList = attendees.split(/[,;]| and /).map(a => a.trim()).filter(a => a);
      
      if (attendeeList.length > 0) {
        attendeeList.forEach(attendee => {
          attendeeCount[attendee] = (attendeeCount[attendee] || 0) + 1;
        });
      } else {
        attendeeCount[attendees] = (attendeeCount[attendees] || 0) + 1;
      }
    });
    
    const topAttendees = Object.entries(attendeeCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top projects
    const projectCount = {};
    filteredMeetings.forEach(meeting => {
      const project = meeting.project_name || meeting.project || 'Unnamed';
      projectCount[project] = (projectCount[project] || 0) + 1;
    });
    const topProjects = Object.entries(projectCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Overdue tasks
    const overdueTasks = filteredMeetings
      .filter(meeting => {
        if (!meeting.target || meeting.status === 'completed') return false;
        const targetDate = new Date(meeting.target);
        const today = new Date();
        return targetDate < today;
      })
      .slice(0, 5);

    // Recent meetings
    const recentMeetings = [...filteredMeetings]
      .sort((a, b) => new Date(b.created_at || new Date()) - new Date(a.created_at || new Date()))
      .slice(0, 5);

    // Status distribution
    const statusDistribution = [
      { name: 'Completed', value: stats.completed, color: 'bg-green-500' },
      { name: 'In Progress', value: stats.inProgress, color: 'bg-blue-500' },
      { name: 'Pending', value: stats.pending, color: 'bg-yellow-500' }
    ];

    // Criticality distribution
    const criticalityDistribution = [
      { name: 'Critical', value: stats.critical, color: 'bg-red-500' },
      { name: 'High', value: stats.high, color: 'bg-orange-500' },
      { name: 'Medium', value: stats.medium, color: 'bg-yellow-500' },
      { name: 'Low', value: stats.low, color: 'bg-green-500' }
    ];

    // Extract unique meeting types
    const meetingTypes = {};
    filteredMeetings.forEach(meeting => {
      const type = meeting.meeting_type || meeting.type || 'General';
      meetingTypes[type] = (meetingTypes[type] || 0) + 1;
    });

    // Group meetings by year and month for summary table
    const meetingsByMonth = {};
    filteredMeetings.forEach(meeting => {
      const date = new Date(meeting.created_at || meeting.date || new Date());
      const year = date.getFullYear();
      const month = date.toLocaleString('default', { month: 'short' });
      const yearMonth = `${year}-${month}`;
      
      if (!meetingsByMonth[yearMonth]) {
        meetingsByMonth[yearMonth] = {
          year,
          month,
          total: 0,
          types: {}
        };
      }
      
      meetingsByMonth[yearMonth].total += 1;
      
      const type = meeting.meeting_type || meeting.type || 'General';
      meetingsByMonth[yearMonth].types[type] = (meetingsByMonth[yearMonth].types[type] || 0) + 1;
    });

    // Get all unique meeting types across all meetings
    const allMeetingTypes = Array.from(new Set(filteredMeetings.map(m => m.meeting_type || m.type || 'General')));

    // Convert to array and sort by year and month
    const monthlySummary = Object.values(meetingsByMonth)
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.indexOf(b.month) - months.indexOf(a.month);
      });

    // Upcoming meetings (events)
    const upcomingMeetings = [...filteredMeetings]
      .filter(meeting => {
        const meetingDate = new Date(meeting.meeting_date || meeting.date || meeting.created_at);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return meetingDate >= today;
      })
      .sort((a, b) => new Date(a.meeting_date || a.date || a.created_at) - new Date(b.meeting_date || b.date || b.created_at))
      .slice(0, 10);

    return {
      stats,
      topAttendees,
      topProjects,
      overdueTasks,
      recentMeetings,
      statusDistribution,
      criticalityDistribution,
      monthlySummary,
      allMeetingTypes,
      upcomingMeetings
    };
  }, [meetings, timeRange]);

  // Export data
  const exportData = () => {
    const data = {
      analytics,
      timestamp: new Date().toISOString(),
      totalMeetings: meetings.length
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `mom-analytics-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Meeting Analytics </h2>
        
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'summary' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Summary Table
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'events' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Meeting Events
            </button>
          </div>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded"
          >
            <option value="all">All Time</option>
            <option value="month">Last 30 Days</option>
            <option value="week">Last 7 Days</option>
          </select>
          
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            <Icons.Download className="h-4 w-4" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

     
      {/* Main Content Based on Active Tab */}
      {activeTab === 'summary' ? (
        <div className="space-y-6">
          {/* Monthly Summary Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">Meeting Summary by Month</h3>
                  <p className="text-sm text-gray-600">Scrollable table with monthly breakdown</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {analytics.monthlySummary.length} months
                </span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                      Year
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Month
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Meetings
                    </th>
                    {analytics.allMeetingTypes.map((type, index) => (
                      <th key={index} className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                        {type}
                      </th>
                    ))}
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Custom Types
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analytics.monthlySummary.map((monthData, index) => (
                    <tr key={`${monthData.year}-${monthData.month}`} className="hover:bg-gray-50">
                      <td className="py-4 px-4 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                        {monthData.year}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">
                        {monthData.month}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <span className="text-sm font-bold text-blue-600">{monthData.total}</span>
                        </div>
                      </td>
                      {analytics.allMeetingTypes.map((type, typeIndex) => (
                        <td key={typeIndex} className="py-4 px-4">
                          <div className="text-sm text-gray-700">
                            {monthData.types[type] || 0}
                          </div>
                        </td>
                      ))}
                      <td className="py-4 px-4">
                        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                          <Icons.Plus className="h-3 w-3" />
                          Add Custom
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {analytics.monthlySummary.length === 0 && (
                    <tr>
                      <td colSpan={4 + analytics.allMeetingTypes.length} className="py-8 text-center text-gray-500">
                        <Icons.Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No meeting data available for selected time range</p>
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="py-3 px-4 text-sm font-bold text-gray-900 sticky left-0 bg-gray-50">
                      Total
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-gray-900">
                      -
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-bold text-blue-600">{analytics.stats.total}</span>
                    </td>
                    {analytics.allMeetingTypes.map((type, index) => {
                      const totalForType = analytics.monthlySummary.reduce((sum, month) => 
                        sum + (month.types[type] || 0), 0
                      );
                      return (
                        <td key={index} className="py-3 px-4">
                          <span className="text-sm font-bold text-gray-900">{totalForType}</span>
                        </td>
                      );
                    })}
                    <td className="py-3 px-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Distribution Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Status Distribution */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Status Distribution</h3>
                <span className="text-sm text-gray-600">{analytics.stats.total} total</span>
              </div>
              
              <div className="space-y-4">
                {analytics.statusDistribution.map((status, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{status.name}</span>
                      <span className="text-sm font-medium">{status.value} ({analytics.stats.total > 0 ? Math.round((status.value / analytics.stats.total) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${status.color}`}
                        style={{ width: `${analytics.stats.total > 0 ? (status.value / analytics.stats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Criticality Distribution */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Priority Analysis</h3>
                <span className="text-sm text-gray-600">Criticality levels</span>
              </div>
              
              <div className="space-y-4">
                {analytics.criticalityDistribution.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                        <span className="text-sm font-medium text-gray-700">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">{item.value}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${analytics.stats.total > 0 ? (item.value / analytics.stats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Meeting Events Section */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">Upcoming Meeting Events</h3>
                  <p className="text-sm text-gray-600">Scheduled meetings and their purposes</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {analytics.upcomingMeetings.length} upcoming
                </span>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {analytics.upcomingMeetings.map((meeting, index) => {
                const meetingDate = new Date(meeting.meeting_date || meeting.date || meeting.created_at);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const daysUntil = Math.floor((meetingDate - today) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={meeting.id || index} className="p-4 hover:bg-gray-50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Icons.Calendar className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{meeting.project_name || meeting.project || 'Meeting'}</h4>
                            <p className="text-sm text-gray-600">{meeting.discussion_point || meeting.point || 'No description'}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Icons.Clock className="h-4 w-4" />
                            <span>Date: {meetingDate.toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <Icons.Users className="h-4 w-4" />
                            <span>Attendees: {meeting.attendees || meeting.speaker || 'TBD'}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <Icons.Target className="h-4 w-4" />
                            <span>Purpose: {meeting.purpose || meeting.type || 'General Discussion'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          daysUntil === 0 ? 'bg-orange-100 text-orange-800' :
                          daysUntil < 3 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {daysUntil === 0 ? 'Today' : 
                           daysUntil === 1 ? 'Tomorrow' : 
                           daysUntil < 0 ? 'Past Due' : 
                           `In ${daysUntil} days`}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            meeting.criticality === 'critical' || meeting.criticality === '1' ? 'bg-red-100 text-red-800' :
                            meeting.criticality === 'high' || meeting.criticality === '2' ? 'bg-orange-100 text-orange-800' :
                            meeting.criticality === 'medium' || meeting.criticality === '3' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {meeting.criticality || 'Normal'}
                          </span>
                          
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            meeting.status === 'completed' ? 'bg-green-100 text-green-800' :
                            meeting.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {meeting.status || 'scheduled'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {analytics.upcomingMeetings.length === 0 && (
                <div className="py-12 text-center">
                  <Icons.Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <h4 className="text-lg font-bold text-gray-600 mb-2">No Upcoming Meetings</h4>
                  <p className="text-sm text-gray-500">No scheduled meetings in the selected time range</p>
                </div>
              )}
            </div>
          </div>

          {/* Additional Events Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Meetings */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Recent Meetings</h3>
                <Icons.History className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="space-y-3">
                {analytics.recentMeetings.slice(0, 5).map(meeting => (
                  <div key={meeting.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{meeting.project_name || meeting.project}</h4>
                      <span className="text-xs text-gray-500">
                        {new Date(meeting.created_at || new Date()).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{meeting.discussion_point || meeting.point}</p>
                  </div>
                ))}
                
                {analytics.recentMeetings.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <Icons.History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent meetings</p>
                  </div>
                )}
              </div>
            </div>

            {/* Overdue Tasks */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Overdue Actions</h3>
                {analytics.overdueTasks.length > 0 && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    {analytics.overdueTasks.length} overdue
                  </span>
                )}
              </div>
              
              <div className="space-y-3">
                {analytics.overdueTasks.map((meeting, index) => (
                  <div key={index} className="p-3 bg-red-50 border border-red-100 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-medium text-red-900">{meeting.project_name || meeting.project}</h4>
                      <span className="text-xs text-red-700 font-medium">
                        Overdue
                      </span>
                    </div>
                    <p className="text-sm text-red-700 truncate">{meeting.discussion_point || meeting.point}</p>
                    <div className="mt-2 text-xs text-red-600">
                      Due: {new Date(meeting.target).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                
                {analytics.overdueTasks.length === 0 && (
                  <div className="text-center py-6 text-green-500">
                    <Icons.CheckCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>All tasks on schedule!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Footer */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Analytics Summary</h3>
            <p className="text-sm text-gray-600 mt-1">
              Based on {meetings.length} meeting minutes • Generated on {new Date().toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{analytics.stats.completionRate}%</div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{analytics.stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{analytics.stats.critical + analytics.stats.high}</div>
              <div className="text-sm text-gray-600">High Priority</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;