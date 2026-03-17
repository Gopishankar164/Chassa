/**
 * orderStatusService
 *
 * NOTE: Client-side automatic order status progression has been disabled.
 * Order status is authoritative from the backend only. This service now
 * only provides helper utilities (status labels, colour mapping) and
 * the getAutomationStatus stub so existing call-sites don't break.
 */

class OrderStatusService {
  constructor() {
    // No intervals — automation removed.
  }

  /** No-op: automation is handled server-side. */
  startAutomation(_orderId, _initialStatus) {}

  /** No-op. */
  stopAutomation(_orderId) {}

  /** Always returns false — no client-side automation is running. */
  getAutomationStatus(_orderId) {
    return false;
  }
}

const orderStatusService = new OrderStatusService();

export default orderStatusService;
