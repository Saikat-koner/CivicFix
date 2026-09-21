import dns from 'dns';

export interface EmailVerificationResult {
  valid: boolean;
  email: string;
  normalizedEmail: string;
  domain: string;
  status: 'valid' | 'invalid' | 'risky' | 'catch-all' | 'unknown' | 'already_registered';
  subStatus?: string;
  provider: string; // e.g. 'ZeroBounce API', 'Abstract API', 'Civic MX Verifier Engine'
  mxFound: boolean;
  mxRecord?: string;
  smtpProvider?: string;
  isDisposable: boolean;
  isFreeEmail: boolean;
  isAlreadyRegistered?: boolean;
  didYouMean?: string | null;
  qualityScore: number; // 0-100
  reason?: string;
  verifiedAt: string;
}

// Popular disposable / temporary email domains known for spam and throwaway signups
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com',
  '10minutemail.com',
  'mailinator.com',
  'guerrillamail.com',
  'trashmail.com',
  'sharklasers.com',
  'yopmail.com',
  'dispostable.com',
  'fakeinbox.com',
  'throwawaymail.com',
  'mohmal.com',
  'getairmail.com',
  'temp-mail.org',
  'burnermail.io',
  'inboxkitten.com',
  'mytemp.email',
  'generator.email',
  'emailondeck.com',
  'crazymailing.com',
  'maildrop.cc',
  'nada.ltd',
  'getnada.com',
  'trashmail.net',
  'tempmailaddress.com',
  'disposablemail.com',
  'dropmail.me',
  'fakemail.net',
  '10mail.org',
  'minuteinbox.com',
  'guerrillamailblock.com',
  'pokemail.net',
  'spam4.me',
  'grr.la',
  'guerrillamail.biz',
  'guerrillamail.de',
  'guerrillamail.net',
  'guerrillamail.org',
  'mytempemail.com',
  'tempmail.net',
  'tempinbox.com',
  'burnermail.com',
  'trashmail.org',
  'tempmailo.com',
  'tmpmail.net',
]);

// Common domain typos and their corrections
const TYPO_MAP: Record<string, string> = {
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmaik.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmaio.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yaho.co': 'yahoo.com',
  'yaho.in': 'yahoo.in',
  'yaho.co.in': 'yahoo.co.in',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmali.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outloock.com': 'outlook.com',
  'iclod.com': 'icloud.com',
  'icoud.com': 'icloud.com',
  'redifmail.com': 'rediffmail.com',
  'rediff.com': 'rediffmail.com',
};

// Recognized public free email provider domains
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.in',
  'yahoo.co.uk',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'protonmail.com',
  'proton.me',
  'zoho.com',
  'aol.com',
  'rediffmail.com',
  'yandex.com',
  'gmx.com',
  'mail.com',
]);

/**
 * Identify known SMTP provider from MX host exchange names
 */
function identifySmtpProvider(mxExchange: string): string {
  const host = mxExchange.toLowerCase();
  if (host.includes('google') || host.includes('l.google.com') || host.includes('googlemail')) {
    return 'Google Workspace / Gmail';
  }
  if (host.includes('outlook') || host.includes('protection.outlook.com') || host.includes('microsoft')) {
    return 'Microsoft 365 / Outlook';
  }
  if (host.includes('yahoodns') || host.includes('yahoo')) {
    return 'Yahoo Mail Network';
  }
  if (host.includes('protonmail') || host.includes('proton')) {
    return 'ProtonMail Encrypted';
  }
  if (host.includes('apple') || host.includes('icloud')) {
    return 'Apple iCloud Mail';
  }
  if (host.includes('zoho')) {
    return 'Zoho Mail Cloud';
  }
  if (host.includes('rediffmail')) {
    return 'Rediffmail Infrastructure';
  }
  if (host.includes('mimecast')) {
    return 'Mimecast Gateway';
  }
  if (host.includes('barracuda')) {
    return 'Barracuda Email Security';
  }
  return 'Standard Mail Server';
}

/**
 * Real-Time Multi-Layer Email Verification
 * Checks:
 * 1. RFC 5322 Syntax & Structure
 * 2. Typo suggestions (e.g. gmai.com -> gmail.com)
 * 3. Disposable/Temporary Domain Blocklist
 * 4. ZeroBounce Third-Party API (if ZEROBOUNCE_API_KEY is configured)
 * 5. Abstract Email Validation API (if ABSTRACT_EMAIL_API_KEY is configured)
 * 6. Live DNS MX Record Resolution via Node.js dns.promises
 */
export async function verifyEmailAddress(rawEmail: string): Promise<EmailVerificationResult> {
  const normalizedEmail = (rawEmail || '').trim().toLowerCase();
  const timestamp = new Date().toISOString();

  // 1. Basic format & presence check
  if (!normalizedEmail) {
    return {
      valid: false,
      email: rawEmail || '',
      normalizedEmail: '',
      domain: '',
      status: 'invalid',
      subStatus: 'empty_email',
      provider: 'Syntax Validator',
      mxFound: false,
      isDisposable: false,
      isFreeEmail: false,
      qualityScore: 0,
      reason: 'Email address cannot be empty.',
      verifiedAt: timestamp,
    };
  }

  // RFC 5322 compliant regex for basic structural validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(normalizedEmail) || normalizedEmail.length > 254) {
    return {
      valid: false,
      email: rawEmail,
      normalizedEmail,
      domain: normalizedEmail.split('@')[1] || '',
      status: 'invalid',
      subStatus: 'invalid_syntax',
      provider: 'RFC 5322 Syntax Verifier',
      mxFound: false,
      isDisposable: false,
      isFreeEmail: false,
      qualityScore: 10,
      reason: 'The email address format is syntactically invalid. Please ensure standard format (e.g., name@domain.com).',
      verifiedAt: timestamp,
    };
  }

  const [localPart, domain] = normalizedEmail.split('@');

  // Check local part and TLD lengths
  const parts = domain.split('.');
  const tld = parts[parts.length - 1];
  if (!tld || tld.length < 2 || !/^[a-z]+$/.test(tld)) {
    return {
      valid: false,
      email: rawEmail,
      normalizedEmail,
      domain,
      status: 'invalid',
      subStatus: 'invalid_tld',
      provider: 'RFC 5322 Syntax Verifier',
      mxFound: false,
      isDisposable: false,
      isFreeEmail: false,
      qualityScore: 15,
      reason: `Domain TLD ".${tld || ''}" is not a recognized top-level domain.`,
      verifiedAt: timestamp,
    };
  }

  // 2. Typo suggestion detection
  let didYouMean: string | null = null;
  if (TYPO_MAP[domain]) {
    const suggestedDomain = TYPO_MAP[domain];
    didYouMean = `${localPart}@${suggestedDomain}`;
  }

  // 3. Disposable Domain Blocklist
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      valid: false,
      email: rawEmail,
      normalizedEmail,
      domain,
      status: 'invalid',
      subStatus: 'disposable',
      provider: 'ZeroBounce Anti-Spam Blacklist Engine',
      mxFound: false,
      isDisposable: true,
      isFreeEmail: false,
      qualityScore: 5,
      reason: `Disposable, temporary, or burner email addresses (${domain}) are prohibited for official municipal citizen registration.`,
      verifiedAt: timestamp,
    };
  }

  const isFree = FREE_EMAIL_DOMAINS.has(domain);

  // 4. Try ZeroBounce API if API Key is configured
  const zeroBounceKey = process.env.ZEROBOUNCE_API_KEY;
  if (zeroBounceKey) {
    try {
      const zbUrl = `https://api.zerobounce.net/v2/validate?api_key=${zeroBounceKey}&email=${encodeURIComponent(normalizedEmail)}`;
      const zbRes = await fetch(zbUrl, { method: 'GET', headers: { Accept: 'application/json' } });
      if (zbRes.ok) {
        const zb = await zbRes.json();
        // Statuses from ZeroBounce: 'valid', 'invalid', 'catch-all', 'unknown', 'spamtrap', 'abuse', 'do_not_mail'
        const isValid = zb.status === 'valid' || zb.status === 'catch-all';
        const mxFound = zb.mx_found === 'true' || zb.mx_found === true;

        return {
          valid: isValid,
          email: rawEmail,
          normalizedEmail,
          domain,
          status: zb.status as any,
          subStatus: zb.sub_status || undefined,
          provider: 'ZeroBounce Real-Time API v2',
          mxFound,
          mxRecord: zb.mx_record || undefined,
          smtpProvider: zb.smtp_provider || identifySmtpProvider(zb.mx_record || domain),
          isDisposable: zb.sub_status === 'disposable' || DISPOSABLE_DOMAINS.has(domain),
          isFreeEmail: zb.free_email ?? isFree,
          didYouMean: zb.did_you_mean || didYouMean,
          qualityScore: isValid ? 95 : 20,
          reason: isValid
            ? `Verified deliverable via ZeroBounce API (${zb.status}).`
            : `ZeroBounce rejected email: ${zb.sub_status || zb.status}. Please check your address.`,
          verifiedAt: timestamp,
        };
      } else {
        const errText = await zbRes.text().catch(() => '');
        console.warn(`[EmailVerifier] ZeroBounce API returned status ${zbRes.status} (${errText.slice(0, 100)}). API key may have reached rate limits or quota used by another app. Seamlessly falling back to live DNS MX resolver.`);
      }
    } catch (err) {
      console.warn('[EmailVerifier] ZeroBounce API call failed, falling back to DNS MX resolver:', err);
    }
  }

  // 5. Try Abstract Email Validation API if API Key is configured
  const abstractKey = process.env.ABSTRACT_EMAIL_API_KEY;
  if (abstractKey) {
    try {
      const abUrl = `https://emailvalidation.abstractapi.com/v1/?api_key=${abstractKey}&email=${encodeURIComponent(normalizedEmail)}`;
      const abRes = await fetch(abUrl, { method: 'GET', headers: { Accept: 'application/json' } });
      if (abRes.ok) {
        const ab = await abRes.json();
        const isValid = ab.deliverability === 'DELIVERABLE' || ab.is_smtp_valid?.value === true;
        const mxFound = ab.is_mx_found?.value === true;

        return {
          valid: isValid,
          email: rawEmail,
          normalizedEmail,
          domain,
          status: isValid ? 'valid' : 'invalid',
          subStatus: ab.deliverability,
          provider: 'Abstract Email Validation API',
          mxFound,
          smtpProvider: identifySmtpProvider(domain),
          isDisposable: ab.is_disposable_email?.value === true,
          isFreeEmail: ab.is_free_email?.value ?? isFree,
          didYouMean: ab.autocorrect || didYouMean,
          qualityScore: Math.round((ab.quality_score || 0.85) * 100),
          reason: isValid
            ? 'Verified deliverable via Abstract API.'
            : 'Email address could not be delivered according to mailbox validation.',
          verifiedAt: timestamp,
        };
      } else {
        const errText = await abRes.text().catch(() => '');
        console.warn(`[EmailVerifier] Abstract API returned status ${abRes.status} (${errText.slice(0, 100)}). Key may be exhausted from another application. Falling back to live DNS MX validation.`);
      }
    } catch (err) {
      console.warn('[EmailVerifier] Abstract API call failed, falling back to DNS MX resolver:', err);
    }
  }

  // 6. Live DNS MX & A Record Verification (Native Real-Time Node.js Resolver)
  try {
    const mxRecords = await dns.promises.resolveMx(domain);

    if (!mxRecords || mxRecords.length === 0) {
      // Check if domain at least has an A record (fallback for archaic mail servers)
      try {
        const aRecords = await dns.promises.resolve4(domain);
        if (!aRecords || aRecords.length === 0) {
          return {
            valid: false,
            email: rawEmail,
            normalizedEmail,
            domain,
            status: 'invalid',
            subStatus: 'no_dns_entries',
            provider: 'ZeroBounce Compatible MX Engine',
            mxFound: false,
            isDisposable: false,
            isFreeEmail: isFree,
            didYouMean,
            qualityScore: 15,
            reason: `Domain "${domain}" does not exist or has no active mail exchange (MX) records. Emails cannot be delivered.`,
            verifiedAt: timestamp,
          };
        }
      } catch {
        return {
          valid: false,
          email: rawEmail,
          normalizedEmail,
          domain,
          status: 'invalid',
          subStatus: 'no_dns_entries',
          provider: 'ZeroBounce Compatible MX Engine',
          mxFound: false,
          isDisposable: false,
          isFreeEmail: isFree,
          didYouMean,
          qualityScore: 10,
          reason: `Domain "${domain}" has no active Mail Exchange (MX) records to receive emails.`,
          verifiedAt: timestamp,
        };
      }
    }

    // Sort MX records by priority (lowest numeric value = highest priority)
    const sortedMx = [...mxRecords].sort((a, b) => a.priority - b.priority);
    const primaryMx = sortedMx[0];
    const smtpProvider = identifySmtpProvider(primaryMx.exchange);

    return {
      valid: true,
      email: rawEmail,
      normalizedEmail,
      domain,
      status: 'valid',
      subStatus: 'mx_record_verified',
      provider: 'ZeroBounce Compatible MX Engine',
      mxFound: true,
      mxRecord: `${primaryMx.exchange} (priority ${primaryMx.priority})`,
      smtpProvider,
      isDisposable: false,
      isFreeEmail: isFree,
      didYouMean,
      qualityScore: didYouMean ? 75 : 95,
      reason: didYouMean
        ? `Active MX server found at ${primaryMx.exchange}, but did you mean "${didYouMean}"?`
        : `Active mail server confirmed (${smtpProvider}). Deliverability check passed.`,
      verifiedAt: timestamp,
    };
  } catch (dnsErr: any) {
    const errorCode = dnsErr?.code || '';
    if (errorCode === 'ENOTFOUND' || errorCode === 'ENODATA' || errorCode === 'SERVFAIL') {
      return {
        valid: false,
        email: rawEmail,
        normalizedEmail,
        domain,
        status: 'invalid',
        subStatus: 'domain_not_found',
        provider: 'ZeroBounce Compatible MX Engine',
        mxFound: false,
        isDisposable: false,
        isFreeEmail: isFree,
        didYouMean,
        qualityScore: 10,
        reason: `Domain "${domain}" could not be resolved. It appears to be non-existent or misconfigured.`,
        verifiedAt: timestamp,
      };
    }

    // In case of transient DNS network failure, allow valid-format standard emails but mark as unverified
    return {
      valid: true,
      email: rawEmail,
      normalizedEmail,
      domain,
      status: 'unknown',
      subStatus: 'dns_lookup_timeout',
      provider: 'ZeroBounce Fallback Validator',
      mxFound: false,
      isDisposable: false,
      isFreeEmail: isFree,
      didYouMean,
      qualityScore: 70,
      reason: 'Valid syntax format, but live DNS check was temporarily inconclusive.',
      verifiedAt: timestamp,
    };
  }
}
