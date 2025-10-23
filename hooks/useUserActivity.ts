import { useEffect, useRef, useCallback } from 'react';
import { useUserActivityStore } from '../stores/userActivityStore';
import { sanitizeForJSON } from '../utils/sanitizeJSON';

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

  // Start user session - dengan debounce untuk mencegah multiple calls
  const startSession = useCallback(
    async (userId: string) => {
      // Cegah multiple panggilan API dalam waktu singkat
      const now = new Date();
      if (lastActivityRef.current && now.getTime() - lastActivityRef.current.getTime() < 5000) {
        return; // Skip jika dipanggil kurang dari 5 detik dari panggilan sebelumnya
      }

      lastActivityRef.current = now;

      try {
        // Cek session ID
        if (sessionIdRef.current) {
          return; // Sudah ada session, tidak perlu membuat lagi
        }

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

        // Log session start action - tidak perlu log double
        // Komentar untuk mengurangi API calls yang tidak perlu
        /*
        await logUserAction({
          user_id: userId,
          action_type: 'login',
          module: 'authentication',
          description: 'User logged in',
          ip_address: '',
          success: true,
          metadata: { session_start: true },
        });
        */
      } catch (error) {
        // eslint-disable-next-line no-console
        if (!error?.message?.includes('autocancelled')) {
          console.error('Error starting session:', error);
        }
      }
    },
    [getBrowserInfo, startUserSession]
  );

  // End user session
  const endSession = useCallback(async () => {
    if (!sessionIdRef.current || !userId) return;

    const sessionId = sessionIdRef.current;

    try {
      // Use a custom AbortController to prevent auto-cancellation issues
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      await endUserSession(sessionId);

      clearTimeout(timeoutId);

      // Only log if the first request was successful
      try {
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
      } catch {
        // Silently ignore logging errors - session was already ended
      }

      sessionIdRef.current = null;
    } catch (error) {
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('autocancelled')) {
          // For autocancellation errors, try a direct fetch as fallback
          try {
            await fetch(
              `${import.meta.env.VITE_POCKETBASE_URL}/api/collections/user_sessions/records/${sessionId}`,
              {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  session_end: new Date().toISOString(),
                  is_active: false,
                }),
              }
            );
            // Success, clear the session ID
            sessionIdRef.current = null;
          } catch {
            // Final fallback failed, but we shouldn't block the UI
          }
        } else {
          // Log other types of errors
          // eslint-disable-next-line no-console
          console.error('Error ending session:', error);
        }
      }
    }
  }, [userId, endUserSession, logUserAction]);

  // Update last activity
  const updateActivity = useCallback(async () => {
    if (!sessionIdRef.current) return;

    const sessionId = sessionIdRef.current;

    try {
      // Use a custom AbortController to prevent auto-cancellation issues
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      await updateLastActivity(sessionId);
      clearTimeout(timeoutId);

      lastActivityRef.current = new Date();
    } catch (error) {
      // Handle specific error types
      if (error instanceof Error && error.message.includes('autocancelled')) {
        // For autocancellation errors, try a direct fetch as fallback
        try {
          await fetch(
            `${import.meta.env.VITE_POCKETBASE_URL}/api/collections/user_sessions/records/${sessionId}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                last_activity: new Date().toISOString(),
              }),
            }
          );
          // Success, update the last activity ref
          lastActivityRef.current = new Date();
        } catch {
          // Final fallback failed, but we shouldn't block the UI
        }
      } else if (!(error instanceof Error && error.message.includes('404'))) {
        // Only log if not a 404 (missing collection) or autocancellation
        // eslint-disable-next-line no-console
        console.error('Error updating activity:', error);
      }
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
        // Use a custom AbortController to prevent auto-cancellation issues
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

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

        clearTimeout(timeoutId);

        // Update last activity (only if log action succeeded)
        await updateActivity();
      } catch (error) {
        // Handle autocancellation errors silently to avoid console pollution
        if (
          error instanceof Error &&
          !error.message.includes('autocancelled') &&
          !error.message.includes('404')
        ) {
          // Only log if not an autocancellation or 404 error
          // eslint-disable-next-line no-console
          console.error('Error logging action:', error);
        }

        // Still try to update activity even if logging fails
        try {
          await updateActivity();
        } catch {
          // Ignore activity update errors if logging already failed
        }
      }
    },
    [userId, logUserAction, updateActivity]
  );

  // Track page views dengan throttling untuk mengurangi API calls
  useEffect(() => {
    if (!userId || !trackPageViews) return;

    // Tambahkan throttling untuk mengurangi jumlah panggilan API
    let lastPageLogTime = 0;
    const throttleDelay = 30000; // 30 detik
    let lastPagePath = '';

    const handlePageView = () => {
      const page = window.location.pathname;
      const now = Date.now();

      // Hanya log jika path berubah atau sudah lewat 30 detik
      if (page !== lastPagePath || now - lastPageLogTime > throttleDelay) {
        lastPagePath = page;
        lastPageLogTime = now;

        // Gunakan timeout untuk mengurangi API calls pada initial load
        setTimeout(() => {
          try {
            // Safely log navigation with only primitive data types
            logAction('view', 'navigation', `Viewed page: ${page}`, {
              page,
              title: document.title,
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            // Silent error handling
          }
        }, 1500);
      }
    };

    // Track initial page load - dengan delay untuk mengurangi beban pada initial load
    setTimeout(handlePageView, 2000);

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
        try {
          const element = target.closest('button, a') || target;
          const text = element.textContent?.trim() || 'Unknown element';

          // Extract only safe properties to avoid circular references
          const safeElementData = {
            element: element.tagName,
            text,
            href:
              element.tagName === 'A' || element.tagName === 'a'
                ? (element as HTMLAnchorElement).href
                : undefined,
            id: element.id || undefined,
            className: element.className || undefined,
          };

          logAction('view', 'interaction', `Clicked: ${text}`, safeElementData);
        } catch (error) {
          // Silently handle any errors during click tracking
          console.warn(
            'Failed to track click:',
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [userId, trackClicks, logAction]);

  // Track form submissions
  useEffect(() => {
    if (!userId || !trackFormSubmissions) return;

    const handleFormSubmit = (event: SubmitEvent) => {
      try {
        const form = event.target as HTMLFormElement;
        const formName = form.name || form.id || 'Unknown form';
        // Extract only safe properties from form to avoid circular references
        const safeFormData = {
          form_name: formName,
          form_action: typeof form.action === 'string' ? form.action : String(form.action),
          form_method: form.method || 'unknown',
          form_enctype: form.enctype || 'unknown',
        };
        logAction('create', 'forms', `Submitted form: ${formName}`, safeFormData);
      } catch (error) {
        console.warn(
          'Failed to track form submission:',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    };

    document.addEventListener('submit', handleFormSubmit);
    return () => document.removeEventListener('submit', handleFormSubmit);
  }, [userId, trackFormSubmissions, logAction]);

  // Session management
  useEffect(() => {
    if (!userId) return;

    let isComponentMounted = true;
    let currentSessionId = sessionIdRef.current;

    // Start session when user ID is provided
    startSession(userId);

    // Update activity every 2 minutes
    const activityInterval = setInterval(updateActivity, 2 * 60 * 1000);

    // Check for session timeout
    const timeoutInterval = setInterval(() => {
      const now = new Date();
      const timeSinceLastActivity = now.getTime() - lastActivityRef.current.getTime();
      const timeoutMs = sessionTimeoutMinutes * 60 * 1000;

      if (timeSinceLastActivity > timeoutMs && isComponentMounted) {
        // Safely end session with timeout check
        const safeEndSession = async () => {
          if (currentSessionId && isComponentMounted) {
            try {
              await endSession();
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error('Error during timeout session end:', error);
            }
          }
        };
        safeEndSession();
      }
    }, 60 * 1000); // Check every minute

    // Handle page unload
    const handleBeforeUnload = () => {
      // Synchronous operation on page unload - can't await this
      if (currentSessionId) {
        try {
          fetch(
            `${import.meta.env.VITE_POCKETBASE_URL}/api/collections/user_sessions/records/${currentSessionId}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                session_end: new Date().toISOString(),
                is_active: false,
              }),
              // Use keepalive to ensure request completes during page unload
              keepalive: true,
            }
          ).catch(() => {});
        } catch {
          // Silent catch during page unload
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      isComponentMounted = false;
      clearInterval(activityInterval);
      clearInterval(timeoutInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // Safe cleanup that won't cause autocancellation errors
      const safeCleanup = async () => {
        currentSessionId = sessionIdRef.current;
        if (currentSessionId) {
          try {
            // Use fetch directly instead of endSession to avoid autocancellation
            await fetch(
              `${import.meta.env.VITE_POCKETBASE_URL}/api/collections/user_sessions/records/${currentSessionId}`,
              {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  session_end: new Date().toISOString(),
                  is_active: false,
                }),
              }
            ).catch(() => {});
          } catch {
            // Silently ignore cleanup errors during unmount
          }
        }
      };

      // Execute cleanup
      safeCleanup();
    };
  }, [userId, sessionTimeoutMinutes, startSession, endSession, updateActivity]);

  // Return utility functions for manual tracking
  return {
    logAction,
    updateActivity,
    endSession,
  };
};
