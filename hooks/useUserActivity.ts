import { useEffect, useRef, useCallback } from 'react';
import { useUserActivityStore } from '../stores/userActivityStore';

interface ActivityTrackingOptions {
  trackPageViews?: boolean;
  trackClicks?: boolean;
  trackFormSubmissions?: boolean;
  sessionTimeoutMinutes?: number;
}

export const useUserActivity = (userId?: string, options: ActivityTrackingOptions = {}) => {
  const { logUserAction, startUserSession, endUserSession, updateLastActivity } =
    useUserActivityStore();

  const sessionIdRef = useRef<string | null>(null);
  const lastActivityRef = useRef<Date>(new Date());
  const {
    trackPageViews = true,
    trackClicks = false,
    trackFormSubmissions = true,
    sessionTimeoutMinutes = 120,
  } = options;

  // Get browser and device information
  const getBrowserInfo = useCallback(() => {
    const userAgent = navigator.userAgent;
    const device = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
      ? /iPad/i.test(userAgent)
        ? 'tablet'
        : 'mobile'
      : 'desktop';

    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    else if (userAgent.includes('Opera')) browser = 'Opera';

    return { device, browser, userAgent };
  }, []);

  // Start user session
  const startSession = useCallback(
    async (userId: string) => {
      try {
        const { device, browser, userAgent } = getBrowserInfo();
        const sessionData = {
          device_type: device as 'desktop' | 'mobile' | 'tablet',
          browser,
          user_agent: userAgent,
          ip_address: '', // Will be filled by backend
          location: '', // Will be filled by backend if geolocation is available
        };

        const session = await startUserSession(userId, sessionData);

        // Store the real session ID from the database
        if (session?.id) {
          sessionIdRef.current = session.id;
        }

        // Log session start action
        await logUserAction({
          user_id: userId,
          action_type: 'login',
          module: 'authentication',
          description: 'User logged in',
          ip_address: '',
          success: true,
          metadata: { session_start: true },
        });
      } catch (error) {
        console.error('Error starting session:', error);
      }
    },
    [getBrowserInfo, startUserSession, logUserAction]
  );

  // End user session
  const endSession = useCallback(async () => {
    if (!sessionIdRef.current || !userId) return;

    try {
      await endUserSession(sessionIdRef.current);

      // Log session end action
      await logUserAction({
        user_id: userId,
        action_type: 'logout',
        module: 'authentication',
        description: 'User logged out',
        ip_address: '',
        success: true,
        metadata: { session_end: true },
      });

      sessionIdRef.current = null;
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }, [userId, endUserSession, logUserAction]);

  // Update last activity
  const updateActivity = useCallback(async () => {
    if (!sessionIdRef.current) return;

    try {
      await updateLastActivity(sessionIdRef.current);
      lastActivityRef.current = new Date();
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  }, [updateLastActivity]);

  // Log specific user action
  const logAction = useCallback(
    async (
      actionType: 'view' | 'create' | 'update' | 'delete' | 'export' | 'import',
      module: string,
      description: string,
      metadata: Record<string, unknown> = {},
      success: boolean = true,
      errorMessage?: string
    ) => {
      if (!userId) return;

      try {
        await logUserAction({
          user_id: userId,
          action_type: actionType,
          module,
          description,
          ip_address: '',
          success,
          error_message: errorMessage,
          metadata,
        });

        // Update last activity
        await updateActivity();
      } catch (error) {
        console.error('Error logging action:', error);
      }
    },
    [userId, logUserAction, updateActivity]
  );

  // Track page views
  useEffect(() => {
    if (!userId || !trackPageViews) return;

    const handlePageView = () => {
      const page = window.location.pathname;
      logAction('view', 'navigation', `Viewed page: ${page}`, { page });
    };

    // Track initial page load
    handlePageView();

    // Track navigation (for SPAs)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      setTimeout(handlePageView, 0);
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      setTimeout(handlePageView, 0);
    };

    window.addEventListener('popstate', handlePageView);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handlePageView);
    };
  }, [userId, trackPageViews, logAction]);

  // Track clicks (optional)
  useEffect(() => {
    if (!userId || !trackClicks) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a')
      ) {
        const element = target.closest('button, a') || target;
        const text = element.textContent?.trim() || 'Unknown element';
        logAction('view', 'interaction', `Clicked: ${text}`, {
          element: element.tagName,
          text,
          href: (element as HTMLAnchorElement).href,
        });
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [userId, trackClicks, logAction]);

  // Track form submissions
  useEffect(() => {
    if (!userId || !trackFormSubmissions) return;

    const handleFormSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement;
      const formName = form.name || form.id || 'Unknown form';
      logAction('create', 'forms', `Submitted form: ${formName}`, {
        form_name: formName,
        form_action: form.action,
      });
    };

    document.addEventListener('submit', handleFormSubmit);
    return () => document.removeEventListener('submit', handleFormSubmit);
  }, [userId, trackFormSubmissions, logAction]);

  // Session management
  useEffect(() => {
    if (!userId) return;

    // Start session when user ID is provided
    startSession(userId);

    // Update activity every 2 minutes
    const activityInterval = setInterval(updateActivity, 2 * 60 * 1000);

    // Check for session timeout
    const timeoutInterval = setInterval(() => {
      const now = new Date();
      const timeSinceLastActivity = now.getTime() - lastActivityRef.current.getTime();
      const timeoutMs = sessionTimeoutMinutes * 60 * 1000;

      if (timeSinceLastActivity > timeoutMs) {
        endSession();
      }
    }, 60 * 1000); // Check every minute

    // Handle page unload
    const handleBeforeUnload = () => {
      endSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(activityInterval);
      clearInterval(timeoutInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      endSession();
    };
  }, [userId, sessionTimeoutMinutes, startSession, endSession, updateActivity]);

  // Return utility functions for manual tracking
  return {
    logAction,
    updateActivity,
    endSession,
  };
};
