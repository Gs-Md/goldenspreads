
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { authClient } from '../lib/authClient';
import { loyaltyRequest } from '../lib/loyaltyApi';
import '../Styles/Rewards.css';
import { useLanguage } from '../lib/LanguageContext';

// ==================================================
// UNIQUE PURCHASE ID
// ==================================================

function newPurchaseId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);

  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;

  const hex = Array.from(bytes, (b) =>
    b.toString(16).padStart(2, '0')
  ).join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

// ==================================================
// PENDING PURCHASE RECOVERY
// ==================================================

const PENDING_PURCHASE_CHANNELS = new Set([
  'whatsapp',
  'instagram',
  'phone',
  'in_person',
  'other',
]);

const PURCHASE_ID_PATTERN =
  /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

function pendingPurchaseStorageKey(adminUserId) {
  return `goldenRewardsPendingPurchase:${adminUserId}`;
}

// Restore an unfinished purchase after a refresh.
function readPendingPurchase(adminUserId) {
  try {
    const raw = window.localStorage.getItem(
      pendingPurchaseStorageKey(adminUserId)
    );

    if (!raw) return null;

    const saved = JSON.parse(raw);

    if (
      !saved ||
      typeof saved !== 'object' ||
      !PURCHASE_ID_PATTERN.test(String(saved.purchaseId || '')) ||
      typeof saved.memberCode !== 'string' ||
      !saved.memberCode.trim() ||
      !['string', 'number'].includes(typeof saved.amount) ||
      !Number.isFinite(Number(saved.amount)) ||
      !PENDING_PURCHASE_CHANNELS.has(saved.channel) ||
      typeof (saved.description || '') !== 'string'
    ) {
      return null;
    }

    return {
      purchaseId: String(saved.purchaseId).toLowerCase(),
      memberCode: saved.memberCode.trim().toUpperCase(),
      amount: String(saved.amount),
      channel: saved.channel,
      description: String(saved.description || '').slice(0, 240),
      confirmed: saved.confirmed === true,
    };

  } catch (error) {
    return null;
  }
}

// Save the purchase BEFORE sending it to the server.
function savePendingPurchase(adminUserId, purchase) {
  const key = pendingPurchaseStorageKey(adminUserId);

  try {
    const existingRaw = window.localStorage.getItem(key);

    if (existingRaw) {
      let existing;

      try {
        existing = JSON.parse(existingRaw);
      } catch (error) {
        throw new Error(
          'A previous purchase recovery record could not be read. Do not submit another purchase until this is resolved.'
        );
      }

      if (
        existing?.purchaseId &&
        existing.purchaseId !== purchase.purchaseId
      ) {
        throw new Error(
          'Another purchase is already pending in this browser. Refresh the admin page and resolve that purchase first.'
        );
      }
    }

    window.localStorage.setItem(
      key,
      JSON.stringify({
        ...purchase,
        confirmed: false,
        savedAt: new Date().toISOString(),
      })
    );

  } catch (error) {
    if (
      error?.message?.includes('Another purchase is already pending') ||
      error?.message?.includes('previous purchase recovery record')
    ) {
      throw error;
    }

    throw new Error(
      'Your browser could not save the pending purchase. No purchase request was sent. Check that browser storage is enabled and try again.'
    );
  }
}

// Remove only the matching purchase.
function clearPendingPurchase(adminUserId, purchaseId) {
  try {
    const key = pendingPurchaseStorageKey(adminUserId);
    const raw = window.localStorage.getItem(key);

    if (!raw) return true;

    const saved = JSON.parse(raw);

    if (saved?.purchaseId !== purchaseId) {
      return false;
    }

    window.localStorage.removeItem(key);
    return true;

  } catch (error) {
    return false;
  }
}

// Preserve a server-confirmed state if clearing storage fails.
function markPendingPurchaseConfirmed(adminUserId, purchase) {
  try {
    const key = pendingPurchaseStorageKey(adminUserId);
    const raw = window.localStorage.getItem(key);

    if (!raw) return false;

    const saved = JSON.parse(raw);

    if (saved?.purchaseId !== purchase.purchaseId) {
      return false;
    }

    window.localStorage.setItem(
      key,
      JSON.stringify({
        ...purchase,
        confirmed: true,
        savedAt: new Date().toISOString(),
      })
    );

    return true;

  } catch (error) {
    return false;
  }
}

// ==================================================
// ADMIN DASHBOARD
// ==================================================

function AdminContent({ session }) {
  const { language } = useLanguage();
  const [authorized, setAuthorized] = useState(null);
  const [adminEmail, setAdminEmail] = useState('');

  const [customers, setCustomers] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [redemptions, setRedemptions] = useState([]);

  const [search, setSearch] = useState('');

  // Restore an unfinished purchase after a refresh.
  const [purchaseBootstrap] = useState(() => {
    const pending = readPendingPurchase(session.user.id);

    return {
      pending,
      purchaseId: pending?.purchaseId || newPurchaseId(),
    };
  });

  const [pendingPurchase, setPendingPurchase] = useState(
    purchaseBootstrap.pending
  );

  const [selectedMember, setSelectedMember] = useState(
    purchaseBootstrap.pending?.memberCode || ''
  );

  const [amount, setAmount] = useState(
    purchaseBootstrap.pending?.amount || ''
  );

  const [channel, setChannel] = useState(
    purchaseBootstrap.pending?.channel || 'whatsapp'
  );

  const [description, setDescription] = useState(
    purchaseBootstrap.pending?.description || ''
  );

  const [purchaseId, setPurchaseId] = useState(
    purchaseBootstrap.purchaseId
  );

  const submittingPurchase = useRef(false);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Customer deletion
  const [deleteUserId, setDeleteUserId] = useState('');
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');

  // ------------------------------------------------
  // LOAD ADMIN DATA
  // ------------------------------------------------

  const loadAdminData = useCallback(async (searchValue = '') => {
    const [customerData, redemptionData] = await Promise.all([
      loyaltyRequest(
        `/api/loyalty/admin/customers?search=${encodeURIComponent(searchValue)}`
      ),
      loyaltyRequest('/api/loyalty/admin/redemptions'),
    ]);

    setCustomers(customerData.customers || []);
    setRegisteredUsers(customerData.registeredUsers || []);
    setRedemptions(redemptionData.redemptions || []);
  }, []);

  // ------------------------------------------------
  // CHECK ADMIN AUTHORIZATION
  // ------------------------------------------------

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const status = await loyaltyRequest(
          '/api/loyalty/admin/status'
        );

        if (!active) return;

        if (status.isAdmin !== true) {
          throw new Error('Administrator permission denied.');
        }

        setAuthorized(true);
        setAdminEmail(status.email || session.user.email || '');

      } catch (err) {
        if (!active) return;

        setAuthorized(false);
        setError(err.message || 'Administrator access required.');
        return;
      }

      try {
        await loadAdminData('');
      } catch (err) {
        if (active) {
          setError(err.message || 'Could not load admin data.');
        }
      }
    }

    initialize();

    return () => {
      active = false;
    };

  }, [session.user.id, session.user.email, loadAdminData]);

  // ------------------------------------------------
  // SEARCH CUSTOMERS
  // ------------------------------------------------

  async function searchCustomers(event) {
    event.preventDefault();

    setBusy(true);
    setError('');

    setDeleteUserId('');
    setConfirmationPhrase('');
    setDeleteError('');

    try {
      await loadAdminData(search);
    } catch (err) {
      setError(err.message || 'Could not search customers.');
    } finally {
      setBusy(false);
    }
  }

  // ------------------------------------------------
  // RECORD PURCHASE - REFRESH SAFE
  // ------------------------------------------------

  async function awardPoints(event) {
    event.preventDefault();

    if (submittingPurchase.current || busy || deleteBusy) {
      return;
    }

    if (pendingPurchase?.confirmed) {
      setError(
        'This purchase was already confirmed by the server. Clear its completed notice before recording another purchase.'
      );
      return;
    }

    // If there is a pending purchase, always reuse its original details.
    const purchaseToSubmit = pendingPurchase || {
      purchaseId,
      memberCode: selectedMember,
      amount: String(amount),
      channel,
      description,
    };

    if (!purchaseToSubmit.memberCode || !purchaseToSubmit.amount) {
      setError('Select a customer and enter the eligible purchase total.');
      return;
    }

    submittingPurchase.current = true;
    setBusy(true);
    setError('');
    setMessage('');

    let pendingWasSaved = false;

    try {
      // Save before sending the request.
      savePendingPurchase(session.user.id, purchaseToSubmit);
      pendingWasSaved = true;

      if (!pendingPurchase) {
        setPendingPurchase(purchaseToSubmit);
      }

      const result = await loyaltyRequest(
        '/api/loyalty/admin/award',
        {
          method: 'POST',
          body: JSON.stringify({
            memberCode: purchaseToSubmit.memberCode,
            amount: purchaseToSubmit.amount,
            channel: purchaseToSubmit.channel,
            description: purchaseToSubmit.description,
            purchaseId: purchaseToSubmit.purchaseId,
          }),
        }
      );

      // Server confirmed success.
      // Clear the recovery record before creating a new ID.
      const recoveryRecordCleared = clearPendingPurchase(
        session.user.id,
        purchaseToSubmit.purchaseId
      );

      if (recoveryRecordCleared) {
        setPendingPurchase(null);
        setPurchaseId(newPurchaseId());
        setAmount('');
        setDescription('');

      } else {
        const confirmedPurchase = {
          ...purchaseToSubmit,
          confirmed: true,
        };

        markPendingPurchaseConfirmed(
          session.user.id,
          confirmedPurchase
        );

        setPendingPurchase(confirmedPurchase);

        setError(
          'The purchase was recorded successfully, but the browser could not clear its recovery record. Do not submit it again. Clear the completed purchase notice below after checking the wallet.'
        );
      }

      setMessage(
        `Purchase recorded successfully! ` +
        `${result.pointsAwarded} points added to ${result.memberCode}. ` +
        `New balance: ${result.pointsBalance} points. ` +
        `Order reference: ${result.orderReference}`
      );

      try {
        await loadAdminData(search);
      } catch (refreshError) {
        setError((currentError) =>
          currentError ||
          'Purchase saved successfully, but the customer list did not refresh.'
        );
      }

    } catch (err) {
      // These responses occur before a purchase is inserted.
      const definitelyNotInserted = [400, 401, 403, 404].includes(
        err.status
      );

      if (err.status === 409) {
        // The unique order reference already exists.
        // The backend did not award points a second time.
        const recoveryRecordCleared = clearPendingPurchase(
          session.user.id,
          purchaseToSubmit.purchaseId
        );

        if (recoveryRecordCleared) {
          setPendingPurchase(null);
          setPurchaseId(newPurchaseId());
          setAmount('');
          setDescription('');
        }

        setError(
          'This purchase reference has already been recorded. The server did not award points again. Check the customer wallet and purchase history before recording another purchase.'
        );

      } else if (definitelyNotInserted) {
        if (pendingWasSaved) {
          const recoveryRecordCleared = clearPendingPurchase(
            session.user.id,
            purchaseToSubmit.purchaseId
          );

          if (recoveryRecordCleared) {
            setPendingPurchase(null);
            setPurchaseId(newPurchaseId());
          }
        }

        setError(
          err.message || 'The purchase was rejected and was not recorded.'
        );

      } else if (pendingWasSaved) {
        // Network errors and uncertain server errors retain the same ID.
        setError(
          `${err.message || 'The server did not confirm the purchase.'} ` +
          'The purchase details and reference are saved in this browser. Retry the same pending purchase; do not create a new one.'
        );

      } else {
        setError(
          err.message || 'Could not save the purchase recovery record.'
        );
      }

    } finally {
      submittingPurchase.current = false;
      setBusy(false);
    }
  }

  // ------------------------------------------------
  // CLEAR COMPLETED PURCHASE NOTICE
  // ------------------------------------------------

  function clearCompletedPurchaseNotice() {
    if (!pendingPurchase?.confirmed || busy || deleteBusy) {
      return;
    }

    const cleared = clearPendingPurchase(
      session.user.id,
      pendingPurchase.purchaseId
    );

    if (!cleared) {
      setError(
        'Could not clear the completed purchase notice from browser storage. Do not submit this purchase again.'
      );
      return;
    }

    setPendingPurchase(null);
    setPurchaseId(newPurchaseId());
    setAmount('');
    setDescription('');
    setError('');
    setMessage(
      'Completed purchase notice cleared. You can record the next purchase.'
    );
  }

  // ------------------------------------------------
  // CONFIRM REWARD CODE
  // ------------------------------------------------

  async function confirmRedemption(code) {
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const result = await loyaltyRequest(
        '/api/loyalty/admin/confirm-redemption',
        {
          method: 'POST',
          body: JSON.stringify({ code }),
        }
      );

      setMessage(
        `${result.redemption.redemption_code} confirmed. ` +
        `Apply $${(
          result.redemption.discount_cents / 100
        ).toFixed(2)} discount to the customer's offline order.`
      );

      await loadAdminData(search);

    } catch (err) {
      setError(
        err.message || 'Could not confirm reward code.'
      );
    } finally {
      setBusy(false);
    }
  }

  // ==================================================
  // CUSTOMER DELETION
  // ==================================================

  const selectedDeleteUser = registeredUsers.find(
    (user) => user.user_id === deleteUserId
  );

  const canDelete =
    !!selectedDeleteUser &&
    confirmationPhrase.trim() === 'DELETE' &&
    !busy &&
    !deleteBusy &&
    !pendingPurchase;

  function selectCustomerForDeletion(user) {
    if (pendingPurchase) {
      setDeleteError(
        'Resolve the pending purchase before deleting a customer account.'
      );
      return;
    }

    if (
      String(user.email || '').toLowerCase() ===
      String(adminEmail || '').toLowerCase()
    ) {
      setDeleteError(
        'You cannot delete your administrator account.'
      );
      return;
    }

    setDeleteUserId(user.user_id);
    setConfirmationPhrase('');
    setDeleteError('');
    setDeleteMessage('');
  }

  function cancelDeletion() {
    setDeleteUserId('');
    setConfirmationPhrase('');
    setDeleteError('');
  }

  async function deleteCustomer(event) {
    event.preventDefault();

    if (!canDelete || !selectedDeleteUser) {
      return;
    }

    const customer = selectedDeleteUser;

    const confirmationMessage = language === 'ar'
      ? 'حذف الحساب نهائياً\n\n' +
        `العميل: ${customer.name || 'عضو غولدن'}\n` +
        `البريد الإلكتروني: ${customer.email}\n\n` +
        'سيؤدي ذلك إلى حذف حساب تسجيل الدخول والمحفظة والنقاط وسجل المشتريات ورموز المكافآت.\n\n' +
        'لا يمكن التراجع عن هذا الإجراء.\n\n' +
        'هل تريد حذف هذا العميل نهائياً؟'
      : 'PERMANENT ACCOUNT DELETION\n\n' +
        `Customer: ${customer.name || 'Golden Member'}\n` +
        `Email: ${customer.email}\n\n` +
        'This deletes the login account, wallet, points, ' +
        'purchase history and reward codes.\n\n' +
        'This action cannot be undone.\n\n' +
        'Delete this customer permanently?';

    const confirmed = window.confirm(confirmationMessage);

    if (!confirmed) return;

    setDeleteBusy(true);
    setDeleteError('');
    setDeleteMessage('');
    setError('');

    try {
      const result = await loyaltyRequest(
        '/api/loyalty/admin/delete-customer',
        {
          method: 'POST',
          body: JSON.stringify({
            userId: customer.user_id,
            confirmationPhrase: 'DELETE',
          }),
        }
      );

      if (result.success !== true) {
        throw new Error(
          'The server did not confirm deletion.'
        );
      }

      if (selectedMember === customer.member_code) {
        setSelectedMember('');
      }

      cancelDeletion();

      setDeleteMessage(
        `Customer ${customer.email} deleted successfully.`
      );

      try {
        await loadAdminData(search);
      } catch (refreshError) {
        setDeleteError(
          'Customer deleted, but the list could not refresh. Reload the page.'
        );
      }

    } catch (err) {
      setDeleteError(
        err.message || 'Customer deletion failed.'
      );
    } finally {
      setDeleteBusy(false);
    }
  }

  // ==================================================
  // AUTHORIZATION STATES
  // ==================================================

  if (authorized === null) {
    return (
      <section className="rewards-panel rewards-loading">
        Checking admin permissions...
      </section>
    );
  }

  if (!authorized) {
    return (
      <section className="rewards-panel rewards-notice">
        <h1>Admin access required</h1>

        <p>
          {error || 'You are not authorized to manage rewards.'}
        </p>

        <Link className="rewards-button" to="/rewards">
          Return to My Wallet
        </Link>
      </section>
    );
  }

  return (
    <div className="rewards-dashboard admin-rewards-dashboard">

      {/* ADMIN HEADER */}

      <div className="rewards-welcome-row">
        <div>
          <span className="rewards-eyebrow">
            GOLDEN SPREADS ADMIN
          </span>

          <h1>Loyalty management</h1>

          <p>
            Signed in as {adminEmail}. Manage customers,
            record purchases, and confirm rewards.
          </p>
        </div>

        <Link className="rewards-text-button" to="/rewards">
          My wallet
        </Link>
      </div>

      {message && (
        <p className="rewards-alert success" role="status">
          {message}
        </p>
      )}

      {error && (
        <p className="rewards-alert error" role="alert">
          {error}
        </p>
      )}

      {/* CUSTOMER SEARCH */}

      <section className="rewards-panel">
        <div className="rewards-panel-title">
          <div>
            <span className="rewards-eyebrow">
              CUSTOMERS
            </span>
            <h2>Find a Golden Member</h2>
          </div>

          <strong>{customers.length} shown</strong>
        </div>

        <form
          className="rewards-inline-form"
          onSubmit={searchCustomers}
        >
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search name, email, phone or member ID"
          />

          <button
            className="rewards-button"
            type="submit"
            disabled={busy || deleteBusy}
          >
            {busy ? 'Searching...' : 'Search'}
          </button>
        </form>

        <div className="rewards-customer-list">
          {customers.length === 0 ? (
            <p className="rewards-empty">
              No customer wallets found.
            </p>
          ) : (
            customers.map((customer) => (
              <button
                type="button"
                key={customer.member_code}
                className={`rewards-customer-row ${
                  selectedMember === customer.member_code
                    ? 'selected'
                    : ''
                }`}
                disabled={busy || deleteBusy || !!pendingPurchase}
                onClick={() =>
                  setSelectedMember(customer.member_code)
                }
              >
                <span>
                  <strong>
                    {customer.name || 'Golden Member'}
                  </strong>

                  <small>
                    {customer.email} · {customer.member_code}
                    {customer.phone
                      ? ` · ${customer.phone}`
                      : ''}
                  </small>
                </span>

                <strong>
                  {Number(
                    customer.points_balance || 0
                  ).toLocaleString()} pts
                </strong>
              </button>
            ))
          )}
        </div>
      </section>

      {/* RECORD COMPLETED PURCHASE */}

      <section className="rewards-panel">
        <div className="rewards-panel-title">
          <div>
            <span className="rewards-eyebrow">
              OFFLINE ORDER
            </span>

            <h2>Record a completed purchase</h2>
          </div>
        </div>

        <p className="rewards-small">
          Select a customer, enter their eligible purchase
          amount, and choose the order channel. Delivery
          is excluded. The system calculates points and
          generates a unique order reference automatically.
        </p>

        {pendingPurchase && (
          <div
            className={`rewards-alert ${
              pendingPurchase.confirmed ? 'success' : 'error'
            }`}
            role="alert"
          >
            {pendingPurchase.confirmed ? (
              <>
                This purchase has already been confirmed by the server.
                Do not submit it again. Clear the completed purchase notice
                below to start another purchase.
              </>
            ) : (
              <>
                A purchase is pending. Its details and unique reference
                have been saved in this browser. Use the button below to
                retry the same purchase. Do not change the customer or
                purchase details, and do not create another purchase until
                this one is resolved.
              </>
            )}
          </div>
        )}

        {pendingPurchase?.confirmed && (
          <button
            type="button"
            className="rewards-text-button"
            disabled={busy || deleteBusy}
            onClick={clearCompletedPurchaseNotice}
          >
            Clear completed purchase notice
          </button>
        )}

        <form
          className="rewards-form"
          onSubmit={awardPoints}
        >
          <label>
            Selected member

            <input
              value={selectedMember}
              readOnly
              disabled={!!pendingPurchase}
              required
              placeholder="Select a customer above"
            />
          </label>

          <div className="rewards-form-grid">
            <label>
              Eligible product total (USD)

              <input
                type="number"
                min="0.10"
                max="100000"
                step="0.01"
                value={amount}
                disabled={!!pendingPurchase}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
                required
                placeholder="14.00"
              />
            </label>

            <label>
              Order channel

              <select
                value={channel}
                disabled={!!pendingPurchase}
                onChange={(event) =>
                  setChannel(event.target.value)
                }
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
                <option value="phone">Phone</option>
                <option value="in_person">In person</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>

          <label>
            Note{' '}
            <span className="rewards-optional">
              (optional)
            </span>

            <input
              value={description}
              disabled={!!pendingPurchase}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              maxLength={240}
              placeholder="For example: 2 Creamy + 1 Crunchy"
            />
          </label>

          <p className="rewards-small">
            Order reference: automatically generated
            when you confirm the purchase.
          </p>

          <button
            className="rewards-button full"
            type="submit"
            disabled={
              busy ||
              deleteBusy ||
              pendingPurchase?.confirmed ||
              !selectedMember ||
              !amount
            }
          >
            {busy
              ? 'Recording purchase...'
              : pendingPurchase
                ? 'Retry pending purchase safely'
                : 'Confirm purchase and award points'}
          </button>
        </form>
      </section>

      {/* REWARD CODES */}

      <section className="rewards-panel">
        <div className="rewards-panel-title">
          <div>
            <span className="rewards-eyebrow">
              CUSTOMER REWARDS
            </span>

            <h2>Issued reward codes</h2>
          </div>

          <strong>{redemptions.length} pending</strong>
        </div>

        {redemptions.length === 0 ? (
          <p className="rewards-empty">
            No active reward codes awaiting confirmation.
          </p>
        ) : (
          <div className="rewards-transaction-list">
            {redemptions.map((item) => (
              <div
                className="rewards-redemption-row"
                key={item.id}
              >
                <div>
                  <strong>
                    {item.redemption_code}
                  </strong>

                  <span>
                    {item.name || 'Golden Member'}
                    {' · '}
                    {item.member_code}
                    {' · '}
                    {item.email}
                  </span>

                  <span>
                    ${(item.discount_cents / 100).toFixed(2)}
                    {' '}off · Expires{' '}
                    {new Date(
                      item.expires_at
                    ).toLocaleDateString()}
                  </span>
                </div>

                <button
                  type="button"
                  className="rewards-button small"
                  disabled={busy || deleteBusy}
                  onClick={() =>
                    confirmRedemption(item.redemption_code)
                  }
                >
                  Mark used
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MANAGE CUSTOMERS */}

      <section className="rewards-panel">
        <div className="rewards-panel-title">
          <div>
            <span className="rewards-eyebrow">
              ACCOUNT MANAGEMENT
            </span>

            <h2>Manage customer accounts</h2>
          </div>

          <strong>{registeredUsers.length} shown</strong>
        </div>

        <p className="rewards-small">
          Registered customers, including users without
          wallets. Use the search above to find an account.
        </p>

        {deleteMessage && (
          <p className="rewards-alert success" role="status">
            {deleteMessage}
          </p>
        )}

        {deleteError && (
          <p className="rewards-alert error" role="alert">
            {deleteError}
          </p>
        )}

        <div className="rewards-transaction-list">
          {registeredUsers.length === 0 ? (
            <p className="rewards-empty">
              No registered accounts found.
            </p>
          ) : (
            registeredUsers.map((user) => (
              <div
                className="rewards-redemption-row"
                key={user.user_id}
              >
                <div>
                  <strong>
                    {user.name || 'Golden Member'}
                  </strong>

                  <span>{user.email}</span>

                  <span>
                    {user.has_wallet
                      ? `${user.member_code} · ${Number(
                          user.points_balance || 0
                        ).toLocaleString()} points`
                      : 'No Golden Wallet created yet'}
                  </span>

                  <span>
                    Email: {user.email_verified
                      ? 'Verified'
                      : 'Not verified'}
                  </span>
                </div>

                <button
                  type="button"
                  className="rewards-button small"
                  disabled={busy || deleteBusy || !!pendingPurchase}
                  onClick={() =>
                    selectCustomerForDeletion(user)
                  }
                  style={{
                    background: '#a32c2c',
                    borderColor: '#a32c2c',
                    color: '#fff',
                  }}
                >
                  Delete customer
                </button>
              </div>
            ))
          )}
        </div>

        {/* DELETE CONFIRMATION */}

        {selectedDeleteUser && (
          <section
            className="rewards-panel"
            style={{
              marginTop: '24px',
              border: '1px solid #d9a2a2',
            }}
          >
            <span className="rewards-eyebrow">
              PERMANENT ACCOUNT DELETION
            </span>

            <h2>
              Delete {selectedDeleteUser.name || 'this customer'}?
            </h2>

            <p>
              <strong>Email:</strong>{' '}
              {selectedDeleteUser.email}
            </p>

            <p>
              <strong>Member ID:</strong>{' '}
              {selectedDeleteUser.member_code ||
                'No wallet created'}
            </p>

            <p>
              <strong>Current points:</strong>{' '}
              {Number(
                selectedDeleteUser.points_balance || 0
              ).toLocaleString()}
            </p>

            <p className="rewards-alert error" role="alert">
              This permanently deletes the customer's
              account, points, purchase history, and
              reward codes. It cannot be undone.
            </p>

            <form
              className="rewards-form"
              onSubmit={deleteCustomer}
            >
              <label>
                Type DELETE to confirm

                <input
                  value={confirmationPhrase}
                  onChange={(event) =>
                    setConfirmationPhrase(event.target.value)
                  }
                  autoComplete="off"
                  placeholder="DELETE"
                  required
                />
              </label>

              <button
                type="submit"
                className="rewards-button full"
                disabled={!canDelete}
                style={{
                  background: '#a32c2c',
                  borderColor: '#a32c2c',
                  color: '#fff',
                }}
              >
                {deleteBusy
                  ? 'Deleting customer...'
                  : 'Permanently delete customer'}
              </button>

              <button
                type="button"
                className="rewards-text-button"
                disabled={deleteBusy}
                onClick={cancelDeletion}
              >
                Cancel deletion
              </button>
            </form>
          </section>
        )}
      </section>
    </div>
  );
}

// ==================================================
// MAIN PAGE
// ==================================================

export default function AdminRewards() {
  if (!authClient) {
    return (
      <main className="rewards-page">
        <section className="rewards-panel">
          <h1>Golden Rewards setup required</h1>
          <p>Configure REACT_APP_NEON_AUTH_BASE_URL.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="rewards-page">
      <AdminAuthGate />
    </main>
  );
}

// ==================================================
// AUTHENTICATION GATE
// ==================================================

function AdminAuthGate() {
  const {
    data: session,
    isPending,
    error,
  } = authClient.useSession();

  if (isPending) {
    return (
      <section className="rewards-panel rewards-loading">
        Checking your account...
      </section>
    );
  }

  if (error) {
    return (
      <section className="rewards-panel rewards-notice">
        <h1>Authentication error</h1>
        <p>{error.message || 'Could not verify your session.'}</p>
        <Link className="rewards-button" to="/rewards">
          Return to Golden Rewards
        </Link>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="rewards-panel rewards-notice">
        <h1>Please sign in first</h1>
        <p>Sign in using your administrator account.</p>
        <Link className="rewards-button" to="/rewards">
          Go to sign in
        </Link>
      </section>
    );
  }

  return <AdminContent session={session} />;
}
