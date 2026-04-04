'use client';

import { useEffect, useRef, useState } from 'react';
import { UserCircle, Loader2, Camera, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { DashboardChrome } from '@/components/dashboard/DashboardChrome';
import { DashboardBackLink } from '@/components/dashboard/DashboardBackLink';

const WALLET_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const MAX_PHOTO_BYTES = 320 * 1024;
const ACCEPT_IMAGE = 'image/jpeg,image/png,image/gif,image/webp';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('Could not read file'));
    r.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarDirty, setAvatarDirty] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setWalletAddress(user.walletAddress || '');
      setAvatarPreview(user.avatarUrl || '');
      setAvatarDirty(false);
    }
  }, [user]);

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose a JPEG, PNG, GIF, or WebP image.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError('Photo must be under 320 KB. Try a smaller image.');
      return;
    }
    setError('');
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAvatarPreview(dataUrl);
      setAvatarDirty(true);
    } catch {
      setError('Could not read that file.');
    }
  }

  function clearPhoto() {
    setAvatarPreview('');
    setAvatarDirty(true);
    setError('');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError('');
    setMsg('');
    const w = walletAddress.trim();
    if (w && !WALLET_PATTERN.test(w)) {
      setError('Wallet must start with 0x and be exactly 42 characters (0x + 40 hex digits).');
      return;
    }
    const payload: {
      fullName: string;
      phone: string;
      walletAddress?: string;
      avatarUrl?: string;
    } = {
      fullName: fullName.trim(),
      phone: phone.trim(),
    };
    if (w) payload.walletAddress = w;
    if (avatarDirty) {
      payload.avatarUrl = avatarPreview.trim() ? avatarPreview.trim() : '';
    }
    setSaving(true);
    try {
      const r = await api.putProfile(payload);
      setMsg(r.message || 'Saved');
      setAvatarDirty(false);
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardChrome title="Profile" subtitle="Your identity & wallet" loginNext="/dashboard/profile">
      {error ? <div className="adminPvAlert adminPvAlertErr">{error}</div> : null}
      {msg ? <div className="adminPvAlert adminPvAlertOk">{msg}</div> : null}

      <div className="inrtProfilePage">
        <div className="inrtProfileCard adminPvCard inrtCardPro">
          <div className="inrtProfileLayout">
            <div className="inrtProfileAside">
              <div className="inrtProfileAvatarWrap">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="Profile" className="inrtProfileAvatarImg" />
                ) : (
                  <div className="inrtProfileAvatarFallback">
                    <UserCircle size={56} strokeWidth={1.25} />
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPT_IMAGE}
                className="sr-only"
                aria-label="Upload profile photo"
                onChange={onPickPhoto}
              />
              <div className="inrtProfilePhotoActions">
                <button
                  type="button"
                  className="adminPvBtn adminPvBtnPrimary inrtProfilePhotoBtn"
                  onClick={() => fileRef.current?.click()}
                  disabled={saving}
                >
                  <Camera size={16} />
                  Upload photo
                </button>
                {(avatarPreview || user?.avatarUrl) && (
                  <button
                    type="button"
                    className="adminPvBtn adminPvBtnGhost inrtProfilePhotoBtn"
                    onClick={clearPhoto}
                    disabled={saving}
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                )}
              </div>
              <p className="inrtProfilePhotoHint">JPEG, PNG, GIF or WebP · max 320 KB (saved with your account)</p>
            </div>

            <div className="inrtProfileFormCol">
              <div className="inrtProfileFormHead">
                <h2 className="inrtSectionTitle" style={{ margin: 0 }}>
                  Account details
                </h2>
                <p className="inrtSectionHint" style={{ margin: '0.25rem 0 0' }}>
                  Name and phone are shown in your header when set. BSC wallet powers deposits and withdrawals.
                </p>
              </div>

              <form onSubmit={onSubmit} className="inrtProfileForm">
                <div className="adminPvField">
                  <label htmlFor="fn">Full name</label>
                  <input
                    id="fn"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    maxLength={120}
                    disabled={saving}
                    autoComplete="name"
                  />
                </div>
                <div className="adminPvField">
                  <label htmlFor="ph">Phone number</label>
                  <input
                    id="ph"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    maxLength={20}
                    disabled={saving}
                    autoComplete="tel"
                  />
                </div>
                <div className="adminPvField">
                  <label htmlFor="em">Email</label>
                  <input id="em" type="email" value={user?.email || ''} readOnly disabled className="opacity-80" />
                </div>
                <div className="adminPvField">
                  <label htmlFor="wa">Wallet address (BSC)</label>
                  <input
                    id="wa"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="0x… (42 characters)"
                    disabled={saving}
                    title="Optional until you need on-chain deposit / withdraw"
                    style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.85rem' }}
                  />
                </div>
                <button type="submit" className="adminPvBtn adminPvBtnPrimary inrtProfileSaveBtn" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 size={16} className="adminPvSpin" /> Saving…
                    </>
                  ) : (
                    'Save changes'
                  )}
                </button>
              </form>
            </div>
          </div>

          <DashboardBackLink href="/dashboard" label="← Back to portfolio" />
        </div>
      </div>
    </DashboardChrome>
  );
}
