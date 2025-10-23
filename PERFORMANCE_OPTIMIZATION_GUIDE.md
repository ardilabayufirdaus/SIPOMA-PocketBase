// PERFORMANCE_OPTIMIZATION_GUIDE.md

# Performance Optimization Guide for SIPOMA v2

This document outlines the performance optimizations implemented in the SIPOMA v2 application, focusing on two key areas:

## 1. Touch Gesture Optimization

The application uses touch gestures via the `@use-gesture` library for features like sidebar swiping. The following improvements were made:

### Issue: Touch Action Warning

The browser was generating warnings due to missing `touch-action` CSS property on draggable elements:

```
[@use-gesture]: The drag target has its `touch-action` style property set to `auto`.
It is recommended to add `touch-action: 'none'` so that the drag gesture behaves correctly on touch-enabled devices.
```

### Solution:

- Added `touch-action: none` to draggable elements, particularly the sidebar component
- This ensures proper gesture behavior on touch devices without browser interference
- Prevents touch gesture events from triggering scrolling behaviors simultaneously

## 2. Realtime Subscription Performance

The application makes extensive use of PocketBase's realtime subscriptions to update data in real-time. Performance issues were occurring with:

### Issues:

- Excessive message handler warnings (`[Violation] 'message' handler took <N>ms`)
- Many simultaneous realtime subscriptions causing performance degradation
- Callback processing causing UI jank when many updates arrive simultaneously

### Solution: RealtimeSubscriptionOptimizer

We've implemented a subscription optimizer system with the following features:

1. **Batched Processing**
   - Groups multiple realtime updates together
   - Processes them in manageable batches (10 updates at a time by default)
   - Prevents UI thread blocking when many updates arrive simultaneously

2. **Debounce Mechanism**
   - Introduces a small delay (100ms default) to collect multiple updates
   - Reduces the frequency of UI updates for smoother performance
   - Can be customized per subscription if needed

3. **Queue Management**
   - Updates are queued by collection
   - Long queues (>50 updates) are processed immediately
   - Error handling prevents crashes in message processing

### Usage:

```typescript
// With optimization (default)
useRealtimeSubscription('collection_name', '*', handleData);

// Without optimization when immediate updates are critical
useRealtimeSubscription('collection_name', '*', handleData, false);
```

## Implementation Notes

1. The `RealtimeSubscriptionOptimizer` is a singleton class that manages update queues
2. Debounced processing ensures UI responsiveness even during high update volumes
3. All optimizations are configurable and can be tuned based on application needs
4. Proper error handling prevents subscription failures from affecting the application

## Further Optimization Opportunities

1. Add worker threads for CPU-intensive data processing
2. Implement subscription prioritization for critical updates
3. Add adaptive batch sizing based on device performance
4. Implement memory usage monitoring for large subscription volumes

---

These optimizations significantly improve application responsiveness, especially on mobile devices and with large data volumes.
