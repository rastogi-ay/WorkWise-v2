import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useAuth } from '@clerk/react';
import '../styles/App.css';
import '../styles/Tokens.css';
import { fetchTokensUsage, sendChatMessage, type ChatMessage } from '../api/tokensApi';
import { ChatIcon } from '../extras/icons';
import { AccessDeniedModal } from './AccessDeniedModal';
import { ErrorModal } from './ErrorModal';
import { InsufficientBalanceModal } from './InsufficientBalanceModal';
import { useEntitlement, getLoadingAndError, isAccessDenied } from '../stigg/useEntitlement';
import { PRICING_URL_BY_PRODUCT_ID } from './PaywallPage';
import { WORKWISE_AI_PRODUCT_ID } from '../stigg/constants';
import { PageLoading } from '../extras/PageLoading';

const PRICING_URL = PRICING_URL_BY_PRODUCT_ID[WORKWISE_AI_PRODUCT_ID];

export default function Tokens() {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [dismissedPaywall, setDismissedPaywall] = useState(false);
  const [sendDenied, setSendDenied] = useState(false);
  const [usageLimit, setUsageLimit] = useState<number | null>(null);
  const [currentUsage, setCurrentUsage] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const tokensAccess = useEntitlement(() => fetchTokensUsage(getToken), [getToken]);

  let modal: ReactNode = null;
  const { isLoading, hasError } = getLoadingAndError(tokensAccess.status);

  if (hasError) {
    modal = <ErrorModal featureName="AI chat" />;
  } else if (sendDenied && !dismissedPaywall) {
    modal = (
      <InsufficientBalanceModal
        featureName="AI chat"
        pricingUrl={PRICING_URL}
        title="Out of AI Tokens"
        message="You've used all your AI tokens for this billing period. Upgrade your plan to keep chatting."
        ctaLabel="Upgrade Plan"
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isSending) return;

    const history = [...messages, { role: 'user' as const, text }];
    setIsSending(true);

    try {
      const data = await sendChatMessage(getToken, history);
      setMessages([...history, { role: 'assistant', text: data.reply }]);
      setInput('');
      setUsageLimit(data.usageLimit);
      setCurrentUsage(data.currentUsage);
      setSendDenied(false);
    } catch (error: unknown) {
      if (isAccessDenied(error)) {
        // hit the token limit before this send even reached Gemini — surface the paywall
        setSendDenied(true);
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
      <div className="app tokens-page">
        <PageLoading />
      </div>
    );
  }

  const limit = usageLimit ?? 0;
  const used = currentUsage ?? 0;
  const percentUsed = limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 0;

  return (
    <div className="app tokens-page">
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
          <div className="tokens-usage">
            <span className="tokens-usage__icon">
              <ChatIcon size={18} />
            </span>
            <div className="tokens-usage__text">
              <span className="tokens-usage__label">AI tokens used</span>
              <span className="tokens-usage__value">
                {used} / {limit}
              </span>
              <div className="tokens-usage__bar">
                <div className="tokens-usage__bar-fill" style={{ width: `${percentUsed}%` }} />
              </div>
            </div>
          </div>

          <div className="chat-panel">
            <div className="chat-message-list">
              {messages.map((message, index) => (
                  <div key={index} className={`chat-message chat-message--${message.role}`}>
                    {message.text}
                  </div>
                ))
              }
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
