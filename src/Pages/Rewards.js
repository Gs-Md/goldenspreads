import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { authClient } from "../lib/authClient";
import { loyaltyRequest } from "../lib/loyaltyApi";

import "../Styles/Rewards.css";

// ======================================================
// GOLDEN SPREADS REWARDS
//
// NEW CUSTOMER:
// Register -> Verify email -> Golden Wallet
//
// RETURNING CUSTOMER:
// Sign in -> Login OTP -> Golden Wallet
//
// Authentication and MFA are verified by the backend.
// ======================================================

const PENDING_EMAIL = "goldenPendingVerificationEmail";
const PENDING_PHONE = "goldenPendingPhone";

// ======================================================
// HELPERS
// ======================================================

function cleanEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getErrorMessage(error, fallback) {
  return error?.message || fallback;
}

function isVerificationError(error) {
  const details = [
    error?.message,
    error?.code,
    error?.data?.message,
    error?.data?.code,
  ]
    .filter(Boolean)
    .join(" ");

  return /email.?verif|verif.*email|verify.*email|verification required|EMAIL_NOT_VERIFIED/i.test(
    details,
  );
}

// ======================================================
// NOT CONFIGURED
// ======================================================

function SetupMessage() {
  return (
    <main className="rewards-page">
      <section className="rewards-panel rewards-notice">
        <span className="rewards-eyebrow">GOLDEN SPREADS</span>

        <h1>Golden Rewards is almost ready</h1>

        <p>The public Neon Auth URL has not been configured.</p>

        <Link className="rewards-button" to="/">
          Back to Golden Spreads
        </Link>
      </section>
    </main>
  );
}

// ======================================================
// SIGN OUT
// ======================================================

async function clearAuthSession() {
  await fetch("/api/loyalty/auth/logout", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
  }).catch(() => {});

  const result = await authClient.signOut();

  if (result?.error) {
    throw new Error(result.error.message || "Unable to sign out.");
  }
}

// ======================================================
// FINISH-SIGNUP API
// ======================================================

async function finishSignupRequest(action, data = {}) {
  const response = await fetch("/api/loyalty/auth/finish-signup", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action,
      ...data,
    }),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.error) {
    throw new Error(result.error || "Unable to complete account verification.");
  }

  return result;
}

// ======================================================
// CREATE ACCOUNT / SIGN IN
// ======================================================

function AuthForm({
  initialMode = "signup",
  notice = "",
  resetBusy = false,
  onResetSession,
  onSignupStarted,
  onSignupEnded,
  onVerificationNeeded,
  onAuthSuccess,
}) {
  const [mode, setMode] = useState(initialMode);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const emailAddress = cleanEmail(email);

  // --------------------------------------------------
  // CONTINUE AN EXISTING UNVERIFIED REGISTRATION
  // --------------------------------------------------

  function continueVerification() {
    if (!validEmail(emailAddress)) {
      setError("Enter a valid email address first.");
      return;
    }

    setError("");
    setMessage("");

    sessionStorage.setItem(PENDING_EMAIL, emailAddress);

    onVerificationNeeded(emailAddress, password);
  }

  // --------------------------------------------------
  // SUBMIT SIGNUP OR SIGNIN
  // --------------------------------------------------

  async function handleSubmit(event) {
    event.preventDefault();

    if (busy) return;

    setBusy(true);
    setError("");
    setMessage("");

    const signingUp = mode === "signup";

    if (signingUp) {
      onSignupStarted(password);
    }

    try {
      if (!validEmail(emailAddress)) {
        throw new Error("Enter a valid email address.");
      }

      // ==============================================
      // NEW ACCOUNT
      // ==============================================

      if (signingUp) {
        if (!name.trim()) {
          throw new Error("Enter your full name.");
        }

        const result = await authClient.signUp.email({
          name: name.trim(),
          email: emailAddress,
          password,
        });

        if (result?.error) {
          throw new Error(
            result.error.message || "Unable to create your account.",
          );
        }

        if (phone.trim()) {
          sessionStorage.setItem(PENDING_PHONE, phone.trim());
        }

        // Keep verification pending across a refresh.
        sessionStorage.setItem(PENDING_EMAIL, emailAddress);

        setPassword("");

        // Directly show the six-digit code screen.
        onVerificationNeeded(emailAddress, password);
        return;
      }

      // ==============================================
      // RETURNING CUSTOMER
      // ==============================================

      const result = await authClient.signIn.email({
        email: emailAddress,
        password,
      });

      if (result?.error) {
        const authError = new Error(result.error.message || "Sign in failed.");

        authError.code = result.error.code;
        throw authError;
      }

      // Existing customers still require backend MFA.
      onAuthSuccess(password);
    } catch (err) {
      if (!signingUp && isVerificationError(err)) {
        sessionStorage.setItem(PENDING_EMAIL, emailAddress);

        onVerificationNeeded(emailAddress, password);
      } else {
        setError(getErrorMessage(err, "Unable to complete this request."));
      }
    } finally {
      if (signingUp) {
        onSignupEnded();
      }

      setBusy(false);
    }
  }

  // --------------------------------------------------
  // INTERFACE
  // --------------------------------------------------

  return (
    <section className="rewards-auth-card">
      <div className="rewards-card-heading">
        <span className="rewards-eyebrow">GOLDEN SPREADS REWARDS</span>

        <h1>{mode === "signup" ? "Join Golden Rewards" : "Welcome back"}</h1>

        <p>
          {mode === "signup"
            ? "Create your account and start collecting points with your purchases."
            : "Sign in to access your Golden Wallet."}
        </p>
      </div>

      <div className="rewards-tabs" role="tablist" aria-label="Account access">
        <button
          type="button"
          disabled={busy}
          className={mode === "signup" ? "active" : ""}
          onClick={() => {
            setMode("signup");
            setError("");
            setMessage("");
          }}
        >
          Create account
        </button>

        <button
          type="button"
          disabled={busy}
          className={mode === "signin" ? "active" : ""}
          onClick={() => {
            setMode("signin");
            setError("");
            setMessage("");
          }}
        >
          Sign in
        </button>
      </div>

      {notice && (
        <p className="rewards-alert error" role="alert">
          {notice}
        </p>
      )}

      {onResetSession && (
        <button
          type="button"
          className="rewards-text-button"
          disabled={busy || resetBusy}
          onClick={onResetSession}
        >
          {resetBusy
            ? "Clearing previous session..."
            : "Clear previous session"}
        </button>
      )}

      <form className="rewards-form" onSubmit={handleSubmit}>
        {mode === "signup" && (
          <>
            <label>
              Full name
              <input
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                required
                placeholder="Your full name"
              />
            </label>

            <label>
              Phone number <span className="rewards-optional">(optional)</span>
              <input
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                maxLength={40}
                placeholder="WhatsApp / phone number"
              />
            </label>
          </>
        )}

        <label>
          Email address
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            maxLength={254}
            required
            placeholder="you@example.com"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            maxLength={128}
            required
            placeholder="At least 8 characters"
          />
        </label>

        {error && (
          <p className="rewards-alert error" role="alert">
            {error}
          </p>
        )}

        {message && (
          <p className="rewards-alert success" role="status">
            {message}
          </p>
        )}

        <button type="submit" className="rewards-button full" disabled={busy}>
          {busy
            ? "Please wait..."
            : mode === "signup"
              ? "Create my Golden Wallet"
              : "Sign in"}
        </button>
      </form>

      <div
        style={{
          textAlign: "center",
          marginTop: "16px",
        }}
      >
        <p className="rewards-small">
          Already received a six-digit verification code?
        </p>

        <button
          type="button"
          className="rewards-text-button"
          disabled={busy || !emailAddress}
          onClick={continueVerification}
        >
          Continue email verification
        </button>
      </div>

      <p className="rewards-terms">
        Your account is for loyalty points only. Orders and payments continue
        through WhatsApp, Instagram, phone, or in person.
      </p>
    </section>
  );
}

// ======================================================
// VERIFY EMAIL AND AUTOMATICALLY OPEN WALLET
// ======================================================

function SignupVerification({ email, initialPassword = "", onBack }) {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState(initialPassword);

  const [emailVerified, setEmailVerified] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // --------------------------------------------------
  // COMPLETE SIGNUP SESSION
  // --------------------------------------------------

  async function completeSignup(accountPassword) {
    if (!accountPassword) {
      setNeedsPassword(true);
      setMessage("Email verified. Enter your account password to finish.");
      return;
    }

    // The customer already chose this password when
    // registering. This happens automatically during
    // a normal new signup.
    const signInResult = await authClient.signIn.email({
      email,
      password: accountPassword,
    });

    if (signInResult?.error) {
      throw new Error(
        signInResult.error.message || "Unable to complete your sign-in.",
      );
    }

    // The backend checks the actual Neon session and
    // the signed proof of successful email verification.
    const result = await loyaltyRequest("/api/loyalty/auth/finish-signup", {
      method: "POST",
      body: JSON.stringify({
        action: "complete",
      }),
    });

    if (!result.authenticated) {
      throw new Error("Your account could not be fully activated.");
    }

    // Only clear the pending registration after
    // the backend has authenticated it successfully.
    sessionStorage.removeItem(PENDING_EMAIL);

    setPassword("");
    setMessage("Welcome to Golden Rewards!");

    // Refresh session state and go directly to wallet.
    // No second login OTP is requested.
    window.location.reload();
  }

  // --------------------------------------------------
  // VERIFY SIX-DIGIT EMAIL CODE
  // --------------------------------------------------

  async function verifyEmail(event) {
    event.preventDefault();

    if (busy || !/^\d{6}$/.test(code)) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const result = await finishSignupRequest("verify", {
        email,
        code,
      });

      if (!result.verified) {
        throw new Error("Email verification was not completed.");
      }

      setEmailVerified(true);
      setCode("");

      // The code was accepted by Neon on the server.
      // No second email verification is necessary.
      if (!password) {
        setNeedsPassword(true);
        setMessage("Email verified. Enter your password to open your wallet.");
        return;
      }

      setMessage("Email verified. Opening your Golden Wallet...");

      await completeSignup(password);
    } catch (err) {
      setError(getErrorMessage(err, "Verification failed. Try again."));

      // If the email OTP was accepted but session
      // completion failed, don't ask for the same
      // already-consumed OTP again.
      if (emailVerified) {
        setNeedsPassword(true);
      }
    } finally {
      setBusy(false);
    }
  }

  // --------------------------------------------------
  // RETRY COMPLETION USING PASSWORD
  // --------------------------------------------------

  async function continueSignup(event) {
    event.preventDefault();

    if (busy) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await completeSignup(password);
    } catch (err) {
      setNeedsPassword(true);
      setError(
        getErrorMessage(err, "Unable to finish your registration.") +
          " If verification has expired, return to sign in and complete the normal login verification.",
      );
    } finally {
      setBusy(false);
    }
  }

  // --------------------------------------------------
  // RESEND EMAIL VERIFICATION CODE
  // --------------------------------------------------

  async function resendCode() {
    if (busy || emailVerified) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });

      if (result?.error) {
        throw new Error(
          result.error.message || "Unable to send verification code.",
        );
      }

      setCode("");

      setMessage(
        "A new verification code was requested. Check your inbox and spam folder.",
      );
    } catch (err) {
      setError(getErrorMessage(err, "Unable to resend the code."));
    } finally {
      setBusy(false);
    }
  }

  // --------------------------------------------------
  // INTERFACE
  // --------------------------------------------------

  return (
    <section className="rewards-auth-card">
      <div className="rewards-card-heading">
        <span className="rewards-eyebrow">GOLDEN SPREADS REWARDS</span>

        <h1>
          {emailVerified ? "Complete your Golden Wallet" : "Verify your email"}
        </h1>

        <p>
          {emailVerified
            ? "Your email has been verified successfully."
            : "Enter the six-digit code sent to your email."}
        </p>

        <p>
          <strong>{email}</strong>
        </p>
      </div>

      {error && (
        <p className="rewards-alert error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="rewards-alert success" role="status">
          {message}
        </p>
      )}

      {!emailVerified ? (
        <>
          <form className="rewards-form" onSubmit={verifyEmail}>
            <label>
              Six-digit verification code
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                value={code}
                placeholder="000000"
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
              />
            </label>

            <button
              type="submit"
              className="rewards-button full"
              disabled={busy || code.length !== 6}
            >
              {busy
                ? "Verifying your account..."
                : "Verify and open Golden Wallet"}
            </button>
          </form>

          <button
            type="button"
            className="rewards-text-button"
            disabled={busy}
            onClick={resendCode}
          >
            Resend verification code
          </button>
        </>
      ) : (
        <form className="rewards-form" onSubmit={continueSignup}>
          {needsPassword && (
            <label>
              Your account password
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                maxLength={128}
                required
                placeholder="Enter your password"
              />
            </label>
          )}

          <button
            type="submit"
            className="rewards-button full"
            disabled={busy || (needsPassword && password.length < 8)}
          >
            {busy ? "Opening wallet..." : "Continue to Golden Wallet"}
          </button>
        </form>
      )}

      <button
        type="button"
        className="rewards-text-button"
        disabled={busy}
        onClick={onBack}
      >
        Back to sign in
      </button>

      <p className="rewards-terms">
        Your Golden Wallet is protected with secure email verification.
      </p>
    </section>
  );
}

// ======================================================
// RETURNING CUSTOMER — LOGIN MFA
// ======================================================

function LoginVerification({ initialPassword = "", onVerified }) {
  const [password, setPassword] = useState(initialPassword);

  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const started = useRef(false);

  // --------------------------------------------------
  // SEND LOGIN OTP
  // --------------------------------------------------

  async function sendLoginCode(candidatePassword) {
    if (!candidatePassword || candidatePassword.length < 8) {
      setError("Enter your password first.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const result = await loyaltyRequest("/api/loyalty/auth/start", {
        method: "POST",
        body: JSON.stringify({
          password: candidatePassword,
        }),
      });

      if (!result.challengeId) {
        throw new Error("Unable to create login verification.");
      }

      setChallengeId(result.challengeId);
      setCode("");

      setMessage(result.message || "Check your email for the login code.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to send login code."));
    } finally {
      setBusy(false);
    }
  }

  // Automatically request OTP after sign-in.
  useEffect(() => {
    if (initialPassword && !started.current) {
      started.current = true;
      sendLoginCode(initialPassword);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPassword]);

  // --------------------------------------------------
  // VERIFY LOGIN OTP
  // --------------------------------------------------

  async function verifyLogin(event) {
    event.preventDefault();

    if (busy || !/^\d{6}$/.test(code)) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const result = await loyaltyRequest("/api/loyalty/auth/verify", {
        method: "POST",
        body: JSON.stringify({
          challengeId,
          code,
        }),
      });

      if (!result.authenticated) {
        throw new Error("Login verification was not completed.");
      }

      setPassword("");
      setCode("");

      onVerified();
    } catch (err) {
      setError(getErrorMessage(err, "Incorrect or expired login code."));
    } finally {
      setBusy(false);
    }
  }

  // --------------------------------------------------
  // INTERFACE
  // --------------------------------------------------

  return (
    <section className="rewards-auth-card">
      <span className="rewards-eyebrow">GOLDEN SPREADS REWARDS</span>

      <h1>Confirm your login</h1>

      <p>Enter the new verification code sent to your email.</p>

      {error && (
        <p className="rewards-alert error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="rewards-alert success" role="status">
          {message}
        </p>
      )}

      {!challengeId ? (
        <form
          className="rewards-form"
          onSubmit={(event) => {
            event.preventDefault();
            sendLoginCode(password);
          }}
        >
          <label>
            Confirm password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              maxLength={128}
              required
            />
          </label>

          <button type="submit" className="rewards-button full" disabled={busy}>
            {busy ? "Sending code..." : "Send login code"}
          </button>
        </form>
      ) : (
        <>
          <form className="rewards-form" onSubmit={verifyLogin}>
            <label>
              Six-digit login code
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                required
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
              />
            </label>

            <button
              type="submit"
              className="rewards-button full"
              disabled={busy || code.length !== 6}
            >
              {busy ? "Verifying..." : "Verify and open wallet"}
            </button>
          </form>

          <button
            type="button"
            className="rewards-text-button"
            disabled={busy}
            onClick={() => sendLoginCode(password)}
          >
            Resend login code
          </button>
        </>
      )}

      <button
        type="button"
        className="rewards-text-button"
        disabled={busy}
        onClick={async () => {
          try {
            await clearAuthSession();
            window.location.reload();
          } catch (err) {
            setError(getErrorMessage(err, "Unable to sign out."));
          }
        }}
      >
        Sign out
      </button>
    </section>
  );
}

// ======================================================
// GOLDEN WALLET
// ======================================================

// ==================================================
// REDEMPTION REQUEST RECOVERY
// ==================================================

const REDEMPTION_REQUEST_ID_PATTERN =
  /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

function createRedemptionRequestId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);

  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

function redemptionStorageKey(userId) {
  return `goldenRewardsPendingRedemption:${userId}`;
}

function readPendingRedemptionId(userId) {
  try {
    const id = localStorage.getItem(redemptionStorageKey(userId));

    return REDEMPTION_REQUEST_ID_PATTERN.test(id || "") ? id : null;
  } catch {
    return null;
  }
}

function savePendingRedemptionId(userId, requestId) {
  try {
    const key = redemptionStorageKey(userId);
    const existing = localStorage.getItem(key);

    if (REDEMPTION_REQUEST_ID_PATTERN.test(existing || "")) {
      return existing;
    }

    localStorage.setItem(key, requestId);

    return requestId;
  } catch {
    return null;
  }
}

function clearPendingRedemptionId(userId, requestId) {
  try {
    const key = redemptionStorageKey(userId);
    const existing = localStorage.getItem(key);

    if (existing && existing !== requestId) {
      return false;
    }

    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function Wallet({ session, onReturnToSignIn }) {
  const [wallet, setWallet] = useState(null);
  const [phone, setPhone] = useState("");

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  // Restore unfinished redemption after a page refresh.
  const [pendingRedemptionId, setPendingRedemptionId] = useState(() =>
    readPendingRedemptionId(session.user.id),
  );

  // Prevent simultaneous redemption submissions.
  const redeemingRef = useRef(false);
  // --------------------------------------------------
  // LOAD WALLET
  // --------------------------------------------------

  async function loadWallet() {
    const data = await loyaltyRequest("/api/loyalty/me");

    if (!data?.account) {
      throw new Error("Invalid wallet response from the server.");
    }

    setWallet(data);
    setPhone(data.account.phone || "");
    setError("");
    setErrorStatus(null);
  }

  // --------------------------------------------------
  // INITIAL WALLET LOAD
  // --------------------------------------------------

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const pendingPhone = sessionStorage.getItem(PENDING_PHONE);

        if (pendingPhone) {
          await loyaltyRequest("/api/loyalty/profile", {
            method: "POST",
            body: JSON.stringify({
              phone: pendingPhone,
            }),
          });

          sessionStorage.removeItem(PENDING_PHONE);
        }

        const data = await loyaltyRequest("/api/loyalty/me");

        if (!data?.account) {
          throw new Error("Invalid wallet response from the server.");
        }

        if (active) {
          setWallet(data);
          setPhone(data.account.phone || "");
          setError("");
          setErrorStatus(null);
        }

        try {
          await loyaltyRequest("/api/loyalty/admin/status");

          if (active) {
            setIsAdmin(true);
          }
        } catch (adminError) {
          if (active && adminError.status === 403) {
            setIsAdmin(false);
          }
        }
      } catch (err) {
        if (active) {
          setError(getErrorMessage(err, "Could not load your wallet."));

          setErrorStatus(err.status || null);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [session.user.id]);

  // --------------------------------------------------
  // RETURN TO SIGN IN
  // --------------------------------------------------

  async function returnToSignIn() {
    setBusy(true);
    setError("");

    let notice = "Please sign in with your existing account.";

    try {
      await clearAuthSession();

      notice = "Your previous session has been cleared. Sign in again.";
    } catch (err) {
      notice =
        "Unable to clear previous session: " +
        getErrorMessage(err, "Please try again.");
    }

    onReturnToSignIn(notice);
    setBusy(false);
  }

  // --------------------------------------------------
  // SAVE PHONE NUMBER
  // --------------------------------------------------

  async function savePhone(event) {
    event.preventDefault();

    setBusy(true);
    setError("");
    setErrorStatus(null);
    setMessage("");

    try {
      await loyaltyRequest("/api/loyalty/profile", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });

      setMessage("Your contact number has been saved.");

      await loadWallet();
    } catch (err) {
      setError(getErrorMessage(err, "Could not save your phone number."));

      setErrorStatus(err.status || null);
    } finally {
      setBusy(false);
    }
  }

  // --------------------------------------------------
  // REDEEM POINTS
  // --------------------------------------------------

  // --------------------------------------------------
  // REDEEM POINTS - REFRESH SAFE
  // --------------------------------------------------

  async function redeemReward() {
  if (redeemingRef.current) return;

  redeemingRef.current = true;
  setBusy(true);
  setError('');
  setErrorStatus(null);
  setMessage('');

  let requestId = pendingRedemptionId;
  let redemptionConfirmed = false;
  let confirmedCode = '';

  try {
    if (!requestId) {
      requestId = createRedemptionRequestId();
    }

    const savedRequestId = savePendingRedemptionId(
      session.user.id,
      requestId
    );

    if (!savedRequestId) {
      throw new Error(
        'Unable to save redemption request. No request was sent.'
      );
    }

    requestId = savedRequestId;
    setPendingRedemptionId(requestId);

    const result = await loyaltyRequest(
      '/api/loyalty/redeem',
      {
        method: 'POST',
        body: JSON.stringify({ requestId }),
      }
    );

    if (!result?.redemption?.redemption_code) {
      throw new Error(
        'No reward code returned. Retry using the same request.'
      );
    }

    // Redemption is now confirmed.
    redemptionConfirmed = true;
    confirmedCode = result.redemption.redemption_code;

    const cleared = clearPendingRedemptionId(
      session.user.id,
      requestId
    );

    if (cleared) {
      setPendingRedemptionId(null);
    }

    setMessage(
      `Your $1 reward code is ${confirmedCode}. ` +
      'Show it to Golden Spreads when placing your next order. ' +
      'It expires in 30 days.'
    );

    const warnings = [];

    if (!cleared) {
      warnings.push(
        'The saved request could not be cleared. Retry the same request.'
      );
    }

    // Refresh wallet separately.
    try {
      await loadWallet();
    } catch (refreshError) {
      warnings.push(
        'Wallet refresh failed. Refresh the page to update your balance. ' +
        getErrorMessage(refreshError, '')
      );

      setErrorStatus(refreshError.status || null);
    }

    if (warnings.length) {
      setError(
        'Your reward was created successfully. ' +
        warnings.join(' ')
      );
    }

  } catch (err) {

    if (redemptionConfirmed) {
      setMessage(
        `Your $1 reward code is ${confirmedCode}. ` +
        'Show it to Golden Spreads when placing your next order. ' +
        'It expires in 30 days.'
      );

      setError(
        'Your reward was created successfully, but part of the wallet update failed. Refresh the page.'
      );

    } else {

      const definitelyNotProcessed = [
        400, 401, 403, 404, 405
      ].includes(Number(err.status));

      if (definitelyNotProcessed && requestId) {
        const cleared = clearPendingRedemptionId(
          session.user.id,
          requestId
        );

        if (cleared) {
          setPendingRedemptionId(null);
        }
      }

      setError(
        getErrorMessage(
          err,
          'Could not redeem your points. Your request remains saved for retry.'
        )
      );

      setErrorStatus(err.status || null);
    }

  } finally {
    redeemingRef.current = false;
    setBusy(false);
  }
}

  // --------------------------------------------------
  // LOADING SCREEN
  // --------------------------------------------------

  if (!wallet && !error) {
    return (
      <section className="rewards-panel rewards-loading">
        Preparing your Golden Wallet...
      </section>
    );
  }

  // --------------------------------------------------
  // WALLET ERROR
  // --------------------------------------------------

  if (error && !wallet) {
    return (
      <section className="rewards-panel">
        <h1>
          {errorStatus === 401
            ? "Your session needs to be refreshed"
            : "Your wallet couldn't load"}
        </h1>

        <p className="rewards-alert error">{error}</p>

        <button
          className="rewards-button"
          disabled={busy}
          onClick={returnToSignIn}
        >
          {busy ? "Please wait..." : "Sign out and return to sign in"}
        </button>

        <button
          className="rewards-text-button"
          disabled={busy}
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </section>
    );
  }

  // --------------------------------------------------
  // WALLET VALUES
  // --------------------------------------------------

  const account = wallet.account;

  const points = Number(account.points_balance || 0);

  const progress = Math.min(100, (points % 200) / 2);

  // --------------------------------------------------
  // WALLET INTERFACE
  // --------------------------------------------------

  return (
    <div className="rewards-dashboard">
      {/* HEADER */}

      <div className="rewards-welcome-row">
        <div>
          <span className="rewards-eyebrow">YOUR PERSONAL LOYALTY ACCOUNT</span>

          <h1>Hello, {session.user.name || "Golden Member"}!</h1>

          <p>Your next order can bring you closer to a Golden reward.</p>
        </div>

        <button
          className="rewards-text-button"
          disabled={busy}
          onClick={returnToSignIn}
        >
          Sign out
        </button>
      </div>

      {/* GOLDEN WALLET CARD */}

      <section className="golden-wallet-card">
        <div className="golden-wallet-top">
          <div>
            <span>GOLDEN SPREADS</span>
            <h2>GOLDEN REWARDS</h2>
          </div>

          <span className="golden-wallet-mark">GS</span>
        </div>

        <div className="golden-wallet-balance">
          <span>AVAILABLE POINTS</span>

          <strong>
            {points.toLocaleString()} <small>PTS</small>
          </strong>

          <span>Worth ${(points / 200).toFixed(2)} in rewards</span>
        </div>

        <div className="golden-wallet-bottom">
          <div>
            <span>MEMBER ID</span>
            <strong>{account.member_code}</strong>
          </div>

          <div>
            <span>MEMBER</span>
            <strong>{session.user.name || "Golden Member"}</strong>
          </div>
        </div>
      </section>

      {/* POINT STATISTICS */}

      <div className="rewards-stats-grid">
        <div className="rewards-stat">
          <span>Total earned</span>

          <strong>
            {Number(account.total_earned_points || 0).toLocaleString()} pts
          </strong>
        </div>

        <div className="rewards-stat">
          <span>Total redeemed</span>

          <strong>
            {Number(account.total_redeemed_points || 0).toLocaleString()} pts
          </strong>
        </div>
      </div>

      {/* NEXT REWARD */}

      <section className="rewards-panel rewards-progress-panel">
        <div className="rewards-panel-title">
          <div>
            <span className="rewards-eyebrow">YOUR NEXT REWARD</span>

            <h2>200 points = $1 off</h2>
          </div>

          <strong>{points % 200}/200</strong>
        </div>

        <div className="rewards-progress-track">
          <span
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <p>
          Earn 10 points for every $1 spent on eligible Golden Spreads products.
        </p>

        <button
          className="rewards-button"
          disabled={busy || (!pendingRedemptionId && points < 200)}
          onClick={redeemReward}
        >
          {busy
            ? "Please wait..."
            : pendingRedemptionId
              ? "Retry pending redemption"
              : "Redeem 200 points for $1 off"}
        </button>

        <p className="rewards-small">
          A reward code is valid for 30 days and must be confirmed by Golden
          Spreads before it is used.
        </p>
      </section>

      {/* MESSAGES */}

      {message && (
        <p className="rewards-alert success" role="status">
          {message}
        </p>
      )}

      {error && (
        <section className="rewards-panel">
          <p className="rewards-alert error" role="alert">
            {error}
          </p>

          {errorStatus === 401 && (
            <button
              className="rewards-button"
              disabled={busy}
              onClick={returnToSignIn}
            >
              Return to sign in
            </button>
          )}
        </section>
      )}

      {/* REWARD CODES */}

      <section className="rewards-panel">
        <div className="rewards-panel-title">
          <div>
            <span className="rewards-eyebrow">YOUR REWARD CODES</span>

            <h2>Ready to use</h2>
          </div>
        </div>

        {!wallet.redemptions?.length ? (
          <p className="rewards-empty">
            You don't have any active reward codes yet.
          </p>
        ) : (
          <div className="rewards-code-list">
            {wallet.redemptions.map((item) => (
              <div className="rewards-code-item" key={item.redemption_code}>
                <div>
                  <strong>{item.redemption_code}</strong>

                  <span>
                    ${(item.discount_cents / 100).toFixed(2)} discount · Expires{" "}
                    {new Date(item.expires_at).toLocaleDateString()}
                  </span>
                </div>

                <span className="rewards-code-status">Issued</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ACCOUNT DETAILS */}

      <section className="rewards-panel">
        <div className="rewards-panel-title">
          <div>
            <span className="rewards-eyebrow">ACCOUNT DETAILS</span>

            <h2>Your contact number</h2>
          </div>
        </div>

        <form className="rewards-inline-form" onSubmit={savePhone}>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            maxLength={40}
            placeholder="WhatsApp / phone number"
          />

          <button className="rewards-button" disabled={busy} type="submit">
            Save
          </button>
        </form>
      </section>

      {/* TRANSACTIONS */}

      <section className="rewards-panel">
        <div className="rewards-panel-title">
          <div>
            <span className="rewards-eyebrow">YOUR ACTIVITY</span>

            <h2>Recent transactions</h2>
          </div>
        </div>

        {!wallet.transactions?.length ? (
          <p className="rewards-empty">
            Your purchases and rewards will appear here.
          </p>
        ) : (
          <div className="rewards-transaction-list">
            {wallet.transactions.map((item) => (
              <div className="rewards-transaction" key={item.id}>
                <div>
                  <strong>{item.description || item.transaction_type}</strong>

                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>

                <strong
                  className={item.points_delta > 0 ? "positive" : "negative"}
                >
                  {item.points_delta > 0 ? "+" : ""}
                  {item.points_delta} pts
                </strong>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ADMIN ACCESS */}

      {isAdmin && (
        <div className="rewards-admin-link">
          <Link to="/admin/rewards">Open Golden Spreads admin dashboard →</Link>
        </div>
      )}
    </div>
  );
}

// ======================================================
// MAIN REWARDS PAGE
// ======================================================

export default function Rewards() {
  if (!authClient) {
    return <SetupMessage />;
  }

  return (
    <main className="rewards-page">
      <RewardsContent />
    </main>
  );
}

// ======================================================
// AUTHENTICATION STATE MANAGEMENT
// ======================================================

function RewardsContent() {
  const { data: session, isPending, error } = authClient.useSession();

  const [forceSignIn, setForceSignIn] = useState(false);

  const [recoveryNotice, setRecoveryNotice] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  const [mfaStatus, setMfaStatus] = useState(null);
  const [loginPassword, setLoginPassword] = useState("");

  const [statusError, setStatusError] = useState("");
  const [statusRefresh, setStatusRefresh] = useState(0);

  // Signup password remains only in React memory.
  // It is never saved in localStorage or sessionStorage.
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPending, setSignupPending] = useState(false);

  const [pendingEmail, setPendingEmail] = useState(
    () => sessionStorage.getItem(PENDING_EMAIL) || "",
  );

  // --------------------------------------------------
  // SERVER-SIDE LOGIN STATUS
  // --------------------------------------------------

  useEffect(() => {
    if (forceSignIn || signupPending || pendingEmail || !session?.user?.id) {
      return;
    }

    let active = true;

    setMfaStatus(null);
    setStatusError("");

    loyaltyRequest("/api/loyalty/auth/status")
      .then((data) => {
        if (active) {
          setMfaStatus(data);
          setStatusError("");
        }
      })
      .catch((err) => {
        if (active) {
          setStatusError(getErrorMessage(err, "Could not check login status."));
        }
      });

    return () => {
      active = false;
    };
  }, [
    session?.user?.id,
    session?.session?.id,
    forceSignIn,
    signupPending,
    pendingEmail,
    statusRefresh,
  ]);

  // --------------------------------------------------
  // NEW SIGNUP
  // --------------------------------------------------

  function handleSignupStarted(password) {
    setSignupPassword(password);
    setSignupPending(true);
  }

  function handleSignupEnded() {
    setSignupPending(false);
  }

  // --------------------------------------------------
  // SHOW EMAIL VERIFICATION
  // --------------------------------------------------

  function handleVerificationNeeded(email, password = "") {
    sessionStorage.setItem(PENDING_EMAIL, email);

    setSignupPassword(password || signupPassword);
    setPendingEmail(email);
    setSignupPending(false);

    setStatusError("");
  }

  // --------------------------------------------------
  // RETURN TO SIGN IN
  // --------------------------------------------------

  function returnToSignIn(notice) {
    sessionStorage.removeItem(PENDING_EMAIL);

    setPendingEmail("");
    setSignupPassword("");
    setSignupPending(false);

    setLoginPassword("");
    setMfaStatus(null);

    setForceSignIn(true);

    setRecoveryNotice(notice || "Please sign in with your existing account.");
  }

  // --------------------------------------------------
  // CLEAR PREVIOUS SESSION
  // --------------------------------------------------

  async function resetSession() {
    setResetBusy(true);

    try {
      await clearAuthSession();

      setRecoveryNotice(
        "Previous session cleared. Sign in with your existing account.",
      );
    } catch (err) {
      setRecoveryNotice(
        "Could not clear previous session: " +
          getErrorMessage(err, "Please try again."),
      );
    } finally {
      setResetBusy(false);
    }
  }

  // --------------------------------------------------
  // AFTER PASSWORD SIGN-IN
  // --------------------------------------------------

  function handleAuthSuccess(password) {
    setLoginPassword(password || "");
    setForceSignIn(false);

    setRecoveryNotice("");
    setMfaStatus(null);
    setStatusError("");

    setStatusRefresh((value) => value + 1);
  }

  // --------------------------------------------------
  // PENDING VERIFICATION HAS PRIORITY
  // --------------------------------------------------

  const currentPendingEmail =
    pendingEmail || sessionStorage.getItem(PENDING_EMAIL) || "";

  if (currentPendingEmail) {
    return (
      <SignupVerification
        key={currentPendingEmail}
        email={currentPendingEmail}
        initialPassword={signupPassword}
        onBack={() =>
          returnToSignIn("Please sign in with your existing account.")
        }
      />
    );
  }

  // Keep form mounted if Neon updates the session
  // while signup is still in progress.
  if (signupPending) {
    return (
      <AuthForm
        onSignupStarted={handleSignupStarted}
        onSignupEnded={handleSignupEnded}
        onVerificationNeeded={handleVerificationNeeded}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  // --------------------------------------------------
  // MANUAL SIGN-IN AFTER RECOVERY
  // --------------------------------------------------

  if (forceSignIn) {
    return (
      <AuthForm
        initialMode="signin"
        notice={recoveryNotice}
        onResetSession={resetSession}
        resetBusy={resetBusy}
        onSignupStarted={handleSignupStarted}
        onSignupEnded={handleSignupEnded}
        onVerificationNeeded={handleVerificationNeeded}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  // --------------------------------------------------
  // CHECKING NEON SESSION
  // --------------------------------------------------

  if (isPending) {
    return (
      <section className="rewards-panel rewards-loading">
        Checking your account...
      </section>
    );
  }

  if (error) {
    return (
      <AuthForm
        initialMode="signin"
        notice={error.message || "Please sign in again."}
        onResetSession={resetSession}
        resetBusy={resetBusy}
        onSignupStarted={handleSignupStarted}
        onSignupEnded={handleSignupEnded}
        onVerificationNeeded={handleVerificationNeeded}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  // --------------------------------------------------
  // NO SESSION
  // --------------------------------------------------

  if (!session) {
    return (
      <AuthForm
        onSignupStarted={handleSignupStarted}
        onSignupEnded={handleSignupEnded}
        onVerificationNeeded={handleVerificationNeeded}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  // --------------------------------------------------
  // STATUS ERROR
  // --------------------------------------------------

  if (statusError) {
    return (
      <section className="rewards-panel">
        <h2>Unable to check login verification</h2>

        <p className="rewards-alert error">{statusError}</p>

        <button
          className="rewards-button"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </section>
    );
  }

  // --------------------------------------------------
  // CHECKING MFA STATUS
  // --------------------------------------------------

  if (!mfaStatus) {
    return (
      <section className="rewards-panel rewards-loading">
        Checking login security...
      </section>
    );
  }

  // --------------------------------------------------
  // EXISTING UNVERIFIED USER
  // --------------------------------------------------

  if (!mfaStatus.emailVerified) {
    return (
      <SignupVerification
        email={cleanEmail(session.user.email)}
        initialPassword={signupPassword}
        onBack={() =>
          returnToSignIn("Please sign in with your existing account.")
        }
      />
    );
  }

  // --------------------------------------------------
  // RETURNING CUSTOMER MFA
  // --------------------------------------------------

  if (!mfaStatus.authenticated) {
    return (
      <LoginVerification
        initialPassword={loginPassword}
        onVerified={() => {
          setLoginPassword("");

          setMfaStatus({
            emailVerified: true,
            authenticated: true,
          });
        }}
      />
    );
  }

  // --------------------------------------------------
  // FULLY AUTHENTICATED WALLET
  // --------------------------------------------------

  return <Wallet session={session} onReturnToSignIn={returnToSignIn} />;
}
