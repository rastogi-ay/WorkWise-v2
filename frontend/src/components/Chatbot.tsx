import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useAuth } from '@clerk/react';
import { Link } from 'react-router-dom';
import '../styles/App.css';
import '../styles/Chatbot.css';
import { sendChatMessage, type ChatMessage } from '../api/pages/chatbotApi';
import { fetchTokensUsage } from '../api/ai-spend/tokensApi';
import { ChatIcon } from '../extras/icons';
import { AccessDeniedModal } from './AccessDeniedModal';
import { ErrorModal } from './ErrorModal';
import { InsufficientBalanceModal } from './InsufficientBalanceModal';
import { useEntitlement, getLoadingAndError, isAccessDenied } from '../stigg/useEntitlement';
import { PRICING_URL_BY_PRODUCT_ID } from './PaywallPage';
import { WORKWISE_AI_PRODUCT_ID } from '../stigg/constants';
import { PageLoading } from '../extras/PageLoading';
import { UsageMeter } from './UsageMeter';
import { useActingAs } from '../stigg/governanceUser';

const PRICING_URL = PRICING_URL_BY_PRODUCT_ID[WORKWISE_AI_PRODUCT_ID];

export default function Chatbot() {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [dismissedPaywall, setDismissedPaywall] = useState(false);
  // Any 403 on send lands here, holding the backend's own message. One path for both causes: the
  // account being out of tokens, and the acting entity's budget (or an ancestor's) being exhausted.
  // The message distinguishes them in words; nothing branches on it.
  const [denialMessage, setDenialMessage] = useState<string | null>(null);
  const [usageLimit, setUsageLimit] = useState<number | null>(null);
  const [currentUsage, setCurrentUsage] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { actingAsEntityId, dimensions } = useActingAs();
  const tokensAccess = useEntitlement(() => fetchTokensUsage(getToken), [getToken]);

  let modal: ReactNode = null;
  const { isLoading, hasError } = getLoadingAndError(tokensAccess.status);

  if (hasError) {
    modal = <ErrorModal featureName="AI chat" />;
  } else if (denialMessage && !dismissedPaywall) {
    modal = (
      <InsufficientBalanceModal
        featureName="AI chat"
        pricingUrl={PRICING_URL}
        title="AI Chat Blocked"
        message={denialMessage}
        onClose={() => setDismissedPaywall(true)}
      />
    );
  } else if (tokensAccess.status === 'denied') {
    modal = <AccessDeniedModal featureName="AI chat" pricingUrl={PRICING_URL} />;
  }

  useEffect(() => {
    if (!tokensAccess.data) return;
    setUsageLimit(tokensAccess.data.usageLimit);
    setCurrentUsage(tokensAccess.data.currentUsage);
  }, [tokensAccess.data]);

  // A denial belongs to the entity that hit it, so switching who we act as has to clear it —
  // otherwise Bob inherits Alice's block, the exact opposite of the isolation being demonstrated.
  useEffect(() => {
    setDenialMessage(null);
    setDismissedPaywall(false);
  }, [actingAsEntityId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isSending) return;

    const history = [...messages, { role: 'user' as const, text }];
    // render the user's message immediately rather than waiting on the reply
    setMessages(history);
    setInput('');
    setIsSending(true);

    try {
      const data = await sendChatMessage(getToken, history, dimensions);
      setMessages([...history, { role: 'assistant', text: data.reply }]);
      setCurrentUsage(data.currentUsage);
      setDenialMessage(null);
    } catch (error: unknown) {
      // nothing was spent, so undo the optimistic message and hand the text back
      setMessages(messages);
      setInput(text);

      if (isAccessDenied(error)) {
        // blocked before this send reached Gemini, either by the account balance or by a governed
        // budget — the backend's message says which
        setDenialMessage(error instanceof Error ? error.message : 'AI chat is unavailable.');
        setDismissedPaywall(false);
      } else {
        console.error('Failed to send chat message:', error);
      }
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  if (isLoading) {
    return (
      <div className="app chatbot-page">
        <PageLoading />
      </div>
    );
  }

  return (
    <div className="app chatbot-page">
      <div className="page-header">
        <span className="page-header__icon">
          <ChatIcon />
        </span>
        <div className="page-header__text">
          <h1 className="page-header__title">AI Chat</h1>
          <p className="page-header__subtitle">
            Chat with us! Get productivity insights on demand.
          </p>
        </div>
      </div>

      <div className="page-content-wrapper">
        <div className={modal ? 'page-content page-content--blurred' : 'page-content'}>
          <div className="chatbot__usage">
            <UsageMeter
              label="AI tokens"
              Icon={ChatIcon}
              usageLimit={usageLimit}
              currentUsage={currentUsage}
            />

            {/* Which governed entity this chat spends against. Without it an unexpected block is
                impossible to explain, and per-user isolation is invisible. */}
            <p className="chatbot__acting-as">
              {actingAsEntityId ? (
                <>
                  Spending as <strong>{actingAsEntityId}</strong> ·{' '}
                  <Link to="/governance">switch user</Link>
                </>
              ) : (
                <>
                  Ungoverned — <Link to="/governance">pick a user</Link> to spend against a budget
                </>
              )}
            </p>
          </div>

          <div className="chat-panel">
            <div className="chat-message-list">
              {messages.map((message, index) => (
                <div key={index} className={`chat-message chat-message--${message.role}`}>
                  {message.text}
                </div>
              ))}
              {isSending && (
                <div className="chat-message chat-message--assistant chat-message--pending">
                  Thinking…
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <form
              className="chat-input-row"
              onSubmit={(event) => {
                event.preventDefault();
                handleSend();
              }}
            >
              <textarea
                className="chat-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                rows={2}
                disabled={isSending}
              />
              <button
                type="submit"
                className="generate-button chat-send-button"
                disabled={isSending || !input.trim()}
              >
                {isSending ? 'Sending…' : 'Send'}
              </button>
            </form>
          </div>
        </div>

        {modal}
      </div>
    </div>
  );
}
