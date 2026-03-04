import React, { useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import axios from 'axios';
import API from '../utils/api';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import {
  Volume2,
  Play,
  Square,
  Trash2,
  FileText,
  MicOff,
  Mic,
  Calendar,
  Clock,
  Users,
  Loader2,
  MessageCircle,
  MessageSquare,
  X,
  Layers,
  Download,
  ChevronDown,
  CheckCircle2,
  ListTodo,
} from 'lucide-react';

const SpeechToText = ({ onProcessSpeech, meetings = [], onStartMeeting, onStopMeeting, onClearMeeting, meetingId, initialProjectName = '' }) => {
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState('en');
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  
  // Meeting Information States
  const [meetingTitle, setMeetingTitle] = useState('');
  const [projectName, setProjectName] = useState(initialProjectName);
  const [meetingType, setMeetingType] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [meetingTime, setMeetingTime] = useState(new Date().toTimeString().slice(0, 5));
  const [attendees, setAttendees] = useState('');
  const [meetingStatus, setMeetingStatus] = useState('not-started');
  const [meetingDuration, setMeetingDuration] = useState(0);
  
  const {
    transcript: liveTranscript,
    interimTranscript,
    finalTranscript,
    listening,
    resetTranscript: resetLiveTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const [useOnlineTranslation, setUseOnlineTranslation] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);

  const committedTranscriptRef = useRef('');
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDownloadDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Timer effect
  useEffect(() => {
    let interval;
    if (meetingStatus === 'recording') {
      interval = setInterval(() => {
        setMeetingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [meetingStatus]);

  // Sync committedTranscriptRef when transcript is cleared manually
  useEffect(() => {
    if (transcript === '') {
      committedTranscriptRef.current = '';
    }
  }, [transcript]);

  // Handle Speech Recognition Results
  useEffect(() => {
    if (finalTranscript !== '') {
      const text = finalTranscript;
      resetLiveTranscript();
      
      if (language !== 'en') {
        // Translate Tamil to English
        API.post('/translate/', {
          text: text,
          source_lang: language,
          target_lang: 'en',
          use_online: true
        }).then(res => {
          const translated = res.data.translation;
          if (translated) {
            const separator = committedTranscriptRef.current ? ' ' : '';
            committedTranscriptRef.current += separator + translated;
            setTranscript(committedTranscriptRef.current);
          }
        }).catch(err => console.error("Translation error:", err));
      } else {
        // Append English directly
        const separator = committedTranscriptRef.current ? ' ' : '';
        committedTranscriptRef.current += separator + text;
        setTranscript(committedTranscriptRef.current);
      }
    } else {
      // Show live interim results
      const display = committedTranscriptRef.current + 
          (interimTranscript ? (committedTranscriptRef.current ? ' ' : '') + interimTranscript : '');
      setTranscript(display);
    }
  }, [finalTranscript, interimTranscript, language, resetLiveTranscript]);

  const startMeeting = () => {
    if (!projectName.trim()) {
      alert('Please enter a project name');
      return;
    }
    if (!meetingType) {
      alert('Please select a meeting type');
      return;
    }
    setMeetingStatus('recording');
    setMeetingDuration(0);
    startListening();
    
    if (onStartMeeting) {
      onStartMeeting({
        project_name: projectName,
        meeting_title: meetingTitle,
        meeting_type: meetingType,
        date: meetingDate,
        time: meetingTime,
        attendees: attendees.split(',').map(a => a.trim()).filter(a => a),
        status: 'in-progress'
      });
    }
  };

  const stopMeeting = async () => {
    setMeetingStatus('completed');
    stopListening();
    
    if (onStopMeeting) {
      onStopMeeting({
        project_name: projectName,
        duration: meetingDuration,
        transcript: committedTranscriptRef.current
      });
    }

    const finalText = committedTranscriptRef.current;
    if (finalText && finalText.trim()) {
      await processTranscript(finalText);
    }
    
    setShowMeetingForm(false);
  };

  const pauseMeeting = () => {
    if (meetingStatus === 'recording') {
      setMeetingStatus('paused');
      stopListening();
    } else if (meetingStatus === 'paused') {
      setMeetingStatus('recording');
      startListening();
    }
  };

  const clearMeeting = () => {
    setMeetingStatus('not-started');
    setMeetingDuration(0);
    setTranscript('');
    setMeetingTitle('');
    setMeetingType('');
    setAttendees('');
    setShowMeetingForm(false);
    stopListening();
    resetLiveTranscript();
    committedTranscriptRef.current = '';
    
    if (onClearMeeting) {
      onClearMeeting();
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startListening = () => {
    const langMap = { 'en': 'en-IN', 'ta': 'ta-IN' };
    SpeechRecognition.startListening({
      continuous: true,
      language: langMap[language] || 'en-US',
      interimResults: true,
    });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

  const processTranscript = async (textToProcess) => {
    if (!textToProcess.trim()) return;
    setIsProcessing(true);
    
    let textToGenerateMOM = textToProcess;

    // If language is Tamil, we MUST translate to English before MOM generation
    if (language === 'ta') {
      setIsTranslating(true);
      try {
        const response = await API.post('/translate/', {
          text: textToProcess,
          source_lang: 'ta',
          target_lang: 'en',
          use_online: useOnlineTranslation
        });
        if (response.data && response.data.translation) {
          textToGenerateMOM = response.data.translation;
          // Update the transcript area with the translation so user can see it
          setTranscript(prev => prev + "\n\n[English Translation]:\n" + textToGenerateMOM);
        }
      } catch (error) {
        console.error('Translation failed:', error);
      } finally {
        setIsTranslating(false);
      }
    }

    try {
      const meetingPoints = [
        {
          id: Date.now(),
          sno: meetings.length + 1,
          project_name: projectName,
          discussion_point: textToGenerateMOM,
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ];

      await onProcessSpeech(meetingPoints);
    } catch (error) {
      console.error('Error processing transcript:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- MOM Export Functions ---

  const getMOMData = () => {
    // Current meeting data + processed points
    const currentMeetingPoints = meetings.filter(m => m.project_name === projectName);
    
    // Simple summary extraction (first few lines)
    const summary = transcript.split(/[.!?]+/).slice(0, 3).join('. ') + '.';
    
    // Action items (those marked as pending or having status)
    const actionItems = currentMeetingPoints.map(p => ({
      task: p.discussion_point,
      owner: 'TBD',
      deadline: 'TBD',
      status: p.status || 'Pending'
    }));

    return {
      projectName,
      meetingType,
      date: meetingDate,
      time: meetingTime,
      summary,
      discussionPoints: currentMeetingPoints.map(p => p.discussion_point),
      actionItems
    };
  };

  const downloadPDF = () => {
    const data = getMOMData();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.text('Minutes of Meeting', pageWidth / 2, 20, { align: 'center' });

    // Details
    doc.setFontSize(12);
    doc.text(`Department Name: ${data.projectName}`, 20, 40);
    doc.text(`Meeting Type: ${data.meetingType}`, 20, 50);
    doc.text(`Date: ${data.date}`, 20, 60);
    doc.text(`Time: ${data.time}`, 20, 70);

    // 1. Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Meeting Summary', 20, 90);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const summaryLines = doc.splitTextToSize(data.summary, pageWidth - 40);
    doc.text(summaryLines, 20, 100);

    // 2. Discussion Points
    let yPos = 100 + (summaryLines.length * 7) + 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Key Discussion Points', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    yPos += 10;
    data.discussionPoints.forEach((point, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${point}`, pageWidth - 40);
      if (yPos + (lines.length * 7) > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(lines, 20, yPos);
      yPos += (lines.length * 7);
    });

    // 3. Action Items
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Action Items', 20, yPos);
    
    doc.autoTable({
      startY: yPos + 5,
      head: [['Task', 'Owner', 'Deadline', 'Status']],
      body: data.actionItems.map(item => [item.task, item.owner, item.deadline, item.status]),
      theme: 'grid',
      headStyles: { fillStyle: [59, 130, 246] } // blue-500
    });

    doc.save(`MOM_${data.projectName.replace(/\s+/g, '_')}.pdf`);
    setShowDownloadDropdown(false);
  };

  const downloadWord = async () => {
    const data = getMOMData();
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Minutes of Meeting", bold: true, size: 32 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          new Paragraph({ children: [new TextRun({ text: `Department Name: ${data.projectName}`, bold: true })] }),
          new Paragraph({ children: [new TextRun({ text: `Meeting Type: ${data.meetingType}`, bold: true })] }),
          new Paragraph({ children: [new TextRun({ text: `Date: ${data.date}`, bold: true })] }),
          new Paragraph({ children: [new TextRun({ text: `Time: ${data.time}`, bold: true })], spacing: { after: 400 } }),
          
          new Paragraph({ children: [new TextRun({ text: "1. Meeting Summary", bold: true, size: 28 })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun(data.summary)], spacing: { after: 200 } }),
          
          new Paragraph({ children: [new TextRun({ text: "2. Key Discussion Points", bold: true, size: 28 })], spacing: { before: 200, after: 100 } }),
          ...data.discussionPoints.map((point, i) => new Paragraph({
            children: [new TextRun(`${i + 1}. ${point}`)],
            spacing: { after: 100 }
          })),
          
          new Paragraph({ children: [new TextRun({ text: "3. Action Items", bold: true, size: 28 })], spacing: { before: 200, after: 100 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: ["Task", "Owner", "Deadline", "Status"].map(text => new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
                  shading: { fill: "3b82f6", color: "ffffff" }
                }))
              }),
              ...data.actionItems.map(item => new TableRow({
                children: [item.task, item.owner, item.deadline, item.status].map(text => new TableCell({
                  children: [new Paragraph(text)]
                }))
              }))
            ]
          })
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `MOM_${data.projectName.replace(/\s+/g, '_')}.docx`);
    setShowDownloadDropdown(false);
  };

  const downloadText = () => {
    const data = getMOMData();
    let content = `Minutes of Meeting\n\n`;
    content += `Department Name: ${data.projectName}\n`;
    content += `Meeting Type: ${data.meetingType}\n`;
    content += `Date: ${data.date}\n`;
    content += `Time: ${data.time}\n\n`;
    content += `1. Meeting Summary\n${data.summary}\n\n`;
    content += `2. Key Discussion Points\n`;
    data.discussionPoints.forEach((p, i) => content += `${i + 1}. ${p}\n`);
    content += `\n3. Action Items\n`;
    content += `Task | Owner | Deadline | Status\n`;
    content += `-----------------------------------\n`;
    data.actionItems.forEach(item => {
      content += `${item.task} | ${item.owner} | ${item.deadline} | ${item.status}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `MOM_${data.projectName.replace(/\s+/g, '_')}.txt`);
    setShowDownloadDropdown(false);
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="p-6 text-center bg-red-50 rounded-lg border border-red-200">
        <MicOff className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-700">Browser Not Supported</h3>
        <p className="text-red-600">Your browser does not support Speech Recognition. Please use Chrome or Edge.</p>
      </div>
    );
  }

  const currentMeetingPoints = meetings.filter(m => m.project_name === projectName);
  const isMOMGenerated = currentMeetingPoints.length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4">
      {/* Header Section */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minutes of Meeting (MOM)</h1>
          <p className="text-gray-500">Live Browser Speech-to-Text with Auto-MOM Generation</p>
        </div>
        <div className="flex gap-3">
          {/* Download Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
              disabled={!isMOMGenerated}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all font-medium ${
                isMOMGenerated 
                ? "bg-green-600 text-white hover:bg-green-700" 
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Download className="h-4 w-4" />
              Download MOM
              <ChevronDown className={`h-4 w-4 transition-transform ${showDownloadDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showDownloadDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2 animate-in fade-in zoom-in-95 duration-100">
                <button onClick={downloadPDF} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                  <FileText className="h-4 w-4 text-red-500" /> PDF Document
                </button>
                <button onClick={downloadWord} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                  <FileText className="h-4 w-4 text-blue-500" /> Word (.docx)
                </button>
                <button onClick={downloadText} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                  <FileText className="h-4 w-4 text-gray-500" /> Plain Text (.txt)
                </button>
              </div>
            )}
          </div>

          {meetingStatus === 'not-started' && (
            <button
              onClick={() => setShowMeetingForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              New Meeting
            </button>
          )}
        </div>
      </div>

      {/* Meeting Setup Form */}
      {showMeetingForm && meetingStatus === 'not-started' && (
        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-blue-600 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Meeting Details
            </h2>
            <button onClick={() => setShowMeetingForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Automated Manufacturing"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Type *</label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select Meeting Type</option>
                <option value="Cross Functional Meeting">Cross Functional Meeting</option>
                <option value="Department Review Meeting">Department Review Meeting</option>
                <option value="Delivery Review">Delivery Review</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title</label>
              <input
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Weekly Sync"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input type="time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg" />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Attendees (Comma separated)</label>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe, Jane Smith"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={startMeeting} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
              <Mic className="h-4 w-4" /> Start Recording
            </button>
          </div>
        </div>
      )}

      {/* Active Meeting Controls */}
      {meetingStatus !== 'not-started' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-full">
                <Volume2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900">{projectName || 'Unnamed Department'}</h3>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {meetingType}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{meetingTitle || 'Meeting in progress'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Duration</p>
                <p className="text-xl font-mono font-bold text-gray-900">{formatTime(meetingDuration)}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={pauseMeeting} className={`p-2 rounded-lg border ${meetingStatus === 'paused' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border-gray-300'}`}>
                  {meetingStatus === 'paused' ? <Play className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                </button>
                <button onClick={stopMeeting} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  <Square className="h-5 w-5" />
                </button>
                <button onClick={clearMeeting} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Recognition Language:</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="text-sm border-gray-300 rounded-md p-1.5 focus:ring-blue-500"
                >
                  <option value="en">English (US)</option>
                  <option value="ta">Tamil (India)</option>
                </select>
                
                {language === 'ta' && (
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer bg-blue-50 px-2 py-1 rounded border border-blue-100">
                    <input 
                      type="checkbox" 
                      checked={useOnlineTranslation} 
                      onChange={(e) => setUseOnlineTranslation(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Online Translation (Higher Accuracy)
                  </label>
                )}

                {language === 'en' && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                    <b>Tip:</b> Use "Tamil" mode for Tamil/Mixed speech to avoid recognition errors.
                  </span>
                )}
                {listening && (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    Live Listening...
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              <textarea
                value={transcript}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  committedTranscriptRef.current = e.target.value;
                }}
                spellCheck={true}
                className="w-full h-80 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none text-gray-800 leading-relaxed"
                placeholder="Transcript will appear here as you speak..."
              />
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  onClick={() => processTranscript(transcript)}
                  disabled={!transcript.trim() || isProcessing || isTranslating}
                  className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 shadow-lg"
                >
                  {isProcessing || isTranslating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                  {isTranslating ? "Translating..." : "Generate MOM"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOM Content Display Section */}
      {isMOMGenerated && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* 1. Meeting Summary */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              1. Meeting Summary
            </h2>
            <div className="p-4 bg-gray-50 rounded-lg text-gray-700 leading-relaxed">
              {getMOMData().summary}
            </div>
          </div>

          {/* 2. Key Discussion Points (Existing UI) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              2. Key Discussion Points
            </h2>
            <div className="space-y-3">
              {currentMeetingPoints.map((point, index) => (
                <div key={point.id} className="flex gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                  <span className="text-gray-400 font-mono text-sm mt-1">{index + 1}.</span>
                  <p className="text-gray-700">{point.discussion_point}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Action Items */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-orange-500" />
              3. Action Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-bold">
                  <tr>
                    <th className="px-4 py-3 border-b">Task</th>
                    <th className="px-4 py-3 border-b w-32">Owner</th>
                    <th className="px-4 py-3 border-b w-32">Deadline</th>
                    <th className="px-4 py-3 border-b w-32">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getMOMData().actionItems.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-700">{item.task}</td>
                      <td className="px-4 py-3 text-gray-500 font-medium">{item.owner}</td>
                      <td className="px-4 py-3 text-gray-500 font-medium">{item.deadline}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold uppercase">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {meetingStatus === 'not-started' && !showMeetingForm && !isMOMGenerated && (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <div className="p-4 bg-blue-50 rounded-full mb-4">
            <MessageCircle className="h-10 w-10 text-blue-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">No Active Meeting</h2>
          <p className="text-gray-500 mt-1">Start a new meeting to begin live transcription</p>
          <button
            onClick={() => setShowMeetingForm(true)}
            className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-all font-medium"
          >
            Start New Meeting
          </button>
        </div>
      )}
    </div>
  );
};

export default SpeechToText;
