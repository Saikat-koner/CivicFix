import { useState, useEffect, useRef } from 'react';
import { CivicIssue } from '../types';

export interface CivicStreamEvent {
  type:
    | 'connected'
    | 'heartbeat'
    | 'issue_created'
    | 'issue_status_changed'
    | 'issue_updated'
    | 'issue_deleted'
    | 'vote_recorded'
    | 'issue_upvoted'
    | 'comment_added';
  issueId?: string;
  data?: any;
  timestamp: string;
}

export type StreamConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface UseCivicStreamOptions {
  enabled?: boolean;
  onIssueCreated?: (newIssue: CivicIssue) => void;
  onIssueUpdated?: (updatedIssue: CivicIssue) => void;
  onIssueDeleted?: (deletedId: string) => void;
  onUpvoted?: (issueId: string, updatedIssue: CivicIssue) => void;
  onVoteRecorded?: (issueId: string, updatedIssue: CivicIssue) => void;
  onCommentAdded?: (issueId: string, updatedIssue: CivicIssue) => void;
}

/**
 * Real-Time SSE Stream Hook (StreamBuilder pattern for React)
 * Subscribes to Server-Sent Events from /api/issues/stream and updates state reactively
 */
export function useCivicStream(options: UseCivicStreamOptions = {}) {
  const {
    enabled = true,
    onIssueCreated,
    onIssueUpdated,
    onIssueDeleted,
    onUpvoted,
    onVoteRecorded,
    onCommentAdded,
  } = options;

  const [status, setStatus] = useState<StreamConnectionStatus>('connecting');
  const [lastEvent, setLastEvent] = useState<CivicStreamEvent | null>(null);
  const [eventCount, setEventCount] = useState<number>(0);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setStatus('disconnected');
      return;
    }

    let isSubscribed = true;

    function connect() {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      setStatus('connecting');

      try {
        const es = new EventSource('/api/issues/stream');
        eventSourceRef.current = es;

        es.onopen = () => {
          if (!isSubscribed) return;
          setStatus('connected');
        };

        es.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const parsed: CivicStreamEvent = JSON.parse(event.data);
            setLastEvent(parsed);
            setEventCount((prev) => prev + 1);

            if (parsed.type === 'heartbeat') {
              setLastHeartbeat(new Date());
              return;
            }

            if (parsed.type === 'issue_created' && parsed.data) {
              onIssueCreated?.(parsed.data);
            } else if (
              (parsed.type === 'issue_updated' || parsed.type === 'issue_status_changed') &&
              parsed.data
            ) {
              onIssueUpdated?.(parsed.data);
            } else if (parsed.type === 'issue_deleted' && parsed.issueId) {
              onIssueDeleted?.(parsed.issueId);
            } else if (parsed.type === 'issue_upvoted' && parsed.data && parsed.issueId) {
              onUpvoted?.(parsed.issueId, parsed.data);
            } else if (parsed.type === 'vote_recorded' && parsed.data && parsed.issueId) {
              onVoteRecorded?.(parsed.issueId, parsed.data);
            } else if (parsed.type === 'comment_added' && parsed.data && parsed.issueId) {
              onCommentAdded?.(parsed.issueId, parsed.data);
            }
          } catch (err) {
            console.warn('[SSE Stream] Failed to parse event payload:', err);
          }
        };

        es.onerror = () => {
          if (!isSubscribed) return;
          setStatus('reconnecting');
          es.close();

          // Exponential backoff reconnect
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isSubscribed) {
              connect();
            }
          }, 3000);
        };
      } catch (err) {
        console.warn('[SSE Stream] Failed to initialize EventSource:', err);
        setStatus('reconnecting');
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isSubscribed) {
            connect();
          }
        }, 5000);
      }
    }

    connect();

    return () => {
      isSubscribed = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [enabled]);

  return {
    status,
    lastEvent,
    eventCount,
    lastHeartbeat,
    isConnected: status === 'connected',
  };
}
