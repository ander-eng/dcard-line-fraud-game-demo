import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  ROUNDS,
  TEAM_SIZE,
  START_CASH_PER_PERSON,
  START_TEAM_CASH,
  ENTRY_FEE_PER_PERSON,
  TEAM_ENTRY_FEE,
  MAX_BET_PER_ROUND,
  TWIST_MESSAGE,
} from '../data/rounds.ts';
import { fmt } from '../lib/format.ts';
import {
  Users,
  Wallet,
  Trophy,
  Eye,
  EyeOff,
  AlertTriangle,
  Sparkles,
  Gift,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Undo2,
  Boxes,
  Video,
  MessageSquareWarning,
} from 'lucide-react';

const NAV = [
  { id: 'about', label: '主題' },
  { id: 'format', label: '賽制' },
  { id: 'flow', label: '流程' },
  { id: 'rules', label: '下注規則' },
  { id: 'hosts', label: '五大關卡' },
  { id: 'twist', label: '特別機制' },
  { id: 'rewards', label: '獎勵' },
];

const FLOW_STEPS = [
  '租借會場，Video 成員宣布今天的關卡是「報恩遊戲」，並把所有人加入同一個 LINE 群組，讓資訊自由流通。',
  '15 人分成 3 隊，每隊 5 人，每人起始資金 10 萬元（一隊共 50 萬元），由 Video 成員陪同帶隊。',
  '三隊先後與 5 位關主進行線上餐敘：每一關每人都要先支付 1 萬元入場費（會議室租金），一隊 5 人共 5 萬元。',
  '關主說明自己想借錢的原因與金額，參賽者可以打字提問確認細節，接著進入討論環節討論要不要借、借多少。',
  '10 秒下注：參賽者不能明示要借多少錢，只能用語氣、表情透露，也可以撥打 165 查證。',
  '五人輪流把錢投進箱子，關主開箱確認金額是否達標，公布自己是「誠實人」還是「詐騙集團」並結算輸贏。',
  '重複上述流程 5 次，每一關需要集資的金額會越來越高，過程中大螢幕會即時顯示雙方隊伍的資產進度。',
  '五關結束後進行玩家檢舉時間，資產最多的隊伍取得晉級最終問答積分賽的資格。',
];

function allRevealed(state: Record<number, boolean>) {
  return ROUNDS.every((r) => state[r.id]);
}

function Blob({ className }: { className: string }) {
  return <div className={`absolute rounded-full pointer-events-none ${className}`} />;
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-blue-600 text-xs tracking-[0.3em] font-bold">{eyebrow}</p>
      <h2 className="text-2xl sm:text-3xl font-black mt-2 text-[#0E2A5E]">{title}</h2>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_10px_30px_-16px_rgba(16,39,92,0.25)]">
      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">{icon}</div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-xl font-black text-[#0E2A5E]">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

function RuleCard({ icon, color, title, detail }: { icon: ReactNode; color: string; title: string; detail: string }) {
  return (
    <div className={`rounded-2xl border p-5 space-y-2 bg-white shadow-[0_10px_30px_-18px_rgba(16,39,92,0.2)] ${color}`}>
      <div className="flex items-center gap-2 font-bold">{icon}{title}</div>
      <p className="text-sm text-slate-600">{detail}</p>
    </div>
  );
}

export default function Landing({ onStart }: { onStart: () => void }) {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div>
      <nav className="sticky top-0 z-40 backdrop-blur bg-white/90 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center gap-2 font-black text-sm shrink-0 text-[#0E2A5E]">💣 真的假不了</div>
          <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-500 shrink-0">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => scrollTo(n.id)} className="hover:text-blue-600 transition whitespace-nowrap font-medium">
                {n.label}
              </button>
            ))}
          </div>
          <button onClick={onStart} className="shrink-0 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold">
            立即體驗
          </button>
        </div>
      </nav>

      <header className="relative overflow-hidden px-4 pt-20 pb-24 text-center bg-white">
        <Blob className="w-64 h-64 bg-blue-600 -top-24 -left-24" />
        <Blob className="w-44 h-44 bg-amber-300 -top-14 -right-14" />
        <Blob className="w-10 h-10 bg-blue-100 top-28 left-[12%] hidden sm:block" />
        <Blob className="w-6 h-6 bg-amber-200 bottom-10 right-[18%] hidden sm:block" />
        <div className="relative z-10">
          <p className="text-blue-600 tracking-[0.3em] text-xs sm:text-sm font-bold mb-4">DCARD × LINE · 防詐節目三部曲 EP2</p>
          <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-6 text-[#0E2A5E]">
            真的假不了 💣<br />
            <span className="text-2xl sm:text-4xl text-blue-600">你能發現你正身處騙局裡面嗎 👻</span>
          </h1>
          <p className="max-w-2xl mx-auto text-slate-500 leading-relaxed mb-8">
            15 位參賽者、3 支隊伍，被親近的人開口借錢——同事、室友、銀行專員，甚至是最信任的家人。
            5 關「報恩遊戲」下注考驗，最後連自己人的訊息都可能是假的。你們能守住資產、識破騙局，晉級最終決賽嗎？
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={onStart} className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 pulse-glow">
              開始報恩遊戲 <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => scrollTo('about')} className="px-6 py-3 rounded-full border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 font-bold text-[#0E2A5E]">
              看完整規則
            </button>
          </div>
        </div>
      </header>

      <section id="about" className="max-w-4xl mx-auto px-4 py-16">
        <SectionTitle eyebrow="THEME" title="這一集在講什麼？" />
        <div className="grid sm:grid-cols-2 gap-4 mt-8 text-sm text-slate-600 leading-relaxed">
          <p className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_10px_30px_-18px_rgba(16,39,92,0.2)]">
            本集於不同天拍攝，以「被親近的人騙」作為主軸。開頭承接上一集的獲勝者，將 15 人分成三隊，
            由 Video 成員陪同並帶隊遊玩。三隊同步進行 5 關與詐騙相關的下注遊戲，累積通關資金、躲開最後的詐騙訊息。
          </p>
          <p className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_10px_30px_-18px_rgba(16,39,92,0.2)]">
            所有下注流程都用「報恩遊戲」包裝：關主向你借錢，你要判斷他是不是騙子，並決定要借（存）多少錢。
            累計資產最多的隊伍，將取得晉級最終問答積分賽的資格。
          </p>
        </div>
      </section>

      <section id="format" className="max-w-5xl mx-auto px-4 py-16">
        <SectionTitle eyebrow="FORMAT" title="賽制總覽" />
        <div className="grid sm:grid-cols-4 gap-4 mt-8">
          <StatCard icon={<Users className="w-5 h-5" />} label="參賽人數" value="15 人" sub={`分成 3 隊，每隊 ${TEAM_SIZE} 人`} />
          <StatCard icon={<Wallet className="w-5 h-5" />} label="起始資金" value={fmt(START_CASH_PER_PERSON)} sub={`每人 ${fmt(START_CASH_PER_PERSON)}，一隊共 ${fmt(START_TEAM_CASH)}`} />
          <StatCard icon={<Boxes className="w-5 h-5" />} label="關卡數" value="5 關" sub="5 位關主線上餐敘借錢" />
          <StatCard icon={<Trophy className="w-5 h-5" />} label="晉級名額" value="資產最高 1 隊" sub="進入最終問答積分賽" />
        </div>
      </section>

      <section id="flow" className="max-w-4xl mx-auto px-4 py-16">
        <SectionTitle eyebrow="FLOW" title="競賽流程" />
        <ol className="mt-8 space-y-4">
          {FLOW_STEPS.map((s, i) => (
            <li key={i} className="flex gap-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_10px_30px_-20px_rgba(16,39,92,0.2)]">
              <span className="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">{i + 1}</span>
              <p className="text-sm text-slate-600 leading-relaxed">{s}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="rules" className="max-w-5xl mx-auto px-4 py-16">
        <SectionTitle eyebrow="BETTING RULES" title="下注結果，四種情境" />
        <p className="text-slate-500 text-sm mt-3 max-w-2xl">
          每一關參賽者可自由決定借（存）多少錢，每人上限 {fmt(10000)}，全隊上限 {fmt(MAX_BET_PER_ROUND)}。
          結果取決於「關主是否誠實」與「金額是否達標」——以「對象跟你借 3 萬買基金，5 人各自決定要不要借」為例：
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mt-8">
          <RuleCard icon={<CheckCircle2 className="w-5 h-5 text-blue-600" />} color="border-blue-200" title="大成功" detail="3 人各借 1 萬、其餘借 6 千 + 4 千，共借 40,000。關主是誠實人 → 拿回 40,000×1.5 = 60,000（多賺 20,000）。" />
          <RuleCard icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} color="border-emerald-200" title="成功" detail="3 人各借 1 萬，另 2 人沒借，共借 30,000。關主是誠實人 → 拿回 30,000×1.5 = 45,000（多賺 15,000）。" />
          <RuleCard icon={<Undo2 className="w-5 h-5 text-amber-600" />} color="border-amber-200" title="普通（退還）" detail="共借 26,000，未達標。關主是誠實人，但金額不足 → 26,000 全數退還，資產不變。" />
          <RuleCard icon={<XCircle className="w-5 h-5 text-rose-600" />} color="border-rose-200" title="被騙！" detail="共借 34,000，關主其實是騙子 → 不論有沒有達標，34,000 全數沒收，直接虧損。" />
        </div>
        <div className="mt-6 flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-slate-600">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p>
            參賽者可隨時撥打「165」查證，但下注時<strong className="text-[#0E2A5E]">不可明示自己要借多少錢</strong>，只能用語氣、表情透露。
            每一關都要先支付入場費（會議室租金），每人 {fmt(ENTRY_FEE_PER_PERSON)}，全隊 5 人共 {fmt(TEAM_ENTRY_FEE)}，無論結果如何都不退還。
            若總下注金額沒有達到關主開口的金額，就算關主是誠實人，也不能算集資成功，錢會全數退還、資產不變。
          </p>
        </div>
        <p className="text-xs text-slate-400 mt-4">
          ＊本頁下方的體驗模擬器考量實際只有 2 位玩家練習：會先選擇會議室、支付入場費、聽情境並打字提問（系統會模擬關主回覆，並會直接告知關主開口的金額），
          接著進入無時間限制的討論環節，最後才進入 10 秒下注——由 3 個可操作欄位（兩人可輪流操作）各自拉動滑桿決定金額（1,000～10,000，以 1,000 為單位），
          若按下「我覺得是詐騙」滑桿就會鎖住不能借。另外 2 位電腦隊友只有在判斷「覺得這關是詐騙」時才不出錢，否則就會投入 1 萬元。
          對手隊伍不會逐關模擬，只會在每一關結尾的資訊公布中顯示一個持續變動的資產數字。
        </p>
      </section>

      <section id="hosts" className="max-w-5xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <SectionTitle eyebrow="THE FIVE HOSTS" title="五大關卡・誰在跟你借錢？" />
          <button
            onClick={() => setRevealed(Object.fromEntries(ROUNDS.map((r) => [r.id, !allRevealed(revealed)])))}
            className="text-xs px-3 py-2 rounded-full border border-slate-200 hover:bg-blue-50 hover:border-blue-200 flex items-center gap-1.5 text-slate-600"
          >
            {allRevealed(revealed) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {allRevealed(revealed) ? '隱藏解答' : '顯示解答（劇透）'}
          </button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {ROUNDS.map((r) => (
            <div key={r.id} className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-3 shadow-[0_10px_30px_-18px_rgba(16,39,92,0.2)]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{r.stageLabel}</span>
                <button onClick={() => setRevealed((s) => ({ ...s, [r.id]: !s[r.id] }))} className="text-slate-400 hover:text-blue-600">
                  {revealed[r.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-3xl">{r.emoji}</div>
              <h3 className="font-bold text-[#0E2A5E]">{r.role}</h3>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-4">{r.story}</p>
              <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">需求金額 {fmt(r.requestAmount)}</span>
                {revealed[r.id] ? (
                  r.isScam ? <span className="text-rose-600 font-semibold">詐騙</span> : <span className="text-emerald-600 font-semibold">誠實</span>
                ) : (
                  <span className="text-slate-300">？？？</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="twist" className="max-w-4xl mx-auto px-4 py-16">
        <SectionTitle eyebrow="SPECIAL MECHANIC" title="特別機制：連 Video 成員都不能信" />
        <div className="mt-8 bg-white border border-blue-100 rounded-2xl p-6 sm:p-8 space-y-4 shadow-[0_10px_30px_-18px_rgba(16,39,92,0.2)]">
          <div className="flex items-center gap-2 text-blue-700 font-bold">
            <MessageSquareWarning className="w-5 h-5" /> 帳號被盜的陪玩夥伴
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            其實，Video 成員的帳號早就被盜了！騙子的目標就是要奪走參賽者的錢。在資產最高的最後一關，討論環節進行到一半，
            Video 成員會被工作人員叫出去、暫時缺席，這時參賽者的手機會收到一則以他名義發送的假消息：
          </p>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-start gap-3">
            <Video className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-700">「{TWIST_MESSAGE}」</p>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">
            參賽者可以直接回訊息給 Video 成員，只要問出像「是真的嗎」「你剛剛有傳訊息？」這類明顯在求證的話，
            就能識破這是假消息——接下來的下注環節會直接鎖住、全隊都不出錢，安全過關；
            反之，如果沒有問出求證的話，下注環節就會照常進行，大家只能靠自己的判斷決定要不要借、借多少，一不小心就可能被騙走高額資金。
          </p>
        </div>
      </section>

      <section id="rewards" className="max-w-4xl mx-auto px-4 py-16">
        <SectionTitle eyebrow="REWARDS" title="獎項規劃" />
        <div className="grid sm:grid-cols-2 gap-4 mt-8">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-2">
            <Trophy className="w-8 h-8 mx-auto text-amber-500" />
            <p className="text-2xl font-black text-amber-600">600 點</p>
            <p className="text-sm text-slate-600">勝利隊伍每人可獲得 LINE POINTS</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center space-y-2 shadow-[0_10px_30px_-18px_rgba(16,39,92,0.2)]">
            <Gift className="w-8 h-8 mx-auto text-blue-500" />
            <p className="text-2xl font-black text-[#0E2A5E]">200 點</p>
            <p className="text-sm text-slate-600">其餘參賽者每人可獲得 LINE POINTS</p>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">結算完成後將進行玩家檢舉時間，資產最多的隊伍取得決賽（最終問答積分賽）晉級資格。</p>
      </section>

      <section className="relative overflow-hidden max-w-3xl mx-auto px-4 py-20 text-center">
        <Blob className="w-40 h-40 bg-blue-100 -bottom-16 -left-16" />
        <Blob className="w-28 h-28 bg-amber-100 -top-8 -right-8" />
        <div className="relative z-10">
          <Sparkles className="w-8 h-8 mx-auto text-blue-600 mb-4" />
          <h2 className="text-2xl sm:text-3xl font-black mb-4 text-[#0E2A5E]">準備好了嗎？</h2>
          <p className="text-slate-500 mb-8">實際體驗五關下注，看看你能不能守住資產、識破最後的騙局。</p>
          <button onClick={onStart} className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg inline-flex items-center gap-2 pulse-glow">
            開始遊戲 <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400">
        <p className="flex items-center justify-center gap-1.5 mb-1">
          <AlertTriangle className="w-3.5 h-3.5" /> 反詐騙提醒：現實生活中若接到不明借款 / 投資訊息，請務必撥打 165 反詐騙專線查證。
        </p>
        <p>Dcard × LINE 防詐節目企劃內容示意網站・僅供內部規劃參考</p>
      </footer>
    </div>
  );
}
