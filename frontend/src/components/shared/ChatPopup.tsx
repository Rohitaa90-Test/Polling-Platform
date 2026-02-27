import { useState, useRef, useEffect } from 'react';
import { usePoll } from '../../context/PollContext';
import type { ChatMessage } from '../../types';

interface ChatPopupProps {
  participants?: { studentId: string; studentName: string }[];
  showKick?: boolean;
  onKick?: (studentId: string) => void;
}

export default function ChatPopup({ participants = [], showKick = false, onKick }: ChatPopupProps) {
  const { chatMessages, sendChatMessage, role, studentId, studentName } = usePoll();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    sendChatMessage(text);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const myId = role === 'teacher' ? 'teacher' : studentId;

  return (
    <>
      {/* Floating chat button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#7765DA] text-white shadow-lg flex items-center justify-center hover:bg-[#5767D0] transition-colors z-40"
        aria-label="Toggle chat"
      >
        {isOpen ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="chat-panel fixed bottom-20 right-6 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col z-40 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'chat'
                  ? 'text-[#7765DA] border-b-2 border-[#7765DA]'
                  : 'text-[#6E6E6E] hover:text-[#373737]'
                }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'participants'
                  ? 'text-[#7765DA] border-b-2 border-[#7765DA]'
                  : 'text-[#6E6E6E] hover:text-[#373737]'
                }`}
            >
              Participants
            </button>
          </div>

          {/* Chat tab */}
          {activeTab === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {chatMessages.length === 0 && (
                  <p className="text-center text-[#6E6E6E] text-xs mt-8">No messages yet. Say hi! 👋</p>
                )}
                {chatMessages.map((msg: ChatMessage) => {
                  const isMe = msg.senderId === myId;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-xs text-[#6E6E6E] mb-0.5">{msg.senderName}</span>
                      <div
                        className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${isMe
                            ? 'bg-[#7765DA] text-white rounded-br-sm'
                            : 'bg-[#F2F2F2] text-[#373737] rounded-bl-sm'
                          }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-3 border-t border-gray-100 flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 rounded-full bg-[#F2F2F2] text-sm text-[#373737] placeholder-[#6E6E6E] focus:outline-none focus:ring-2 focus:ring-[#7765DA]"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="w-8 h-8 rounded-full bg-[#7765DA] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#5767D0] transition-colors"
                >
                  <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </>
          )}

          {/* Participants tab */}
          {activeTab === 'participants' && (
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-2 border-b border-gray-50">
                <div className="flex text-xs font-semibold text-[#6E6E6E] uppercase tracking-wide">
                  <span className="flex-1">Name</span>
                  {showKick && <span>Action</span>}
                </div>
              </div>
              {participants.length === 0 && (
                <p className="text-center text-[#6E6E6E] text-xs mt-8">No participants yet.</p>
              )}
              {participants
                .filter((p) => p.studentId !== myId)
                .map((p) => (
                  <div key={p.studentId} className="flex items-center px-4 py-3 border-b border-gray-50 hover:bg-gray-50">
                    <span className="flex-1 text-sm text-[#373737] font-medium">{p.studentName}</span>
                    {showKick && onKick && (
                      <button
                        onClick={() => onKick(p.studentId)}
                        className="text-xs text-red-500 hover:text-red-600 font-semibold transition-colors"
                      >
                        Kick out
                      </button>
                    )}
                  </div>
                ))}
              {/* Show self if student */}
              {!showKick && studentName && (
                <div className="flex items-center px-4 py-3 border-b border-gray-50">
                  <span className="flex-1 text-sm text-[#373737] font-medium">{studentName} (You)</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
