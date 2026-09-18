"use client";

import { useState } from "react";
import { ShieldCheck, Copy, Check, Eye, EyeOff, X, Download } from "lucide-react";
import { authClient } from "@/lib/auth-client";

interface MfaSetupDialogProps {
  onClose: () => void;
  onEnabled: () => void;
}
type Step = "init" | "qr" | "verify" | "backup";

export function MfaSetupDialog({ onClose, onEnabled }: MfaSetupDialogProps) {
  const [step, setStep] = useState<Step>("init");
  const [totpUri, setTotpUri] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  async function handleEnable() {
    if (!password) { setError("Please enter your current password to continue."); return; }
    setLoading(true); setError(null);
    try {
      const result = await (authClient as any).twoFactor.enable({ password });
      if (result.error) { setError(result.error.message || "Failed to enable 2FA."); return; }
      const uri: string = result.data?.totpURI || "";
      setTotpUri(uri);
      const m = uri.match(/secret=([^&]+)/);
      setSecret(m ? m[1] : "");
      setStep("qr");
    } catch { setError("An unexpected error occurred. Please try again."); }
    finally { setLoading(false); }
  }

  async function handleVerify() {
    if (code.length !== 6) { setError("Please enter the 6-digit code from your authenticator app."); return; }
    setLoading(true); setError(null);
    try {
      const result = await (authClient as any).twoFactor.verifyTotp({ code });
      if (result.error) { setError("Invalid code. Please try again."); return; }
      setBackupCodes(result.data?.backupCodes || []);
      setStep("backup");
    } catch { setError("Verification failed. Please try again."); }
    finally { setLoading(false); }
  }

  function handleCopySecret() {
    void navigator.clipboard.writeText(secret);
    setCopiedSecret(true); setTimeout(() => setCopiedSecret(false), 2000);
  }

  function handleCopyBackup() {
    void navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopiedBackup(true); setTimeout(() => setCopiedBackup(false), 2000);
  }

  function handleDownloadBackup() {
    const blob = new Blob([backupCodes.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "contour-backup-codes.txt"; a.click();
    URL.revokeObjectURL(url);
  }

  const qrUrl = totpUri
    ? `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(totpUri)}`
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white border border-editorial-border w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-editorial-border">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-contour-red" />
            <span className="font-heading font-bold text-sm uppercase tracking-wider text-editorial-black">
              Enable Two-Factor Authentication
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-none border border-editorial-border bg-white text-editorial-black hover:bg-editorial-black hover:text-white transition-all shadow-xs"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {step === "init" && (
            <>
              <p className="text-xs text-editorial-muted font-geist leading-relaxed">
                Two-factor authentication adds a second layer of security. After setup you will enter a
                6-digit code from <strong className="text-editorial-black">Google Authenticator</strong> or
                {" "}<strong className="text-editorial-black">Authy</strong> each time you sign in.
                {" "}<strong className="text-editorial-black">No email required.</strong>
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-black mb-1.5">
                    Confirm your current password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && void handleEnable()}
                      placeholder="Enter your password"
                      className="w-full px-3.5 py-2.5 bg-white border border-editorial-border text-xs text-editorial-black focus:outline-none focus:border-editorial-black pr-10"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-editorial-muted">
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>}
                <button type="button" onClick={() => void handleEnable()} disabled={loading || !password}
                  className="w-full py-2.5 bg-editorial-black text-white text-xs font-bold uppercase tracking-wider hover:bg-editorial-black/90 transition-colors disabled:opacity-50">
                  {loading ? "Generating QR Code..." : "Continue"}
                </button>
              </div>
            </>
          )}

          {step === "qr" && (
            <>
              <p className="text-xs text-editorial-muted font-geist leading-relaxed">
                Open <strong className="text-editorial-black">Google Authenticator</strong> or
                {" "}<strong className="text-editorial-black">Authy</strong> on your phone and scan this QR code.
              </p>
              <div className="flex flex-col items-center gap-4">
                <div className="border border-editorial-border p-3 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrUrl} alt="TOTP QR Code" width={200} height={200} />
                </div>
                <div className="w-full">
                  <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-muted mb-1.5">
                    Cannot scan? Enter this key manually
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-xs text-editorial-black bg-neutral-100 border border-editorial-border px-3 py-2 break-all">
                      {secret}
                    </code>
                    <button type="button" onClick={handleCopySecret} className="border border-editorial-border p-2 hover:bg-neutral-50">
                      {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => { setStep("verify"); setError(null); setCode(""); }}
                className="w-full py-2.5 bg-editorial-black text-white text-xs font-bold uppercase tracking-wider hover:bg-editorial-black/90 transition-colors">
                I have Scanned the Code - Next
              </button>
            </>
          )}

          {step === "verify" && (
            <>
              <p className="text-xs text-editorial-muted font-geist leading-relaxed">
                Enter the <strong className="text-editorial-black">6-digit code</strong> from your authenticator app to confirm setup.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-black mb-1.5">
                    6-Digit verification code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && void handleVerify()}
                    placeholder="000000"
                    className="w-full px-3.5 py-2.5 bg-white border border-editorial-border text-sm text-editorial-black focus:outline-none focus:border-editorial-black font-mono text-center tracking-[0.5em]"
                    autoFocus
                  />
                </div>
                {error && <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setStep("qr")}
                    className="flex-1 py-2.5 border border-editorial-border text-xs font-bold uppercase tracking-wider text-editorial-black hover:bg-neutral-50 transition-colors">
                    Back
                  </button>
                  <button type="button" onClick={() => void handleVerify()} disabled={loading || code.length !== 6}
                    className="flex-1 py-2.5 bg-editorial-black text-white text-xs font-bold uppercase tracking-wider hover:bg-editorial-black/90 transition-colors disabled:opacity-50">
                    {loading ? "Verifying..." : "Verify and Enable"}
                  </button>
                </div>
              </div>
            </>
          )}

          {step === "backup" && (
            <>
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200">
                <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[11px] text-amber-800 font-geist leading-relaxed">
                  <strong>Save these backup codes now.</strong> If you lose your phone, use one of these to sign in. Each code can only be used once.
                </p>
              </div>
              <div className="bg-neutral-50 border border-editorial-border p-4">
                <div className="grid grid-cols-2 gap-1.5">
                  {backupCodes.map((c) => (
                    <code key={c} className="font-mono text-xs text-editorial-black bg-white border border-editorial-border px-2.5 py-1.5 text-center">{c}</code>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handleCopyBackup}
                  className="flex-1 py-2.5 border border-editorial-border text-[10px] font-bold uppercase tracking-wider text-editorial-black hover:bg-neutral-50 transition-colors flex items-center justify-center gap-1.5">
                  {copiedBackup ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedBackup ? "Copied!" : "Copy All"}
                </button>
                <button type="button" onClick={handleDownloadBackup}
                  className="flex-1 py-2.5 border border-editorial-border text-[10px] font-bold uppercase tracking-wider text-editorial-black hover:bg-neutral-50 transition-colors flex items-center justify-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
              <button type="button" onClick={() => { onEnabled(); onClose(); }}
                className="w-full py-2.5 bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-800 transition-colors">
                I have Saved My Backup Codes - Done
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
