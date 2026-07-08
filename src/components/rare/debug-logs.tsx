import { useState, useRef, useEffect } from 'react';
import { Terminal, ChevronDown, ChevronUp, Trash2, Copy } from 'lucide-react';
import { useLogs, LogEntry } from '../../context/LogContext';

const categoryColors: Record<LogEntry['category'], string> = {
  AUTH: 'text-green-400',
  AI_PROMPT: 'text-cyan-400',
  RENDER: 'text-purple-400',
  AUDIO: 'text-orange-400',
  PAYMENT: 'text-yellow-400',
  DOWNLOAD: 'text-emerald-400',
  SYSTEM: 'text-gray-400',
  SLIDER: 'text-blue-400',
};

const categoryLabels: Record<LogEntry['category'], string> = {
  AUTH: 'AUTH',
  AI_PROMPT: 'AI_PROMPT',
  RENDER: 'RENDER',
  AUDIO: 'AUDIO',
  PAYMENT: 'PAYMENT',
  DOWNLOAD: 'DOWNLOAD',
  SYSTEM: 'SYSTEM',
  SLIDER: 'SLIDER',
};

const categoryIcons: Record<LogEntry['category'], string> = {
  AUTH: '🔐',
  AI_PROMPT: '🎯',
  RENDER: '🎨',
  AUDIO: '🎵',
  PAYMENT: '💳',
  DOWNLOAD: '📥',
  SYSTEM: '⚙️',
  SLIDER: '⏱️',
};

export function DebugLogs() {
  const { logs, clearLogs } = useLogs();
  const [isExpanded, setIsExpanded] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && isExpanded && autoScroll) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isExpanded, autoScroll]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleCopyAll = () => {
    const allLogs = logs
      .map((log) => `LOG [${categoryLabels[log.category]}]: ${log.message}`)
      .join('\n');
    navigator.clipboard.writeText(allLogs);
  };

  return (
    <div className="glass-panel rounded-lg border border-rare-border overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-rare-panel/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-rare-accent-cyan/10">
            <Terminal className="w-4 h-4 text-rare-accent-cyan" />
          </div>
          <span className="text-sm font-semibold text-white">Developer Console</span>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${logs.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
            <span className="text-xs text-gray-500">({logs.length} entries)</span>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {isExpanded && (
            <>
              <button
                onClick={handleCopyAll}
                className="p-1.5 hover:bg-rare-border rounded transition-colors"
                title="Copy all logs"
              >
                <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
              </button>
              <button
                onClick={clearLogs}
                className="p-1.5 hover:bg-rare-border rounded transition-colors"
                title="Clear logs"
              >
                <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
              </button>
            </>
          )}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Log Content */}
      {isExpanded && (
        <div className="border-t border-rare-border">
          {/* Auto-scroll toggle */}
          <div className="flex items-center justify-between px-4 py-2 bg-black/30 border-b border-rare-border">
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded border-rare-border bg-rare-border"
              />
              Auto-scroll
            </label>
            <select
              onChange={() => {
                // Filter logic can be added
              }}
              className="text-xs bg-rare-border border-rare-border rounded px-2 py-1 text-gray-400"
            >
              <option value="all">All Logs</option>
              <option value="auth">Auth Only</option>
              <option value="ai">AI Only</option>
              <option value="download">Downloads</option>
            </select>
          </div>

          {/* Log entries */}
          <div
            ref={scrollRef}
            className="h-48 overflow-y-auto bg-black/50 font-mono text-xs"
          >
            {logs.length === 0 ? (
              <div className="px-4 py-4 text-gray-500 text-center">
                No logs yet. Interact with the app to see status messages.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="px-4 py-2 border-b border-rare-border/30 hover:bg-rare-panel/30 transition-colors group"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-gray-600 flex-shrink-0">
                      [{formatTime(log.timestamp)}]
                    </span>
                    <span className={`${categoryColors[log.category]} flex-shrink-0 font-bold`}>
                      [{categoryLabels[log.category]}]
                    </span>
                    <span className="text-gray-300 flex-1">{log.message}</span>
                    <span className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      {categoryIcons[log.category]}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sample logs hint */}
          <div className="px-4 py-2 bg-rare-panel/30 border-t border-rare-border text-center">
            <p className="text-xs text-gray-500">
              Expected logs: AUTH | AI_PROMPT | RENDER | AUDIO | PAYMENT | DOWNLOAD
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
