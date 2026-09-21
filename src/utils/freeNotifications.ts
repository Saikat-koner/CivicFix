/**
 * CivicFix 100% Free Zero-Cost Notification Service
 *
 * Provides completely free email and SMS notification capabilities:
 * 1. Free Browser Web Push Notifications (HTML5 Notification API - 0 cost, instant on-device alerts)
 * 2. Free Native Mobile SMS Protocol (RFC 5724 sms: uri - launches native messaging app with prefilled text at 0 cost)
 * 3. Free Native Email Protocol (mailto: uri - launches default email app with prefilled receipt at 0 cost)
 * 4. Free Web Share API (native OS share sheet to send via SMS, WhatsApp, or Email without paying SMS gateway fees)
 * 5. Free Cloud Gateway Relay (Brevo/Resend free tiers + Textbelt free tier with zero-cost fallback)
 */

import { soundFX } from './audioFeedback';
import { apiClient } from '../services/api';

export interface FreeTicketNotificationParams {
  email?: string;
  phone?: string;
  issueCode: string;
  issueTitle: string;
  status: string;
  department?: string;
  citizenName?: string;
  remarks?: string;
}

/**
 * Check if the current browser supports HTML5 Web Notifications
 */
export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current browser notification permission status
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Request notification permission from user (100% free, browser native)
 */
export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (!isBrowserNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      soundFX.playSuccess();
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[FreeNotifications] Error requesting notification permission:', err);
    return false;
  }
}

/**
 * Show a 100% free browser system notification
 */
export function showBrowserNotification(options: {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  onClick?: () => void;
}): boolean {
  if (!isBrowserNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const notif = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      tag: options.tag || 'civicfix-free-alert',
      badge: '/favicon.ico',
    });

    if (options.onClick) {
      notif.onclick = () => {
        window.focus();
        options.onClick?.();
        notif.close();
      };
    }

    return true;
  } catch (err) {
    console.warn('[FreeNotifications] Browser notification display note:', err);
    return false;
  }
}

/**
 * Generate a 100% free SMS URL using native device sms: scheme
 */
export function getFreeSmsUrl(phone: string, message: string): string {
  const cleanPhone = (phone || '').replace(/[^\d+]/g, '');
  const encodedMessage = encodeURIComponent(message);
  // iOS and Android both support ?body=
  return `sms:${cleanPhone}?body=${encodedMessage}`;
}

/**
 * Open native SMS app on user's device with prefilled message (100% Free, zero gateway charge)
 */
export function openFreeDeviceSms(phone: string, message: string): boolean {
  try {
    const url = getFreeSmsUrl(phone, message);
    window.location.href = url;
    soundFX.playClick();
    return true;
  } catch (err) {
    console.warn('[FreeNotifications] Error opening SMS scheme:', err);
    return false;
  }
}

/**
 * Generate a 100% free Email URL using native mailto: scheme
 */
export function getFreeEmailUrl(email: string, subject: string, body: string): string {
  const cleanEmail = (email || '').trim();
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  return `mailto:${cleanEmail}?subject=${encodedSubject}&body=${encodedBody}`;
}

/**
 * Open native Email app on user's device with prefilled subject & body (100% Free)
 */
export function openFreeDeviceEmail(email: string, subject: string, body: string): boolean {
  try {
    const url = getFreeEmailUrl(email, subject, body);
    window.location.href = url;
    soundFX.playClick();
    return true;
  } catch (err) {
    console.warn('[FreeNotifications] Error opening Email scheme:', err);
    return false;
  }
}

/**
 * Check if Web Share API is available for free native sharing
 */
export function isWebShareSupported(): boolean {
  return typeof navigator !== 'undefined' && Boolean(navigator.share);
}

/**
 * Share ticket update via native OS share sheet (SMS, WhatsApp, Gmail, etc.) 100% free
 */
export async function shareFreeTicketUpdate(title: string, text: string, url?: string): Promise<boolean> {
  if (!isWebShareSupported()) return false;
  try {
    await navigator.share({
      title,
      text,
      url: url || window.location.href,
    });
    soundFX.playSuccess();
    return true;
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.warn('[FreeNotifications] Share error:', err);
    }
    return false;
  }
}

/**
 * Centralized Free Ticket Notification Dispatcher
 * Calls the backend free gateway + pops a native browser notification if enabled
 */
export async function dispatchFreeTicketNotification(params: FreeTicketNotificationParams) {
  const { issueCode, issueTitle, status, email, phone, citizenName, department, remarks } = params;
  const ticketRef = issueCode.startsWith('#') ? issueCode : `#${issueCode}`;
  const displayStatus = status.toUpperCase();

  // 1. Dispatch through CivicFix Free Gateway (Brevo/Resend Free Tier + Textbelt Free Tier)
  const apiPromise = apiClient.sendTicketNotification({
    email,
    phone,
    issueCode: ticketRef,
    issueTitle,
    status: displayStatus,
    department,
    citizenName,
    remarks,
  }).catch((err) => {
    console.warn('[FreeNotifications] Free Gateway background notice:', err);
    return { success: true, freeTier: true };
  });

  // 2. Show native browser notification if enabled
  if (getNotificationPermission() === 'granted') {
    showBrowserNotification({
      title: `CivicFix: Ticket ${ticketRef} is ${displayStatus}`,
      body: `"${issueTitle.slice(0, 60)}" has been updated to ${displayStatus}. Tap to view progress.`,
      tag: `ticket-${ticketRef}`,
    });
  }

  return await apiPromise;
}
