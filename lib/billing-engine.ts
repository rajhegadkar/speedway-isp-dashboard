// Speedway Broadband Services - Billing & Due Date Calculation Engine

export interface BillingCycleOption {
  value: string;
  label: string;
  months: number;
}

export const BILLING_CYCLES: BillingCycleOption[] = [
  { value: 'Monthly', label: 'Monthly (1 Month)', months: 1 },
  { value: 'Quarterly', label: 'Quarterly (3 Months)', months: 3 },
  { value: 'Half-Yearly', label: 'Half-Yearly (6 Months)', months: 6 },
  { value: 'Yearly', label: 'Yearly (12 Months)', months: 12 },
  { value: 'Custom', label: 'Custom Days', months: 0 },
];

/**
 * Returns today's ISO date string (YYYY-MM-DD) in Asia/Kolkata timezone
 */
export function getTodayDateString(): string {
  // Use Intl to get date in Asia/Kolkata
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date()); // Returns YYYY-MM-DD
}

/**
 * Calculates days difference: (targetDate - today)
 * Negative means overdue by that many days.
 * 0 means due today.
 * Positive means due in that many days.
 */
export function getDaysDifference(targetDateStr: string, todayStr?: string): number {
  const today = todayStr || getTodayDateString();
  const dTarget = new Date(targetDateStr + 'T00:00:00Z');
  const dToday = new Date(today + 'T00:00:00Z');
  const diffTime = dTarget.getTime() - dToday.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Categorizes client due date status
 */
export function getDueStatusCategory(dueDateStr: string, paymentStatus: string): {
  badge: 'PAID' | 'DUE_TODAY' | 'DUE_TOMORROW' | 'DUE_3D' | 'DUE_7D' | 'OVERDUE_1_7' | 'OVERDUE_8_15' | 'OVERDUE_15_PLUS' | 'UPCOMING';
  label: string;
  daysDiff: number;
  colorClass: string;
} {
  if (paymentStatus === 'PAID') {
    return {
      badge: 'PAID',
      label: 'Paid',
      daysDiff: 0,
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }

  const daysDiff = getDaysDifference(dueDateStr);

  if (daysDiff < 0) {
    const overdueDays = Math.abs(daysDiff);
    if (overdueDays <= 7) {
      return {
        badge: 'OVERDUE_1_7',
        label: `Overdue by ${overdueDays}d`,
        daysDiff,
        colorClass: 'bg-red-50 text-red-700 border-red-200 font-medium',
      };
    } else if (overdueDays <= 15) {
      return {
        badge: 'OVERDUE_8_15',
        label: `Overdue by ${overdueDays}d`,
        daysDiff,
        colorClass: 'bg-red-100 text-red-800 border-red-300 font-semibold',
      };
    } else {
      return {
        badge: 'OVERDUE_15_PLUS',
        label: `Critical: Overdue ${overdueDays}d`,
        daysDiff,
        colorClass: 'bg-rose-600 text-white border-rose-700 font-bold animate-pulse',
      };
    }
  } else if (daysDiff === 0) {
    return {
      badge: 'DUE_TODAY',
      label: 'Due Today',
      daysDiff,
      colorClass: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
    };
  } else if (daysDiff === 1) {
    return {
      badge: 'DUE_TOMORROW',
      label: 'Due Tomorrow',
      daysDiff,
      colorClass: 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
    };
  } else if (daysDiff <= 3) {
    return {
      badge: 'DUE_3D',
      label: `Due in ${daysDiff} days`,
      daysDiff,
      colorClass: 'bg-orange-50 text-orange-700 border-orange-200',
    };
  } else if (daysDiff <= 7) {
    return {
      badge: 'DUE_7D',
      label: `Due in ${daysDiff} days`,
      daysDiff,
      colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
    };
  } else {
    return {
      badge: 'UPCOMING',
      label: `Due in ${daysDiff} days`,
      daysDiff,
      colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  }
}

/**
 * Advances the next due date based on billing cycle rules.
 * Never resets anchor day of month for monthly cycles.
 */
export function calculateNextDueDate(
  currentDueDateStr: string,
  billingCycle: string,
  customDays?: number
): string {
  const parts = currentDueDateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-based
  const day = parseInt(parts[2], 10);

  const curDate = new Date(Date.UTC(year, month, day));

  if (billingCycle === 'Custom' && customDays && customDays > 0) {
    curDate.setUTCDate(curDate.getUTCDate() + customDays);
    return curDate.toISOString().split('T')[0];
  }

  let monthsToAdd = 1;
  if (billingCycle === 'Quarterly') monthsToAdd = 3;
  if (billingCycle === 'Half-Yearly') monthsToAdd = 6;
  if (billingCycle === 'Yearly') monthsToAdd = 12;

  // Add months while preserving anchor day
  const targetMonth = curDate.getUTCMonth() + monthsToAdd;
  curDate.setUTCMonth(targetMonth);

  // If day overflowed (e.g. Feb 31 -> Mar 3), roll back to last day of target month
  if (curDate.getUTCDate() !== day) {
    curDate.setUTCDate(0);
  }

  return curDate.toISOString().split('T')[0];
}

/**
 * Generate formatted INR currency string
 */
export function formatINR(amount: number): string {
  const isWhole = Number(amount) % 1 === 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: isWhole ? 0 : 2,
  }).format(amount);
}

/**
 * Ready-to-send reminder message composer
 */
export function composeReminderMessage(
  type: 'UPCOMING' | 'DUE_TODAY' | 'OVERDUE' | 'CONFIRMATION' | 'RENEWAL',
  data: {
    customerName: string;
    amount: number;
    dueDate: string;
    invoiceNo?: string;
    pgName?: string;
    planName?: string;
  }
): { message: string; whatsappUrl: string } {
  const ispName = 'Speedway Broadband Services';
  const helpline = '+91 98765 43210';
  let message = '';

  const formattedAmount = formatINR(data.amount);

  switch (type) {
    case 'UPCOMING':
      message = `Hello ${data.customerName}, your internet bill for plan ${data.planName || 'Broadband'} of ${formattedAmount} is due on ${data.dueDate}. Please make the payment on time to enjoy uninterrupted high-speed internet. You can pay via UPI to speedwaybroadband@upi or contact your local collection point (${data.pgName || 'Main Office'}). Thank you, ${ispName}. Helpline: ${helpline}`;
      break;
    case 'DUE_TODAY':
      message = `*URGENT: Bill Due Today*\nHello ${data.customerName}, your broadband bill of ${formattedAmount} (Inv #${data.invoiceNo || 'PENDING'}) is due TODAY (${data.dueDate}). Kindly complete the payment before 9:00 PM to avoid late fee charges or automated speed throttling. Thank you, ${ispName}. Support: ${helpline}`;
      break;
    case 'OVERDUE':
      message = `*OVERDUE NOTICE: Action Required*\nDear ${data.customerName}, your internet subscription payment of ${formattedAmount} is OVERDUE (Due date was: ${data.dueDate}). To prevent temporary disconnection of your optical fiber link, please clear the dues immediately. Contact ${data.pgName || 'Speedway Support'} at ${helpline}. Thank you, ${ispName}.`;
      break;
    case 'CONFIRMATION':
      message = `*Payment Received Successfully!*\nDear ${data.customerName}, we have received your payment of ${formattedAmount} towards invoice #${data.invoiceNo || ''}. Your high-speed connection is active. Next billing due date: ${data.dueDate}. Thank you for choosing ${ispName}!`;
      break;
    case 'RENEWAL':
      message = `Hello ${data.customerName}, your internet plan *${data.planName || ''}* expires today (${data.dueDate}). Renew today for uninterrupted connectivity and enjoy Speedway Gigabit speeds. Amount: ${formattedAmount}. ${ispName} - ${helpline}`;
      break;
  }

  const encoded = encodeURIComponent(message);
  return {
    message,
    whatsappUrl: `https://api.whatsapp.com/send?phone=${data.customerName}&text=${encoded}`, // Will replace with phone
  };
}

/**
 * Generates an NPCI-compliant UPI payment intent URL with exact pre-filled amount
 * Format: upi://pay?pa={UPI_ID}&pn={NAME}&am={AMOUNT}&cu=INR&tn={NOTE}&tr={REF}
 */
export function generateUpiPaymentUrl(params: {
  upiId: string;
  payeeName: string;
  amount: number;
  invoiceId: string;
  customerName?: string;
}): string {
  const cleanUpi = (params.upiId || 'speedwaybroadband@icici').trim();
  const cleanName = encodeURIComponent((params.payeeName || 'Speedway Broadband Services').trim());
  const formattedAmount = Number(params.amount || 0).toFixed(2);
  const note = encodeURIComponent(`Bill ${params.invoiceId}${params.customerName ? ` ${params.customerName}` : ''}`.slice(0, 50));
  const ref = encodeURIComponent(params.invoiceId);

  return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${formattedAmount}&cu=INR&tn=${note}&tr=${ref}`;
}

export interface TimeGreetingInfo {
  greeting: string;
  fullGreeting: string;
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  pulseLabel: string;
  timeString: string;
}

/**
 * Returns time-of-day greeting, shift indicator, and action pulse label
 * - Morning: 04:00 - 11:59 -> "Good Morning! Here is your daily collection briefing."
 * - Afternoon: 12:00 - 16:59 -> "Good Afternoon! Here is your daily collection briefing."
 * - Evening: 17:00 - 20:59 -> "Good Evening! Here is your daily collection briefing."
 * - Night: 21:00 - 03:59 -> "Good Night! Here is your night collection briefing."
 */
export function getTimeGreeting(date: Date = new Date()): TimeGreetingInfo {
  const hours = date.getHours();

  if (hours >= 4 && hours < 12) {
    return {
      greeting: 'Good Morning!',
      fullGreeting: 'Good Morning! Here is your daily collection briefing.',
      period: 'morning',
      pulseLabel: 'Morning Action Pulse',
      timeString: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
  } else if (hours >= 12 && hours < 17) {
    return {
      greeting: 'Good Afternoon!',
      fullGreeting: 'Good Afternoon! Here is your daily collection briefing.',
      period: 'afternoon',
      pulseLabel: 'Afternoon Action Pulse',
      timeString: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
  } else if (hours >= 17 && hours < 21) {
    return {
      greeting: 'Good Evening!',
      fullGreeting: 'Good Evening! Here is your daily collection briefing.',
      period: 'evening',
      pulseLabel: 'Evening Action Pulse',
      timeString: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
  } else {
    return {
      greeting: 'Good Night!',
      fullGreeting: 'Good Night! Here is your night collection briefing.',
      period: 'night',
      pulseLabel: 'Night Action Pulse',
      timeString: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
  }
}

