import { useState } from 'react';
import { useAuth } from '@clerk/react';
import { toast } from 'react-toastify';
import '../styles/App.css';
import '../styles/Messages.css';
import { sendMessage } from '../api/messagesApi';

export default function Messages() {
  const { getToken } = useAuth();
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      const result = await sendMessage(getToken);
      setMessage('');
      toast.success(result.message, { toastId: 'messages-send-success' });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Request failed';
      toast.error(msg, { toastId: 'messages-send-error' });
    }
  };

  return (
    <div className="app">
      <h1>Messages</h1>
      <div className="input-section">
        <textarea
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="input-field messages-textarea"
          rows={4}
        />
        <button
          onClick={handleSend}
          className="add-button"
          disabled={!message.trim()}
        >
          Send Message (& report event to Stigg)
        </button>
      </div>
    </div>
  );
}
