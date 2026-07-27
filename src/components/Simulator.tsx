import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ROUNDS,
  START_TEAM_CASH,
  TEAM_ENTRY_FEE,
  ENTRY_FEE_PER_PERSON,
  MAX_BET_PER_ROUND,
  PLAYER_MIN_BET,
  PLAYER_MAX_BET,
  BET_STEP,
  BETTING_SECONDS,
  TWIST_MESSAGE,
  TWIST_VERIFY_KEYWORDS,
  TWIST_DECOY_REPLIES,
  HONEST_REPLIES,
  SCAM_DEFLECTIONS,
} from '../data/rounds.ts';
import type { RoundDef } from '../data/rounds.ts';
import { fmt } from '../lib/format.ts';
import {
  ShieldCheck,
  Clock,
  Coins,
  ArrowRight,
  RotateCcw,
  X,
  MessageCircleWarning,
  CheckCircle2,
  XCircle,
  Undo2,
  Trophy,
  Bot,
  User,
  Lock,
  Users,
  Target,
} from 'lucide-react';

type Phase = 'rooms' | 'fee' | 'story' | 'discussion' | 'betting' | 'reveal' | 'summary';
type Tier = 'big-success' | 'success' | 'refund' | 'scammed';

interface HumanState {
  believesScam: boolean;
  amount: number;
}

interface MemberBet {
  label: string;
  amount: number;
  isComputer: boolean;
  believesScam?: boolean;
}

interface QAEntry {
  question: string;
  answer: string;
}

interface LogEntry {
  round: RoundDef;
  bet: number;
  tier: Tier;
  delta: number;
  rivalAfter: number;
}

const HUMAN_LABELS = ['玩家一', '玩家二', '玩家三'];
const COMPUTER_LABELS = ['電腦隊友 D', '電腦隊友 E'];
const TICKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function computeOutcome(bet: number, round: RoundDef): { tier: Tier; delta: number; returned: number } {
  if (round.isScam) {
    return { tier: 'scammed', delta: -bet, returned: 0 };
  }
  if (bet < round.requestAmount) {
    return { tier: 'refund', delta: 0, returned: bet };
  }
  // 報恩金額只無條件捨去到百位，保留 500 這類零頭
  const payout = Math.floor((bet * 1.5) / 100) * 100;
  const tier: Tier = bet >= Math.round(round.requestAmount * 1.3) ? 'big-success' : 'success';
  return { tier, delta: payout - bet, returned: payout };
}

function computerJudgesScam(isScamTruth: boolean): boolean {
  return isScamTruth ? Math.random() < 0.65 : Math.random() < 0.2;
}

function computerDecision(isScamTruth: boolean): { amount: number; believesScam: boolean } {
  const believesScam = computerJudgesScam(isScamTruth);
  return { amount: believesScam ? 0 : PLAYER_MAX_BET, believesScam };
}

// 對手隊伍的模擬投注——詐騙關容易重壓、誠實關偷輸保守，設計上讓對手隊整體表現偏弱
 function simulateRivalRound(round: RoundDef): number {
  const maxSteps = MAX_BET_PER_ROUND / 1000;
  const steps = round.isScam
    ? Math.round((0.5 + Math.random() * 0.5) * maxSteps)
    : Math.round(Math.random() * 0.5 * maxSteps);
  const bet = steps * 1000;
  return computeOutcome(bet, round).delta;
}

function freshHumans(): HumanState[] {
  return [
    { believesScam: false, amount: 5000 },
    { believesScam: false, amount: 5000 },
    { believesScam: false, amount: 5000 },
  ];
}

const TIER_META: Record<
  Tier,
  { label: string; color: string; icon: ReactNode; returnLabel: string; headline: string }
> = {
  'big-success': {
    label: '大成功',
    color: 'text-blue-700 border-blue-200 bg-blue-50',
    icon: <CheckCircle2 className="w-5 h-5" />,
    returnLabel: '對方報恩，如數奉還（本金 1.5 倍）',
    headline: '你做了一件好事！對方回來跟你報恩！',
  },
  success: {
    label: '成功',
    color: 'text-emerald-700 border-emerald-200 bg-emerald-50',
    icon: <CheckCircle2 className="w-5 h-5" />,
    returnLabel: '對方報恩，如數奉還（本金 1.5 倍）',
    headline: '你做了一件好事！對方回來跟你報恩！',
  },
  refund: {
    label: '普通（全額退還）',
    color: 'text-amber-700 border-amber-200 bg-amber-50',
    icon: <Undo2 className="w-5 h-5" />,
    returnLabel: '金額未達標，不算集資成功，原封不動退回',
    headline: '你錯過了對方的求助……',
  },
  scammed: {
    label: '被騙！',
    color: 'text-rose-700 border-rose-200 bg-rose-50',
    icon: <XCircle className="w-5 h-5" />,
    returnLabel: '對方是騙子，一毛都拿不回來',
    headline: '你被騙了 👻',
  },
};

function TeamCard({ name, money, highlight }: { name: string; money: number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 border text-center ${highlight ? 'border-blue-300 bg-blue-50' : 'border-slate-100 bg-white'}`}>
      <p className="text-xs text-slate-400 mb-1">{name}</p>
      <p className="font-mono font-black text-lg text-[#0E2A5E]">{fmt(money)}</p>
    </div>
  );
}

function RoomCard({
  round,
  index,
  status,
  onClick,
}: {
  round: RoundDef;
  index: number;
  status: 'locked' | 'available' | 'done';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={status !== 'available'}
      className={`relative rounded-2xl border p-4 sm:p-5 text-center transition flex flex-col items-center gap-2 ${
        status === 'available'
          ? 'border-blue-300 bg-blue-50 hover:bg-blue-100 cursor-pointer pulse-glow'
          : status === 'done'
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
      }`}
    >
      {status === 'done' && <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute top-2 right-2" />}
      {status === 'locked' && <Lock className="w-4 h-4 text-slate-400 absolute top-2 right-2" />}
      <div className="text-3xl">{status === 'locked' ? '🚪' : round.emoji}</div>
      <p className="text-[10px] text-slate-400">會議室 0{index + 1}</p>
      <p className="font-bold text-xs sm:text-sm text-[#0E2A5E]">{status === 'locked' ? '？？？' : round.role}</p>
    </button>
  );
}

function TickSlider({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex-1">
      <input
        type="range"
        min={PLAYER_MIN_BET}
        max={PLAYER_MAX_BET}
        step={BET_STEP}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-600 disabled:opacity-30"
      />
      <div className="flex justify-between text-[9px] text-slate-400 px-0.5 mt-0.5 font-mono">
        {TICKS.map((n) => (
          <span key={n}>{n === 10 ? '10' : n}</span>
        ))}
      </div>
    </div>
  );
}

export default function Simulator({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<Phase>('rooms');
  const [roundIdx, setRoundIdx] = useState(0);
  const [completed, setCompleted] = useState<boolean[]>(ROUNDS.map(() => false));
  const [teamMoney, setTeamMoney] = useState(START_TEAM_CASH);
  const [rivalMoney, setRivalMoney] = useState(START_TEAM_CASH);

  const [qaLog, setQaLog] = useState<QAEntry[]>([]);
  const [questionInput, setQuestionInput] = useState('');

  const [humans, setHumans] = useState<HumanState[]>(freshHumans());
  const [compBets, setCompBets] = useState<[number, number]>([0, 0]);
  const [compBeliefs, setCompBeliefs] = useState<[boolean, boolean]>([false, false]);
  const [bettingLocked, setBettingLocked] = useState(false);

  const [bettingLeft, setBettingLeft] = useState(BETTING_SECONDS);
  const [twistLog, setTwistLog] = useState<QAEntry[]>([]);
  const [twistInput, setTwistInput] = useState('');
  const [verifiedTwist, setVerifiedTwist] = useState<boolean | null>(null);
  const [checked165, setChecked165] = useState(false);
  const [check165Result, setCheck165Result] = useState<boolean | null>(null);

  const [log, setLog] = useState<LogEntry[]>([]);
  const [lastResult, setLastResult] = useState<{
    tier: Tier;
    delta: number;
    bet: number;
    returned: number;
    newTeamMoney: number;
    members: MemberBet[];
    rivalAfter: number;
  } | null>(null);
  const [shake, setShake] = useState(false);

  const round = ROUNDS[roundIdx];
  const isLastRound = roundIdx === ROUNDS.length - 1;
  const totalBet =
    humans.reduce((s, h) => s + (h.believesScam ? 0 : h.amount), 0) + compBets[0] + compBets[1];

  useEffect(() => {
    if (phase !== 'betting') return;
    if (bettingLeft <= 0) {
      confirmBet();
      return;
    }
    const t = setTimeout(() => setBettingLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, bettingLeft]);

  function enterRoom(idx: number) {
    if (idx !== 0 && !completed[idx - 1]) return;
    setRoundIdx(idx);
    setQaLog([]);
    setQuestionInput('');
    setChecked165(false);
    setCheck165Result(null);
    setVerifiedTwist(null);
    setTwistLog([]);
    setTwistInput('');
    setBettingLocked(false);
    setPhase('fee');
  }

  function payFee() {
    setTeamMoney((m) => Math.max(0, m - TEAM_ENTRY_FEE));
    setPhase('story');
  }

  function askQuestion() {
    if (qaLog.length >= 1) return;
    const q = questionInput.trim();
    if (!q) return;
    const topic = round.qaTopics.find((t) => t.keywords.some((k) => q.includes(k)));
    let answer: string;
    if (topic) {
      answer = topic.reply;
    } else {
      const pool = round.isScam ? SCAM_DEFLECTIONS : HONEST_REPLIES;
      answer = pool[Math.floor(Math.random() * pool.length)];
    }
    setQaLog((l) => [...l, { question: q, answer }]);
    setQuestionInput('');
  }

  function goDiscussion() {
    if (isLastRound) {
      setVerifiedTwist(null);
      setTwistLog([]);
      setTwistInput('');
    }
    setPhase('discussion');
  }

  function askTwist() {
    const q = twistInput.trim();
    if (!q) return;
    const hit = TWIST_VERIFY_KEYWORDS.some((k) => q.includes(k));
    let answer: string;
    if (hit) {
      setVerifiedTwist(true);
      answer = round.revealTrue;
    } else {
      answer = TWIST_DECOY_REPLIES[Math.floor(Math.random() * TWIST_DECOY_REPLIES.length)];
    }
    setTwistLog((l) => [...l, { question: q, answer }]);
    setTwistInput('');
  }

  function startBettingPrep() {
    if (isLastRound && verifiedTwist === true) {
      // 求證成功：大家都知道是詐騙，直接鎖定不出錢，安全過關
      setHumans([
        { believesScam: true, amount: 0 },
        { believesScam: true, amount: 0 },
        { believesScam: true, amount: 0 },
      ]);
      setCompBets([0, 0]);
      setCompBeliefs([true, true]);
      setBettingLocked(true);
    } else {
      // 一般下注流程（包含「最終關但沒能及時求證」的情況：不強迫 All-in，回到正常判斷）
      setHumans(freshHumans());
      const d1 = computerDecision(round.isScam);
      const d2 = computerDecision(round.isScam);
      setCompBets([d1.amount, d2.amount]);
      setCompBeliefs([d1.believesScam, d2.believesScam]);
      setBettingLocked(false);
    }
    setBettingLeft(BETTING_SECONDS);
    setPhase('betting');
  }

  function toggleHumanScam(i: number) {
    setHumans((prev) => prev.map((h, idx) => (idx === i ? { ...h, believesScam: !h.believesScam } : h)));
  }

  function setHumanAmount(i: number, amount: number) {
    setHumans((prev) => prev.map((h, idx) => (idx === i ? { ...h, amount } : h)));
  }

  function query165() {
    setChecked165(true);
    setCheck165Result(round.isScam);
  }

  function confirmBet() {
    const memberAmounts = humans.map((h) => (h.believesScam ? 0 : h.amount));
    const members: MemberBet[] = [
      { label: HUMAN_LABELS[0], amount: memberAmounts[0], isComputer: false },
      { label: HUMAN_LABELS[1], amount: memberAmounts[1], isComputer: false },
      { label: HUMAN_LABELS[2], amount: memberAmounts[2], isComputer: false },
      { label: COMPUTER_LABELS[0], amount: compBets[0], isComputer: true, believesScam: compBeliefs[0] },
      { label: COMPUTER_LABELS[1], amount: compBets[1], isComputer: true, believesScam: compBeliefs[1] },
    ];
    const rawTotal = memberAmounts.reduce((a, b) => a + b, 0) + compBets[0] + compBets[1];
    const finalBet = Math.max(0, Math.min(rawTotal, MAX_BET_PER_ROUND, teamMoney));
    const outcome = computeOutcome(finalBet, round);
    const newTeamMoney = Math.max(0, teamMoney + outcome.delta);
    let rivalAfter = Math.max(0, rivalMoney + simulateRivalRound(round));
    if (rivalAfter >= newTeamMoney) {
      const margin = 5000 + Math.floor(Math.random() * 15) * 1000;
      rivalAfter = Math.max(0, newTeamMoney - margin);
    }
    setTeamMoney(newTeamMoney);
    setRivalMoney(rivalAfter);
    setLog((l) => [...l, { round, bet: finalBet, tier: outcome.tier, delta: outcome.delta, rivalAfter }]);
    setLastResult({
      tier: outcome.tier,
      delta: outcome.delta,
      bet: finalBet,
      returned: outcome.returned,
      newTeamMoney,
      members,
      rivalAfter,
    });
    setShake(true);
    setTimeout(() => setShake(false), 500);
    setPhase('reveal');
  }

  function nextFromReveal() {
    setCompleted((prev) => {
      const copy = [...prev];
      copy[roundIdx] = true;
      return copy;
    });
    if (isLastRound) {
      setPhase('summary');
    } else {
      setPhase('rooms');
    }
  }

  function reset() {
    setPhase('rooms');
    setRoundIdx(0);
    setCompleted(ROUNDS.map(() => false));
    setTeamMoney(START_TEAM_CASH);
    setRivalMoney(START_TEAM_CASH);
    setQaLog([]);
    setQuestionInput('');
    setHumans(freshHumans());
    setCompBets([0, 0]);
    setCompBeliefs([false, false]);
    setBettingLocked(false);
    setLog([]);
    setLastResult(null);
    setVerifiedTwist(null);
    setTwistLog([]);
    setTwistInput('');
    setChecked165(false);
    setCheck165Result(null);
    setBettingLeft(BETTING_SECONDS);
  }

  return (
    <div className="min-h-screen relative">
      <div className="sticky top-0 z-40 backdrop-blur bg-white/90 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button onClick={onExit} className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1">
            <X className="w-4 h-4" /> 離開模擬器
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {ROUNDS.map((r, i) => (
              <span
                key={r.id}
                className={`w-2.5 h-2.5 rounded-full ${
                  completed[i] ? 'bg-emerald-500' : i === roundIdx && phase !== 'rooms' ? 'bg-blue-600 pulse-glow' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1.5 font-mono text-sm sm:text-base font-bold ${shake ? 'count-shake' : ''}`}>
              <Coins className="w-4 h-4 text-amber-500" />
              <span className={teamMoney >= START_TEAM_CASH ? 'text-emerald-600' : 'text-rose-600'}>{fmt(teamMoney)}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-slate-400">
              對手隊 <span>{fmt(rivalMoney)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {phase === 'rooms' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-blue-600 font-bold tracking-widest text-xs uppercase">CHOOSE A ROOM</p>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0E2A5E]">選擇要進入的會議室</h2>
              <p className="text-sm text-slate-500">依序點開 5 間會議室，完成所有關卡後即可查看最終結算。</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {ROUNDS.map((r, i) => (
                <RoomCard
                  key={r.id}
                  round={r}
                  index={i}
                  status={completed[i] ? 'done' : i === 0 || completed[i - 1] ? 'available' : 'locked'}
                  onClick={() => enterRoom(i)}
                />
              ))}
            </div>
            {completed.every(Boolean) && (
              <button
                onClick={() => setPhase('summary')}
                className="w-full py-3 rounded-full bg-[#0E2A5E] text-white font-bold flex items-center justify-center gap-2"
              >
                查看最終結算 <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {phase !== 'rooms' && phase !== 'summary' && (
          <div className="text-center mb-6">
            <p className="text-blue-600 font-bold tracking-widest text-xs uppercase mb-1">{round.stageLabel}</p>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0E2A5E]">
              {round.emoji} {round.role}
            </h2>
          </div>
        )}

        {phase === 'fee' && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 space-y-5 coin-pop text-center shadow-[0_10px_30px_-18px_rgba(16,39,92,0.25)]">
            <p className="text-sm text-slate-500">大家準備進入這間會議室……</p>
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
              <p className="text-xs text-slate-400 mb-1">入場費（會議室租金）</p>
              <p className="text-2xl font-black text-rose-600">- {fmt(TEAM_ENTRY_FEE)}</p>
              <p className="text-xs text-slate-400 mt-1">
                每人 {fmt(ENTRY_FEE_PER_PERSON)}，全隊 5 人共 {fmt(TEAM_ENTRY_FEE)}，無論結果如何都不退還
              </p>
            </div>
            <button
              onClick={payFee}
              className="w-full py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition font-bold flex items-center justify-center gap-2"
            >
              支付入場費，進入會議室 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {phase === 'story' && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 space-y-5 coin-pop shadow-[0_10px_30px_-18px_rgba(16,39,92,0.25)]">
            <p className="text-slate-700 leading-relaxed">{round.story}</p>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center justify-between">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-600" /> 關主開口的金額
              </span>
              <span className="font-mono font-black text-lg text-[#0E2A5E]">{fmt(round.requestAmount)}</span>
            </div>
            <p className="text-xs text-slate-400">{round.question}</p>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3 max-h-64 overflow-y-auto">
              {qaLog.length === 0 && <p className="text-xs text-slate-400">還沒有人發問，輸入問題試著問出破綠吧。</p>}
              {qaLog.map((qa, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-xs text-blue-600">你問：{qa.question}</p>
                  <p className="text-sm text-slate-700">關主：{qa.answer}</p>
                </div>
              ))}
            </div>
            {qaLog.length >= 1 ? (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                🔒 每一關只能問一個問題，這一關的提問機會已經用完囉。
              </p>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') askQuestion();
                  }}
                  placeholder="輸入你想問關主的『唯一一個』問題……"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
                <button onClick={askQuestion} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-[#0E2A5E]">
                  送出
                </button>
              </div>
            )}
            <p className="text-[10px] text-slate-400">＊關主回覆為情境模擬生成，非真人客服</p>
            <button
              onClick={goDiscussion}
              className="w-full py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition font-bold flex items-center justify-center gap-2"
            >
              問完了，進入討論環節 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {phase === 'discussion' && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 space-y-5 coin-pop text-center shadow-[0_10px_30px_-18px_rgba(16,39,92,0.25)]">
            <Users className="w-8 h-8 mx-auto text-amber-500" />
            <p className="text-slate-700 leading-relaxed">
              現在是討論時間，大家可以自由討論要不要借錢、打算借多少——記得不能明說金額，只能用語氣、表情透露！
            </p>

            {isLastRound && (
              <div className="text-left bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-rose-600">
                  <MessageCircleWarning className="w-5 h-5" />
                  <p className="font-bold text-sm">討論到一半，Video 成員被叫出去了，手機突然收到他傳來的訊息……</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Video 成員</p>
                  <p className="text-slate-700 text-sm">{TWIST_MESSAGE}</p>
                </div>

                <div className="bg-white border border-slate-100 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
                  {twistLog.length === 0 && (
                    <p className="text-xs text-slate-400">你可以直接回訊息給 Video 成員，試著問問看這是不是真的。</p>
                  )}
                  {twistLog.map((qa, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-xs text-blue-600">你傳：{qa.question}</p>
                      <p className="text-sm text-slate-700">Video 成員：{qa.answer}</p>
                    </div>
                  ))}
                </div>

                {verifiedTwist === true ? (
                  <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    ✅ 你們成功求證了！{round.revealTrue} 等下去下注時大家都知道要小心了。
                  </p>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      value={twistInput}
                      onChange={(e) => setTwistInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') askTwist();
                      }}
                      placeholder="回覆 Video 成員……（試著問他是不是真的）"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                    <button onClick={askTwist} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-[#0E2A5E]">
                      送出
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
              <button
                onClick={query165}
                disabled={checked165}
                className="shrink-0 px-3 py-2 rounded-full border border-slate-200 text-sm hover:bg-white disabled:opacity-40 flex items-center gap-1.5 text-slate-600 bg-white"
              >
                <ShieldCheck className="w-4 h-4" /> 撥打 165 查證
              </button>
              {checked165 ? (
                <p className={`text-sm text-left ${check165Result ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {check165Result ? '疑似詐騙來電／話術，請提高警覺！' : '目前無相關詐騙通報紀錄。'}
                </p>
              ) : (
                <p className="text-xs text-slate-400 text-left">討論時可以先撥打 165 查證這一關的關主身份。</p>
              )}
            </div>

            <p className="text-xs text-slate-400">（這個畫面沒有時間限制，討論好了再自己按下一步）</p>
            <button
              onClick={startBettingPrep}
              className="w-full py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition font-bold flex items-center justify-center gap-2"
            >
              討論完畢，進入下注 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {phase === 'betting' && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 space-y-6 coin-pop shadow-[0_10px_30px_-18px_rgba(16,39,92,0.25)]">
            {isLastRound && bettingLocked && verifiedTwist === true && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl p-3">
                ✅ 你們稍早已經識破騙局，這一關全隊選擇不出錢，安全過關！
              </div>
            )}
            {isLastRound && !bettingLocked && verifiedTwist !== true && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl p-3">
                ⚠️ 稍早沒能及時求證「內線消息」，這一關要完全靠你們自己的判斷了，請特別小心！
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5" /> 本關目標門櫃
              </span>
              <span className="font-mono text-slate-600">{fmt(round.requestAmount)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> 下注倒數
              </span>
              <span className="font-mono text-lg text-amber-600">{bettingLeft}s</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 transition-all" style={{ width: `${(bettingLeft / BETTING_SECONDS) * 100}%` }} />
            </div>

            <div className="space-y-3">
              {humans.map((h, i) => (
                <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-sm text-slate-600">
                      <User className="w-4 h-4 text-blue-500" /> {HUMAN_LABELS[i]}
                    </span>
                    <span className="font-mono text-sm font-bold text-[#0E2A5E]">
                      {h.believesScam ? '不出錢' : fmt(h.amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={bettingLocked}
                      onClick={() => toggleHumanScam(i)}
                      className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold border transition disabled:opacity-40 ${
                        h.believesScam ? 'bg-rose-500 border-rose-500 text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      我覺得是詐騙
                    </button>
                    <TickSlider value={h.amount} disabled={h.believesScam || bettingLocked} onChange={(v) => setHumanAmount(i, v)} />
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3 pt-1">
                {COMPUTER_LABELS.map((label, i) => (
                  <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-400 flex items-center justify-center gap-1 mb-1">
                      <Bot className="w-3.5 h-3.5" /> {label}
                    </p>
                    <p className="text-sm font-mono text-slate-500">{bettingLocked ? fmt(compBets[i]) : '金額保密中'}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
              <span className="text-slate-500">目前全隊預計投入</span>
              <span className="font-mono font-black text-lg text-[#0E2A5E]">{fmt(totalBet)}</span>
            </div>

            <button
              onClick={confirmBet}
              className="w-full py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2"
            >
              投錢入箱 <ArrowRight className="w-4 h-4" />
            </button>
            {checked165 && (
              <p className={`text-sm text-center ${check165Result ? 'text-rose-600' : 'text-emerald-600'}`}>
                （討論時已查證：{check165Result ? '疑似詐騙來電／話術，請提高警覺！' : '目前無相關詐騙通報紀錄。'}）
              </p>
            )}
          </div>
        )}

        {phase === 'reveal' && lastResult && (
          <div className={`rounded-2xl p-6 sm:p-8 space-y-5 border coin-pop ${TIER_META[lastResult.tier].color}`}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
              {TIER_META[lastResult.tier].icon}
              {TIER_META[lastResult.tier].label}
            </div>
            <p className="text-xl font-black text-slate-800">{TIER_META[lastResult.tier].headline}</p>
            <p className="text-slate-600 text-sm">
              關主身份揭曉：
              {round.isScam ? (
                <span className="text-rose-600 font-bold">詐騙集團</span>
              ) : (
                <span className="text-emerald-600 font-bold">誠實的人</span>
              )}
            </p>
            <div className="bg-white/70 border border-slate-100 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">你們借出了</span>
                <span className="font-mono font-bold text-slate-800">{fmt(lastResult.bet)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{TIER_META[lastResult.tier].returnLabel}</span>
                <span className="font-mono font-bold text-slate-800">{fmt(lastResult.returned)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200/70 pt-2">
                <span className="text-slate-700 font-semibold">現在隊伍資產還有</span>
                <span className={`font-mono font-black text-xl ${lastResult.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {fmt(lastResult.newTeamMoney)}
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-500">{round.revealTrue}</p>

            <div className="bg-white/70 border border-slate-100 rounded-xl p-4 space-y-1.5">
              <p className="text-xs text-slate-400 mb-1">本關各成員下注金額</p>
              {lastResult.members.map((m) => (
                <div key={m.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    {m.isComputer ? <Bot className="w-3.5 h-3.5 text-slate-400" /> : <User className="w-3.5 h-3.5 text-blue-500" />}
                    {m.label}
                  </span>
                  <span className="text-right">
                    <span className="font-mono text-slate-700 block">{m.amount > 0 ? fmt(m.amount) : '沒有出錢'}</span>
                    {m.isComputer && (
                      <span className="text-[10px] text-slate-400">{m.believesScam ? '覺得像詐騙，選擇不出' : '覺得可以信任，選擇投入'}</span>
                    )}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                <span className="text-slate-400">本關淨損益（供對照）</span>
                <span className={`font-mono font-semibold ${lastResult.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {lastResult.delta >= 0 ? '+' : ''}
                  {fmt(lastResult.delta)}
                </span>
              </div>
            </div>

            <div className="bg-white/70 rounded-xl p-3 flex items-center justify-between text-xs text-slate-500">
              <span>大螢幕同步顯示・對手隊目前資產</span>
              <span className="font-mono text-slate-700">{fmt(lastResult.rivalAfter)}</span>
            </div>

            <button
              onClick={nextFromReveal}
              className="w-full py-3 rounded-full bg-[#0E2A5E] hover:bg-[#153a7c] text-white transition font-bold flex items-center justify-center gap-2"
            >
              {isLastRound ? '查看最終結算' : '返回選擇會議室'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {phase === 'summary' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Trophy className="w-10 h-10 mx-auto text-amber-500" />
              <h2 className="text-2xl sm:text-3xl font-black text-[#0E2A5E]">五關結束！最終資產結算</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <TeamCard name="你的隊伍" money={teamMoney} highlight={teamMoney >= rivalMoney} />
              <TeamCard name="對手隊伍" money={rivalMoney} highlight={rivalMoney > teamMoney} />
            </div>

            <div
              className={`rounded-2xl p-6 border text-center ${
                teamMoney >= rivalMoney ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100'
              }`}
            >
              {teamMoney >= rivalMoney ? (
                <p className="text-blue-700 font-bold">🏆 恭喜！你的隊伍資產較高，晉級最終問答積分賽！全隊每人可獲得 600 點 LINE POINTS。</p>
              ) : (
                <p className="text-slate-600">這次對手隊資產較高。別灰心，其餘參賽者仍可獲得 200 點 LINE POINTS。</p>
              )}
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden overflow-x-auto shadow-[0_10px_30px_-18px_rgba(16,39,92,0.2)]">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-400">
                  <tr>
                    <th className="text-left px-4 py-2">關卡</th>
                    <th className="text-left px-4 py-2">身份</th>
                    <th className="text-right px-4 py-2">下注</th>
                    <th className="text-right px-4 py-2">結果</th>
                    <th className="text-right px-4 py-2">損益</th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((entry, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-4 py-2 whitespace-nowrap text-slate-700">
                        {entry.round.emoji} {entry.round.role}
                      </td>
                      <td className="px-4 py-2">
                        {entry.round.isScam ? <span className="text-rose-600">詐騙</span> : <span className="text-emerald-600">誠實</span>}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-slate-700">{fmt(entry.bet)}</td>
                      <td className="px-4 py-2 text-right whitespace-nowrap text-slate-700">{TIER_META[entry.tier].label}</td>
                      <td className={`px-4 py-2 text-right font-mono ${entry.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {entry.delta >= 0 ? '+' : ''}
                        {fmt(entry.delta)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 py-3 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-2 text-slate-600 font-semibold"
              >
                <RotateCcw className="w-4 h-4" /> 再玩一次
              </button>
              <button onClick={onExit} className="flex-1 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold">
                返回介紹頁
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
