import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import * as Icons from 'lucide-react';

const MOMDashboard = ({ momPoints, selectedMeeting }) => {
  // Process data for Timeline / Gantt Chart
  // We'll show action items with their target dates
  const timelineData = useMemo(() => {
    if (!momPoints) return [];
    return momPoints
      .filter(point => point.target && point.discussion_point)
      .map(point => ({
        name: point.discussion_point.length > 30 ? point.discussion_point.substring(0, 30) + '...' : point.discussion_point,
        fullName: point.discussion_point,
        days: Math.max(0, Math.ceil((new Date(point.target) - new Date()) / (1000 * 60 * 60 * 24))),
        targetDate: point.target,
        criticality: point.criticality,
        owner: point.responsibility
      }))
      .sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate))
      .slice(0, 10); // Limit to top 10 for readability
  }, [momPoints]);

  // Process data for Criticality Heatmap / Distribution
  const criticalityData = useMemo(() => {
    if (!momPoints) return [];
    const counts = {
      high: { name: 'High', value: 0, color: '#ef4444' },
      medium: { name: 'Medium', value: 0, color: '#f59e0b' },
      low: { name: 'Low', value: 0, color: '#10b981' }
    };

    momPoints.forEach(point => {
      const crit = (point.criticality || 'medium').toLowerCase();
      if (counts[crit]) {
        counts[crit].value++;
      }
    });

    return Object.values(counts).filter(c => c.value > 0);
  }, [momPoints]);

  // Status distribution for more insights
  const statusData = useMemo(() => {
    if (!momPoints) return [];
    const counts = {};
    momPoints.forEach(point => {
      const status = point.status || 'Pending';
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [momPoints]);

  const getCriticalityColor = (crit) => {
    switch (crit?.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#101bb9';
      default: return '#94a3b8';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Meeting Summary Card */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-300 px-4 py-3 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 flex items-center">
            <Icons.FileText className="h-5 w-5 mr-2 text-blue-600" />
            Meeting Summary
          </h3>
          <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
            {new Date(selectedMeeting?.meeting_date).toLocaleDateString()}
          </span>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">{selectedMeeting?.title}</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                {selectedMeeting?.transcript ? (
                  selectedMeeting.transcript.length > 500 
                    ? selectedMeeting.transcript.substring(0, 500) + '...' 
                    : selectedMeeting.transcript
                ) : (
                  "No detailed summary available for this meeting. Use the 'Speech to Text' feature to record and generate a summary."
                )}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Details</h5>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Icons.User className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-500 mr-2">Type:</span>
                  <span className="font-medium text-gray-900">{selectedMeeting?.meeting_type || 'General'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Icons.MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-500 mr-2">Department:</span>
                  <span className="font-medium text-gray-900">{selectedMeeting?.project_name || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Icons.CheckSquare className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-500 mr-2">Action Items:</span>
                  <span className="font-medium text-gray-900">{momPoints.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline / Gantt Chart */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 flex items-center">
              <Icons.Calendar className="h-5 w-5 mr-2 text-indigo-600" />
              Action Item Deadlines (Timeline)
            </h3>
            <span className="text-[10px] text-gray-400">Days to target</span>
          </div>
          <div className="flex-1 min-h-0">
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={timelineData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    fontSize={10}
                    tick={{ fill: '#4b5563' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border border-gray-200 p-3 shadow-lg rounded-md text-xs">
                            <p className="font-bold mb-1">{data.fullName}</p>
                            <p><span className="text-gray-500">Target:</span> {data.targetDate}</p>
                            <p><span className="text-gray-500">Days Remaining:</span> {data.days}</p>
                            <p><span className="text-gray-500">Owner:</span> {data.owner}</p>
                            <div className="mt-2 flex items-center">
                              <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: getCriticalityColor(data.criticality) }}></span>
                              <span className="capitalize">{data.criticality} Priority</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="days" radius={[0, 4, 4, 0]} barSize={20}>
                    {timelineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getCriticalityColor(entry.criticality)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm italic">
                No action items with target dates to display.
              </div>
            )}
          </div>
        </div>

        {/* Summary Heatmap / Criticality Distribution */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 flex items-center">
              <Icons.Activity className="h-5 w-5 mr-2 text-red-600" />
              Criticality Summary
            </h3>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            {criticalityData.length > 0 ? (
              <>
                <div className="w-full h-2/3">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={criticalityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {criticalityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full mt-4 grid grid-cols-3 gap-2">
                  {criticalityData.map((item) => (
                    <div key={item.name} className="text-center p-2 rounded bg-gray-50 border border-gray-100">
                      <p className="text-[10px] text-gray-500 uppercase font-bold">{item.name}</p>
                      <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-sm italic">
                No data available for criticality summary.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Discussion Points Heatmap (Simplified as a grid of labels) */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center">
          <Icons.LayoutGrid className="h-5 w-5 mr-2 text-green-600" />
          Point Criticality Heatmap
        </h3>
        <div className="flex flex-wrap gap-2">
          {momPoints.map((point, index) => (
            <div 
              key={index}
              className={`px-3 py-1.5 rounded text-[10px] font-medium border transition-all hover:scale-105 cursor-default
                ${point.criticality === 'high' ? 'bg-red-50 border-red-200 text-red-700 shadow-sm shadow-red-100' : 
                  point.criticality === 'medium' ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm shadow-amber-100' : 
                  'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm shadow-emerald-100'}
              `}
              title={`${point.criticality.toUpperCase()}: ${point.discussion_point}`}
            >
              <div className="flex items-center space-x-1">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  point.criticality === 'high' ? 'bg-red-500' : 
                  point.criticality === 'medium' ? 'bg-amber-500' : 
                  'bg-emerald-500'
                }`}></span>
                <span className="truncate max-w-[120px]">{point.discussion_point}</span>
              </div>
            </div>
          ))}
          {momPoints.length === 0 && (
            <div className="w-full text-center py-8 text-gray-400 text-sm italic">
              No points available to display in heatmap.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MOMDashboard;
