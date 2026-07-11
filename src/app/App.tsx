import { useState, useEffect } from "react";
import { Home, Search, Clock, X, Eye, EyeOff, ArrowLeft, Upload, Star, AlertCircle } from "lucide-react";
import { Toaster, toast } from "sonner";
import { motion } from "motion/react";

// ─── Types ────────────────────────────────────────────────────────────────────
type AppPage = "login" | "register" | "home" | "search" | "user-profile" | "history";
type HistoryTab = "received" | "given";
type ScoreValue = 1 | -1;

interface User {
  id: string;
  username: string;
  score: number;
  emoji: string;
  bgColor: string;
}

interface FeedbackItem {
  id: string;
  from: User;
  to?: User;
  score: ScoreValue;
  comment: string;
  date: string;
}

interface MeResponse {
  user: User;
  recentFeedback: FeedbackItem[];
}

interface HistoryResponse {
  received: FeedbackItem[];
  given: FeedbackItem[];
}

async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data as T;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
function Avatar({ user, size = "md" }: { user: User; size?: AvatarSize }) {
  const sizes: Record<AvatarSize, string> = {
    xs: "w-6 h-6 text-xs",
    sm: "w-9 h-9 text-lg",
    md: "w-11 h-11 text-2xl",
    lg: "w-14 h-14 text-3xl",
    xl: "w-20 h-20 text-4xl",
  };
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center flex-shrink-0 select-none`}
      style={{
        backgroundColor: user.bgColor,
        border: "2px solid rgba(168,85,247,0.25)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      {user.emoji}
    </div>
  );
}

// ─── Score Badge ──────────────────────────────────────────────────────────────
function ScoreBadge({ score, large = false }: { score: number; large?: boolean }) {
  const pos = score >= 0;
  const base = "inline-flex items-center justify-center font-bold rounded-full";
  const size = large ? "px-4 py-1.5 text-lg" : "px-2.5 py-0.5 text-sm";
  return (
    <span
      className={`${base} ${size} ${
        pos
          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
      }`}
    >
      {pos ? "+" : ""}{score}
    </span>
  );
}

// ─── Score Chip (for feedback cards: +1 / -1) ─────────────────────────────────
function ScoreChip({ score }: { score: ScoreValue }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-xs font-black flex-shrink-0 ${
        score === 1
          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
      }`}
    >
      {score === 1 ? "+1" : "−1"}
    </span>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "secondary" | "danger" | "ghost";
type BtnSize = "sm" | "md" | "lg";

function Btn({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  fullWidth = false,
  size = "md",
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: BtnSize;
  className?: string;
  type?: "button" | "submit";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-bold rounded-2xl transition-all duration-150 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60";
  const sizes: Record<BtnSize, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-6 py-3.5 text-base",
  };
  const variants: Record<BtnVariant, string> = {
    primary:
      "bg-purple-500 text-white hover:bg-purple-400 active:scale-95 shadow-lg shadow-purple-500/20",
    secondary:
      "bg-[#231d3a] text-purple-200 border border-[#3d3560] hover:bg-[#2d2550] active:scale-95",
    danger:
      "bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 active:scale-95",
    ghost:
      "text-purple-300 hover:bg-purple-500/10 active:scale-95",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${
        disabled ? "opacity-40 cursor-not-allowed !active:scale-100" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  rightElement,
  error,
}: {
  label?: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rightElement?: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-purple-200/80">{label}</label>
      )}
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-[#1e1535] border rounded-2xl px-4 py-3 text-white placeholder-[#4a4070] focus:outline-none focus:ring-2 transition-all ${
            error
              ? "border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/20"
              : "border-[#2d2550] focus:border-purple-500 focus:ring-purple-500/20"
          } ${rightElement ? "pr-12" : ""}`}
        />
        {rightElement && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      {error && <p className="text-xs text-rose-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
}

// ─── Search Bar ───────────────────────────────────────────────────────────────
function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5a5080] w-5 h-5 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search users by username…"
        className="w-full bg-[#1e1535] border border-[#2d2550] rounded-2xl pl-12 pr-10 py-3 text-white placeholder-[#4a4070] focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5a5080] hover:text-white transition-colors p-0.5 rounded-lg hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-[#161028] border border-[#2d2550] rounded-3xl ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Feedback Card ────────────────────────────────────────────────────────────
function FeedbackCard({ item }: { item: FeedbackItem }) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Avatar user={item.from} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-bold text-white text-sm">{item.from.username}</span>
            <div className="flex items-center gap-2">
              <ScoreChip score={item.score} />
              <span className="text-xs text-[#4a4070] font-medium">{item.date}</span>
            </div>
          </div>
          <p className="text-[#9b8fc8] text-sm mt-1.5 leading-relaxed">{item.comment}</p>
        </div>
      </div>
    </Card>
  );
}

// ─── User Card (search result) ────────────────────────────────────────────────
function UserCard({ user, onClick }: { user: User; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-[#161028] border border-[#2d2550] rounded-3xl p-4 flex items-center gap-3 hover:border-purple-500/50 hover:bg-[#1c1532] transition-all text-left active:scale-[0.98] group"
    >
      <Avatar user={user} />
      <div className="flex-1 min-w-0">
        <div className="font-bold text-white group-hover:text-purple-300 transition-colors">
          @{user.username}
        </div>
        <div className="text-xs text-[#5a5080] font-medium mt-0.5">Reputation score</div>
      </div>
      <ScoreBadge score={user.score} />
    </button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`skeleton-shimmer rounded-2xl ${className}`} />
  );
}

function FeedbackCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-2.5 pt-0.5">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-14" />
          </div>
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-4/5" />
        </div>
      </div>
    </Card>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({
  emoji,
  title,
  subtitle,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center animate-fade-in">
      <div className="text-5xl">{emoji}</div>
      <h3 className="text-base font-bold text-white">{title}</h3>
      {subtitle && (
        <p className="text-[#8b7fc0] text-sm max-w-[230px] leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────
function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="w-14 h-14 bg-rose-500/15 rounded-full flex items-center justify-center">
        <AlertCircle className="w-7 h-7 text-rose-400" />
      </div>
      <div>
        <h3 className="font-bold text-white mb-1">Something went wrong</h3>
        <p className="text-[#8b7fc0] text-sm">{message}</p>
      </div>
      {onRetry && (
        <Btn onClick={onRetry} variant="secondary" size="sm">Try again</Btn>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        className="relative bg-[#161028] border border-[#2d2550] rounded-3xl w-full max-w-md p-6 flex flex-col gap-5 shadow-2xl"
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-[#5a5080] hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "home" as AppPage,    label: "Home",    Icon: Home   },
  { id: "search" as AppPage,  label: "Search",  Icon: Search },
  { id: "history" as AppPage, label: "History", Icon: Clock  },
];

function BottomNav({
  active,
  onNavigate,
}: {
  active: AppPage;
  onNavigate: (page: AppPage) => void;
}) {
  const resolvedActive =
    active === "user-profile" ? "search" : active;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0d0b14] border-t border-[#2d2550] z-40 safe-area-pb">
      <div className="max-w-lg mx-auto flex">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = resolvedActive === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors relative ${
                isActive ? "text-purple-400" : "text-[#4a4070] hover:text-purple-400"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-purple-500 rounded-full"
                />
              )}
              <div
                className={`p-1.5 rounded-xl transition-colors ${
                  isActive ? "bg-purple-500/15" : ""
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Feedback Modal ───────────────────────────────────────────────────────────
function FeedbackModal({
  isOpen,
  onClose,
  onSubmit,
  targetUser,
  feedbackType,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
  targetUser: User | null;
  feedbackType: ScoreValue;
}) {
  const [comment, setComment] = useState("");
  const MAX = 280;

  const handleSubmit = () => {
    if (!comment.trim()) return;
    onSubmit(comment.trim());
    setComment("");
  };

  const handleClose = () => {
    setComment("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Leave your feedback">
      {targetUser && (
        <div className="flex items-center gap-3 bg-[#231d3a] rounded-2xl p-3 border border-[#3d3560]">
          <Avatar user={targetUser} size="sm" />
          <div>
            <div className="text-sm font-bold text-white">@{targetUser.username}</div>
            <div
              className={`text-xs font-bold mt-0.5 ${
                feedbackType === 1 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {feedbackType === 1 ? "👍 Positive feedback" : "👎 Negative feedback"}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-purple-200/80">Your comment</label>
          <span
            className={`text-xs font-medium tabular-nums ${
              comment.length >= MAX * 0.9 ? "text-rose-400" : "text-[#5a5080]"
            }`}
          >
            {comment.length}/{MAX}
          </span>
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, MAX))}
          placeholder="Share your experience with this user…"
          rows={4}
          className="w-full bg-[#1e1535] border border-[#2d2550] rounded-2xl px-4 py-3 text-white placeholder-[#4a4070] focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none text-sm leading-relaxed"
        />
        {!comment.trim() && (
          <p className="text-xs text-[#5a5080] flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-[#5a5080] flex-shrink-0" />
            A comment is required before submitting
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Btn onClick={handleClose} variant="secondary" fullWidth>Cancel</Btn>
        <Btn onClick={handleSubmit} disabled={!comment.trim()} fullWidth>
          Submit
        </Btn>
      </div>
    </Modal>
  );
}

// ─── History Detail Modal ─────────────────────────────────────────────────────
function HistoryDetailModal({
  isOpen,
  onClose,
  item,
  tab,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: FeedbackItem | null;
  tab: HistoryTab;
}) {
  if (!item) return null;
  const displayUser = tab === "received" ? item.from : item.to!;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Feedback detail">
      <div className="flex items-center gap-3 bg-[#231d3a] rounded-2xl p-3 border border-[#3d3560]">
        <Avatar user={displayUser} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white">@{displayUser.username}</div>
          <div className="text-xs text-[#5a5080] mt-0.5">{item.date}</div>
        </div>
        <ScoreChip score={item.score} />
      </div>
      <div className="bg-[#1e1535] rounded-2xl p-4 border border-[#2d2550]">
        <p className="text-[#c4b5fd] text-sm leading-relaxed">{item.comment}</p>
      </div>
      <Btn onClick={onClose} variant="secondary" fullWidth>Close</Btn>
    </Modal>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage({
  onLogin,
  onGoRegister,
}: {
  onLogin: (user: User, recentFeedback: FeedbackItem[]) => void;
  onGoRegister: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string; form?: string }>({});

  const handleLogin = async () => {
    const e: typeof errors = {};
    if (!username.trim()) e.username = "Username is required";
    if (!password) e.password = "Password is required";
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setIsLoading(true);
    try {
      const loginData = await api<{ user: User }>("/api/auth/login/", {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const meData = await api<MeResponse>("/api/auth/me/");
      onLogin(loginData.user, meData.recentFeedback);
      toast.success(`Welcome back, ${loginData.user.username}! 🎉`);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Could not sign in" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0b14] flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-sm flex flex-col gap-8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-16 h-16 bg-purple-500 rounded-3xl flex items-center justify-center text-3xl shadow-xl"
            style={{ boxShadow: "0 8px 32px rgba(168,85,247,0.4)" }}
          >
            <Star className="w-8 h-8 text-white fill-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-white tracking-tight">RepuStar</h1>
            <p className="text-[#8b7fc0] text-sm mt-1">Build your reputation, one star at a time ✨</p>
          </div>
        </div>

        <Card className="p-6 flex flex-col gap-4">
          <h2 className="text-lg font-black text-white">Welcome back! 👋</h2>
          {errors.form && <p className="text-sm text-rose-400 font-semibold">{errors.form}</p>}
          <Input
            label="Username"
            value={username}
            onChange={(v) => { setUsername(v); setErrors((e) => ({ ...e, username: undefined, form: undefined })); }}
            placeholder="your_username"
            error={errors.username}
          />
          <Input
            label="Password"
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: undefined, form: undefined })); }}
            placeholder="••••••••"
            error={errors.password}
            rightElement={
              <button
                onClick={() => setShowPw(!showPw)}
                className="text-[#5a5080] hover:text-purple-300 transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
          <Btn onClick={handleLogin} fullWidth disabled={isLoading} size="lg" className="mt-1">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in…
              </span>
            ) : (
              "Sign In"
            )}
          </Btn>
        </Card>

        <p className="text-center text-[#8b7fc0] text-sm">
          New here?{" "}
          <button
            onClick={onGoRegister}
            className="text-purple-400 font-bold hover:text-purple-300 transition-colors"
          >
            Create an account →
          </button>
        </p>
      </motion.div>
    </div>
  );
}

// ─── Register Page ────────────────────────────────────────────────────────────
function RegisterPage({ onGoLogin }: { onGoLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleRegister = async () => {
    const e: Record<string, string> = {};
    if (!username.trim()) e.username = "Username is required";
    if (username.trim().length < 3) e.username = "Must be at least 3 characters";
    if (!password) e.password = "Password is required";
    if (password.length < 6) e.password = "Must be at least 6 characters";
    if (!confirm) e.confirm = "Please confirm your password";
    if (password && confirm && password !== confirm) e.confirm = "Passwords don't match";
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setIsLoading(true);
    try {
      await api<{ user: User }>("/api/auth/register/", {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), password }),
      });
      toast.success("Account created! Please sign in ✨");
      onGoLogin();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Could not create account" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0b14] flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-sm flex flex-col gap-8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-16 h-16 bg-purple-500 rounded-3xl flex items-center justify-center text-3xl shadow-xl"
            style={{ boxShadow: "0 8px 32px rgba(168,85,247,0.4)" }}
          >
            <Star className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">RepuStar</h1>
        </div>

        <Card className="p-6 flex flex-col gap-4">
          <h2 className="text-lg font-black text-white">Create your account ✨</h2>
          {errors.form && <p className="text-sm text-rose-400 font-semibold">{errors.form}</p>}

          <div className="flex flex-col items-center gap-2 py-2">
            <button className="w-20 h-20 bg-[#231d3a] border-2 border-dashed border-[#3d3560] rounded-full flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-[#2a2450] transition-all group">
              <Upload className="w-6 h-6 text-[#5a5080] group-hover:text-purple-400 transition-colors" />
            </button>
            <span className="text-xs text-[#5a5080] font-medium">Avatar is auto-generated for now</span>
          </div>

          <Input
            label="Username"
            value={username}
            onChange={(v) => { setUsername(v); setErrors((e) => ({ ...e, username: "", form: "" })); }}
            placeholder="choose_username"
            error={errors.username}
          />
          <Input
            label="Password"
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: "", form: "" })); }}
            placeholder="••••••••"
            error={errors.password}
            rightElement={
              <button onClick={() => setShowPw(!showPw)} className="text-[#5a5080] hover:text-purple-300 transition-colors">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
          <Input
            label="Confirm Password"
            type="password"
            value={confirm}
            onChange={(v) => { setConfirm(v); setErrors((e) => ({ ...e, confirm: "", form: "" })); }}
            placeholder="••••••••"
            error={errors.confirm}
          />

          <Btn onClick={handleRegister} fullWidth disabled={isLoading} size="lg" className="mt-1">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account…
              </span>
            ) : (
              "Create Account"
            )}
          </Btn>
        </Card>

        <p className="text-center text-[#8b7fc0] text-sm">
          Already have an account?{" "}
          <button
            onClick={onGoLogin}
            className="text-purple-400 font-bold hover:text-purple-300 transition-colors"
          >
            Sign in →
          </button>
        </p>
      </motion.div>
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────
function HomePage({ me, recentFeedback, isLoading }: { me: User; recentFeedback: FeedbackItem[]; isLoading: boolean }) {
  const positiveCount = recentFeedback.filter((f) => f.score === 1).length;
  const negativeCount = recentFeedback.filter((f) => f.score === -1).length;

  return (
    <div className="flex flex-col gap-5 pb-24 animate-fade-in">
      <Card className="p-6 flex flex-col items-center gap-4 text-center">
        {isLoading ? (
          <>
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="flex flex-col items-center gap-2.5 w-full">
              <Skeleton className="h-5 w-32 mx-auto" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </div>
            <Skeleton className="h-14 w-52 mx-auto rounded-2xl" />
          </>
        ) : (
          <>
            <div className="relative">
              <Avatar user={me} size="xl" />
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-400 rounded-full border-2 border-[#161028]" title="Online" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">@{me.username}</h2>
              <p className="text-[#8b7fc0] text-sm font-medium mt-0.5">Member profile</p>
            </div>

            <div className="w-full bg-[#231d3a] rounded-2xl px-5 py-4 border border-[#3d3560] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center"
                  style={{ border: "1px solid rgba(168,85,247,0.3)" }}
                >
                  <Star className="w-5 h-5 text-purple-400 fill-purple-400" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-[#8b7fc0] font-semibold">Reputation Score</div>
                  <div className="text-[10px] text-[#5a5080] font-medium mt-0.5">
                    {recentFeedback.length} recent review{recentFeedback.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
              <ScoreBadge score={me.score} large />
            </div>

            <div className="w-full grid grid-cols-2 gap-3">
              <div className="bg-emerald-500/10 rounded-2xl p-3 border border-emerald-500/20 text-center">
                <div className="text-lg font-black text-emerald-400">+{positiveCount}</div>
                <div className="text-xs text-emerald-400/60 font-semibold mt-0.5">Positive</div>
              </div>
              <div className="bg-rose-500/10 rounded-2xl p-3 border border-rose-500/20 text-center">
                <div className="text-lg font-black text-rose-400">−{negativeCount}</div>
                <div className="text-xs text-rose-400/60 font-semibold mt-0.5">Negative</div>
              </div>
            </div>
          </>
        )}
      </Card>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-black text-white uppercase tracking-widest px-1 text-[#8b7fc0]">
          Recent Feedback
        </h3>
        {isLoading ? (
          <>
            <FeedbackCardSkeleton />
            <FeedbackCardSkeleton />
            <FeedbackCardSkeleton />
          </>
        ) : recentFeedback.length === 0 ? (
          <EmptyState
            emoji="💌"
            title="No feedback yet"
            subtitle="Once people leave you feedback, it'll show up here!"
          />
        ) : (
          recentFeedback.map((item) => <FeedbackCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}

// ─── Search Page// ─── Search Page ──────────────────────────────────────────────────────────────
function SearchPage({ onSelectUser }: { onSelectUser: (user: User) => void }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setUsers([]);
      setErrorMessage("");
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    api<{ users: User[] }>(`/api/users/?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
      .then((data) => {
        setUsers(data.users);
        setErrorMessage("");
      })
      .catch((err) => {
        if (err.name !== "AbortError") setErrorMessage(err instanceof Error ? err.message : "Could not search users");
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [query]);

  return (
    <div className="flex flex-col gap-4 pb-24 animate-fade-in">
      <SearchBar value={query} onChange={setQuery} />

      {query === "" ? (
        <EmptyState
          emoji="🔍"
          title="Find users"
          subtitle="Type a username to search for people and view their reputation."
        />
      ) : errorMessage ? (
        <ErrorState message={errorMessage} />
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          <FeedbackCardSkeleton />
          <FeedbackCardSkeleton />
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          emoji="😕"
          title="No users found"
          subtitle={`Nobody matched "${query}". Try a different spelling.`}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-[#5a5080] font-bold px-1 uppercase tracking-wider">
            {users.length} result{users.length !== 1 ? "s" : ""}
          </p>
          {users.map((user) => (
            <UserCard key={user.id} user={user} onClick={() => onSelectUser(user)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── User Profile Page ────────────────────────────────────────────────────────
function UserProfilePage({
  user,
  onBack,
  onFeedback,
}: {
  user: User;
  onBack: () => void;
  onFeedback: (type: ScoreValue) => void;
}) {
  const [profileUser, setProfileUser] = useState(user);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setIsLoading(true);
    api<{ user: User; feedback: FeedbackItem[] }>(`/api/users/${user.id}/`)
      .then((data) => {
        setProfileUser(data.user);
        setFeedback(data.feedback);
        setErrorMessage("");
      })
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : "Could not load profile"))
      .finally(() => setIsLoading(false));
  }, [user.id]);

  const posCount = feedback.filter((f) => f.score === 1).length;
  const negCount = feedback.filter((f) => f.score === -1).length;

  return (
    <div className="flex flex-col gap-5 pb-24 animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors w-fit font-bold text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Search
      </button>

      {errorMessage ? (
        <ErrorState message={errorMessage} />
      ) : (
        <>
          <Card className="p-6 flex flex-col items-center gap-4 text-center">
            <Avatar user={profileUser} size="xl" />
            <div>
              <h2 className="text-xl font-black text-white">@{profileUser.username}</h2>
            </div>

            <div className="w-full bg-[#231d3a] rounded-2xl px-5 py-4 border border-[#3d3560] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                  <Star className="w-5 h-5 text-purple-400 fill-purple-400" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-[#8b7fc0] font-semibold">Reputation Score</div>
                  <div className="text-[10px] text-[#5a5080] font-medium mt-0.5">{feedback.length} reviews</div>
                </div>
              </div>
              <ScoreBadge score={profileUser.score} large />
            </div>

            {feedback.length > 0 && (
              <div className="w-full grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/10 rounded-2xl p-3 border border-emerald-500/20 text-center">
                  <div className="text-lg font-black text-emerald-400">+{posCount}</div>
                  <div className="text-xs text-emerald-400/60 font-semibold mt-0.5">Positive</div>
                </div>
                <div className="bg-rose-500/10 rounded-2xl p-3 border border-rose-500/20 text-center">
                  <div className="text-lg font-black text-rose-400">−{negCount}</div>
                  <div className="text-xs text-rose-400/60 font-semibold mt-0.5">Negative</div>
                </div>
              </div>
            )}

            <div className="flex gap-3 w-full pt-1">
              <button
                onClick={() => onFeedback(1)}
                className="flex-1 bg-emerald-500/12 border border-emerald-500/30 text-emerald-400 rounded-2xl py-4 flex flex-col items-center gap-1.5 font-black text-lg hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all active:scale-95"
              >
                <span className="text-2xl leading-none">👍</span>
                <span className="text-sm">Give +1</span>
              </button>
              <button
                onClick={() => onFeedback(-1)}
                className="flex-1 bg-rose-500/12 border border-rose-500/30 text-rose-400 rounded-2xl py-4 flex flex-col items-center gap-1.5 font-black text-lg hover:bg-rose-500/20 hover:border-rose-500/50 transition-all active:scale-95"
              >
                <span className="text-2xl leading-none">👎</span>
                <span className="text-sm">Give −1</span>
              </button>
            </div>
          </Card>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-black uppercase tracking-widest px-1 text-[#8b7fc0]">
              All Feedback
            </h3>
            {isLoading ? (
              <>
                <FeedbackCardSkeleton />
                <FeedbackCardSkeleton />
              </>
            ) : feedback.length === 0 ? (
              <EmptyState
                emoji="💌"
                title="No feedback yet"
                subtitle="Be the first to leave feedback for this user!"
              />
            ) : (
              feedback.map((item) => <FeedbackCard key={item.id} item={item} />)
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── History Page ─────────────────────────────────────────────────────────────
function HistoryPage({
  history,
  onOpenDetail,
}: {
  history: HistoryResponse;
  onOpenDetail: (item: FeedbackItem, tab: HistoryTab) => void;
}) {
  const [tab, setTab] = useState<HistoryTab>("received");
  const items = tab === "received" ? history.received : history.given;

  return (
    <div className="flex flex-col gap-4 pb-24 animate-fade-in">
      <div className="flex bg-[#161028] border border-[#2d2550] rounded-2xl p-1 gap-1">
        {(["received", "given"] as HistoryTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === t
                ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                : "text-[#8b7fc0] hover:text-white"
            }`}
          >
            {t === "received" ? "📬 Received" : "📤 Given"}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          emoji={tab === "received" ? "📬" : "📤"}
          title={tab === "received" ? "No feedback received" : "No feedback given"}
          subtitle={
            tab === "received"
              ? "When someone rates you, it'll appear here."
              : "When you rate someone, it'll appear here."
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const isReceived = tab === "received";
            const otherUser = isReceived ? item.from : item.to!;
            const scoreColor = item.score === 1 ? "text-emerald-400" : "text-rose-400";

            return (
              <button
                key={item.id}
                onClick={() => onOpenDetail(item, tab)}
                className="w-full bg-[#161028] border border-[#2d2550] rounded-3xl p-4 flex items-center gap-3 hover:border-purple-500/50 hover:bg-[#1c1532] transition-all text-left active:scale-[0.98] group"
              >
                <Avatar user={otherUser} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#c4b5fd] leading-snug">
                    {isReceived ? (
                      <>
                        <span className="font-bold text-white">{item.from.username}</span>
                        {" gave you "}
                        <span className={`font-black ${scoreColor}`}>
                          {item.score === 1 ? "+1" : "−1"}
                        </span>
                      </>
                    ) : (
                      <>
                        {"You gave "}
                        <span className="font-bold text-white">{item.to?.username}</span>
                        {" "}
                        <span className={`font-black ${scoreColor}`}>
                          {item.score === 1 ? "+1" : "−1"}
                        </span>
                      </>
                    )}
                  </p>
                  <span className="text-xs text-[#5a5080] font-medium mt-0.5 block">{item.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ScoreChip score={item.score} />
                  <span className="text-[#3d3560] group-hover:text-purple-500 transition-colors text-xs">›</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
function AppShell({
  me,
  recentFeedback,
  onMeUpdate,
  onLogout,
}: {
  me: User;
  recentFeedback: FeedbackItem[];
  onMeUpdate: (user: User, recentFeedback: FeedbackItem[]) => void;
  onLogout: () => void;
}) {
  const [page, setPage] = useState<AppPage>("home");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<ScoreValue>(1);
  const [historyDetail, setHistoryDetail] = useState<FeedbackItem | null>(null);
  const [historyDetailTab, setHistoryDetailTab] = useState<HistoryTab>("received");
  const [history, setHistory] = useState<HistoryResponse>({ received: [], given: [] });
  const [isHomeLoading, setIsHomeLoading] = useState(false);

  const refreshMe = async () => {
    setIsHomeLoading(true);
    try {
      const data = await api<MeResponse>("/api/auth/me/");
      onMeUpdate(data.user, data.recentFeedback);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not refresh profile");
    } finally {
      setIsHomeLoading(false);
    }
  };

  const refreshHistory = async () => {
    try {
      const data = await api<HistoryResponse>("/api/feedback/history/");
      setHistory(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load history");
    }
  };

  useEffect(() => {
    refreshHistory();
  }, []);

  const handleNavigate = (p: AppPage) => {
    if (p !== "user-profile") setSelectedUser(null);
    if (p === "home") refreshMe();
    if (p === "history") refreshHistory();
    setPage(p);
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setPage("user-profile");
  };

  const handleFeedbackOpen = (type: ScoreValue) => {
    setFeedbackType(type);
    setFeedbackModal(true);
  };

  const handleFeedbackSubmit = async (comment: string) => {
    if (!selectedUser) return;

    try {
      const data = await api<{ feedback: FeedbackItem; user: User }>("/api/feedback/", {
        method: "POST",
        body: JSON.stringify({ toUserId: selectedUser.id, score: feedbackType, comment }),
      });
      setSelectedUser(data.user);
      setFeedbackModal(false);
      refreshHistory();
      toast.success(
        feedbackType === 1
          ? `👍 Positive feedback sent to @${selectedUser.username}!`
          : `👎 Negative feedback sent to @${selectedUser.username}.`,
        { duration: 3000 }
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit feedback");
    }
  };

  const handleLogout = async () => {
    await api<{ ok: boolean }>("/api/auth/logout/", { method: "POST" }).catch(() => null);
    onLogout();
  };

  const handleOpenHistoryDetail = (item: FeedbackItem, tab: HistoryTab) => {
    setHistoryDetail(item);
    setHistoryDetailTab(tab);
  };

  const PAGE_TITLES: Partial<Record<AppPage, string>> = {
    home: "My Profile",
    search: "Search",
    history: "History",
    "user-profile": selectedUser ? `@${selectedUser.username}` : "Profile",
  };

  return (
    <div className="min-h-screen bg-[#0d0b14]">
      <header className="sticky top-0 bg-[#0d0b14]/90 backdrop-blur-md border-b border-[#2d2550] z-30">
        <div className="max-w-lg mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ boxShadow: "0 2px 12px rgba(168,85,247,0.4)" }}
            >
              <Star className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-black text-white text-lg tracking-tight">
              {PAGE_TITLES[page]}
            </span>
          </div>
          {page === "home" && (
            <button
              onClick={handleLogout}
              className="text-xs text-[#5a5080] hover:text-white border border-[#2d2550] rounded-xl px-3 py-1.5 font-semibold transition-all hover:border-[#3d3560]"
            >
              Sign out
            </button>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5">
        {page === "home" && <HomePage me={me} recentFeedback={recentFeedback} isLoading={isHomeLoading} />}
        {page === "search" && <SearchPage onSelectUser={handleSelectUser} />}
        {page === "user-profile" && selectedUser && (
          <UserProfilePage
            user={selectedUser}
            onBack={() => setPage("search")}
            onFeedback={handleFeedbackOpen}
          />
        )}
        {page === "history" && (
          <HistoryPage history={history} onOpenDetail={handleOpenHistoryDetail} />
        )}
      </main>

      <BottomNav active={page} onNavigate={handleNavigate} />

      <FeedbackModal
        isOpen={feedbackModal}
        onClose={() => setFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
        targetUser={selectedUser}
        feedbackType={feedbackType}
      />

      <HistoryDetailModal
        isOpen={!!historyDetail}
        onClose={() => setHistoryDetail(null)}
        item={historyDetail}
        tab={historyDetailTab}
      />
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [authPage, setAuthPage] = useState<"login" | "register">("login");
  const [me, setMe] = useState<User | null>(null);
  const [recentFeedback, setRecentFeedback] = useState<FeedbackItem[]>([]);
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    api<MeResponse>("/api/auth/me/")
      .then((data) => {
        setMe(data.user);
        setRecentFeedback(data.recentFeedback);
      })
      .catch(() => null)
      .finally(() => setIsBooting(false));
  }, []);

  const handleLogin = (user: User, feedback: FeedbackItem[]) => {
    setMe(user);
    setRecentFeedback(feedback);
  };

  const handleLogout = () => {
    setMe(null);
    setRecentFeedback([]);
  };

  return (
    <>
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          style: {
            background: "#1e1535",
            border: "1px solid #3d3560",
            color: "#ede8ff",
            fontFamily: "Nunito, sans-serif",
            fontWeight: 600,
            borderRadius: "1rem",
          },
        }}
      />
      {isBooting ? (
        <div className="min-h-screen bg-[#0d0b14] flex items-center justify-center text-purple-200 font-bold">Loading…</div>
      ) : me ? (
        <AppShell
          me={me}
          recentFeedback={recentFeedback}
          onMeUpdate={(user, feedback) => { setMe(user); setRecentFeedback(feedback); }}
          onLogout={handleLogout}
        />
      ) : authPage === "login" ? (
        <LoginPage
          onLogin={handleLogin}
          onGoRegister={() => setAuthPage("register")}
        />
      ) : (
        <RegisterPage onGoLogin={() => setAuthPage("login")} />
      )}
    </>
  );
}
