import { useState } from "react";
import { ArrowRight, Crown, Loader2, Lock, ShieldAlert, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { sha256Hex } from "@/lib/password";
import { useStore } from "@/lib/store";

/**
 * Operator access gate for CE Empire.
 *
 * The built-in "BOSS" admin may always enter; additional operators created in
 * Settings → สร้างผู้ใช้งาน can also sign in. Passwords are never stored in
 * source or state as plaintext — we keep SHA-256 digests and compare hashes.
 * Note this is a client-side gate (suitable for an internal, trusted-device
 * tool); it is not a substitute for server-side auth for anything
 * internet-facing.
 */
const ADMIN_USER = "BOSS";
const ADMIN_PASSWORD_SHA256 =
  "c7356f6e41312ae224620c0782081e501fd078e2b70e72140a28ad2b6dd137fa";

export const AUTH_STORAGE_KEY = "ce-empire-auth";

export function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const users = useStore((s) => s.users);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checking) return;
    setError("");
    setChecking(true);
    try {
      const name = username.trim();
      const hashed = await sha256Hex(password);
      const isAdmin = name === ADMIN_USER && hashed === ADMIN_PASSWORD_SHA256;
      const matchesUser = users.some(
        (u) => u.username === name && u.passwordHash === hashed
      );
      // Constant-ish delay to avoid trivial timing differences.
      await new Promise((r) => setTimeout(r, 350));
      if (!isAdmin && !matchesUser) {
        setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        setPassword("");
        return;
      }
      sessionStorage.setItem(AUTH_STORAGE_KEY, "1");
      onSuccess();
    } catch {
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองอีกครั้ง");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="ce-empire relative grid min-h-screen place-items-center overflow-hidden px-5 font-sans">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,transparent_45%,rgba(0,0,0,0.6)_100%)]" />
      <form
        onSubmit={submit}
        className="ce-panel ce-rise-2 relative z-10 w-full max-w-sm rounded-3xl p-8"
      >
        <div className="flex flex-col items-center text-center">
          <Crown className="ce-anim-crown size-10 ce-gold-text" />
          <div className="mt-3 text-3xl font-black">
            <span className="ce-chrome-text">CE</span>
            <span className="ml-2 align-middle text-base font-light tracking-[0.4em] ce-gold-text">
              EMPIRE
            </span>
          </div>
          <p className="mt-2 text-xs tracking-[0.3em] text-white/45">
            COMMAND CENTER ACCESS
          </p>
        </div>

        <div className="my-6 ce-divider" />

        <label className="mb-1.5 block text-xs text-white/50">ชื่อผู้ใช้</label>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 focus-within:border-[#d4af37]/50">
          <User className="size-4 text-white/40" />
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            placeholder="BOSS"
            className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/25"
          />
        </div>

        <label className="mb-1.5 mt-4 block text-xs text-white/50">รหัสผ่าน</label>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 focus-within:border-[#d4af37]/50">
          <Lock className="size-4 text-white/40" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/25"
          />
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            <ShieldAlert className="size-4" /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={checking}
          className={cn(
            "ce-cta mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold tracking-wide text-white",
            checking && "opacity-70"
          )}
        >
          {checking ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              เข้าสู่ศูนย์บัญชาการ
              <ArrowRight className="size-4 text-[#d4af37]" />
            </>
          )}
        </button>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-white/30">
          <Lock className="size-3" /> เข้าถึงเฉพาะผู้ได้รับอนุญาตเท่านั้น
        </p>
      </form>
    </div>
  );
}
