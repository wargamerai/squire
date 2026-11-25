import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Github, Menu, X, PenTool, Swords, Feather, Layers, Dices, ScrollText, ArrowUpRight } from 'lucide-react';

const GITHUB = 'https://github.com/wargamerai/squire';

const NAV = [
  { href: '#concept', label: '構想' },
  { href: '#board', label: '盤を触る' },
  { href: '#flow', label: '手順' },
  { href: '#status', label: '開発状況' },
  { href: '#faq', label: 'よくある質問' },
];

/* ---------- hex geometry (flat-top) ---------- */
const R = 30;
const W = R * 2;
const H = Math.sqrt(3) * R;
const COLS = 9;
const ROWS = 6;
function center(c: number, r: number) {
  return { x: R + c * W * 0.75 + 8, y: H / 2 + r * H + (c % 2 ? H / 2 : 0) + 8 };
}
function hexPath(cx: number, cy: number) {
  const p = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * 60 * i;
    p.push(`${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * Math.sin(a)).toFixed(1)}`);
  }
  return `M${p.join('L')}Z`;
}
function toCube(c: number, r: number) {
  const x = c;
  const z = r - (c - (c & 1)) / 2;
  return { x, z, y: -x - z };
}
function dist(a: [number, number], b: [number, number]) {
  const A = toCube(...a), B = toCube(...b);
  return Math.max(Math.abs(A.x - B.x), Math.abs(A.y - B.y), Math.abs(A.z - B.z));
}
const TERRAIN: Record<string, 'wood' | 'hill' | 'town' | 'river'> = {
  '2,1': 'wood', '2,2': 'wood', '3,2': 'wood', '6,3': 'hill', '6,4': 'hill', '7,3': 'hill',
  '4,3': 'town', '1,4': 'wood', '5,0': 'river', '5,1': 'river', '4,1': 'river', '8,1': 'wood',
};
const TERRAIN_NAME = { wood: '森林', hill: '丘陵', town: '市街', river: '河川', clear: '平地' };

type Unit = { id: string; side: 'blue' | 'red'; label: string; str: string; mv: number; pos: [number, number] };
const START: Unit[] = [
  { id: 'b1', side: 'blue', label: '1/27', str: '4-6', mv: 3, pos: [1, 2] },
  { id: 'b2', side: 'blue', label: '2/27', str: '3-6', mv: 3, pos: [2, 4] },
  { id: 'b3', side: 'blue', label: 'HQ', str: '1-8', mv: 4, pos: [0, 3] },
  { id: 'r1', side: 'red', label: '81 Rgt', str: '5-4', mv: 2, pos: [6, 3] },
  { id: 'r2', side: 'red', label: '82 Rgt', str: '4-4', mv: 2, pos: [7, 1] },
];

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add('is-in'), io.unobserve(e.target))),
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function NatoSymbol({ hq, color }: { hq?: boolean; color: string }) {
  return (
    <g>
      <rect x={-11} y={-14} width={22} height={13} fill="none" stroke={color} strokeWidth={1.6} />
      {hq ? <line x1={-11} y1={-1} x2={-11} y2={8} stroke={color} strokeWidth={1.6} /> : <>
        <line x1={-11} y1={-14} x2={11} y2={-1} stroke={color} strokeWidth={1.4} />
        <line x1={11} y1={-14} x2={-11} y2={-1} stroke={color} strokeWidth={1.4} />
      </>}
    </g>
  );
}

function Board() {
  const [units, setUnits] = useState<Unit[]>(START);
  const [sel, setSel] = useState<string | null>('b1');
  const [turn, setTurn] = useState(1);
  const [log, setLog] = useState<string[]>(['第1ターン 青軍の移動フェイズ']);
  const selected = units.find((u) => u.id === sel) || null;
  const occupied = useMemo(() => new Set(units.map((u) => u.pos.join(','))), [units]);

  const reach = (c: number, r: number) =>
    !!selected && selected.side === 'blue' && !occupied.has(`${c},${r}`) && dist(selected.pos, [c, r]) <= selected.mv && TERRAIN[`${c},${r}`] !== 'river';

  function clickHex(c: number, r: number) {
    if (!selected || !reach(c, r)) return;
    const t = TERRAIN_NAME[TERRAIN[`${c},${r}`] || 'clear'];
    setUnits((us) => us.map((u) => (u.id === selected.id ? { ...u, pos: [c, r] } : u)));
    setLog((l) => [`${selected.label} → ${String(c + 1).padStart(2, '0')}${String(r + 1).padStart(2, '0')}（${t}）`, ...l].slice(0, 5));
    setSel(null);
  }
  function reset() {
    setUnits(START);
    setSel('b1');
    setTurn((t) => t + 1);
    setLog([`盤面を初期配置に戻しました`]);
  }

  const vbW = R * 2 + (COLS - 1) * W * 0.75 + 16;
  const vbH = ROWS * H + H / 2 + 16;

  return (
    <div className="grid lg:grid-cols-[1fr_260px] border-2 border-border bg-card shadow-[8px_8px_0_hsl(var(--squire-shadow))]">
      <div className="relative border-b-2 lg:border-b-0 lg:border-r-2 border-border">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 font-mono text-[11px] tracking-wider">
          <span>MAP / 練習用盤面 9×6</span>
          <span className="px-2 py-0.5 bg-foreground text-background">画面イメージ</span>
        </div>
        <svg viewBox={`0 0 ${vbW} ${vbH}`} className="w-full h-auto block select-none" role="group" aria-label="ヘックス盤の画面イメージ。駒を選び、移動可能なヘックスをクリックできます">
          <defs>
            <pattern id="wood" width="8" height="8" patternUnits="userSpaceOnUse">
              <circle cx="4" cy="4" r="2" fill="hsl(78 25% 40% / .55)" />
            </pattern>
            <pattern id="hill" width="10" height="6" patternUnits="userSpaceOnUse">
              <path d="M0 6 Q5 0 10 6" fill="none" stroke="hsl(30 45% 38% / .6)" strokeWidth="1" />
            </pattern>
          </defs>
          {Array.from({ length: COLS }).map((_, c) =>
            Array.from({ length: ROWS }).map((_, r) => {
              const { x, y } = center(c, r);
              const t = TERRAIN[`${c},${r}`];
              const ok = reach(c, r);
              return (
                <g key={`${c}-${r}`} onClick={() => clickHex(c, r)} className={ok ? 'cursor-pointer' : ''} data-testid={`hex-${c}-${r}`}>
                  <path d={hexPath(x, y)} fill={t === 'river' ? 'hsl(181 15% 51%)' : t === 'town' ? 'hsl(40 15% 66%)' : 'hsl(80 15% 74%)'} stroke="hsl(83 14% 40%)" strokeWidth={0.8} />
                  {t === 'wood' && <path d={hexPath(x, y)} fill="url(#wood)" />}
                  {t === 'hill' && <path d={hexPath(x, y)} fill="url(#hill)" />}
                  {t === 'town' && <g fill="hsl(215 38% 15% / .7)"><rect x={x - 9} y={y - 4} width={6} height={6} /><rect x={x - 1} y={y - 8} width={7} height={10} /><rect x={x + 2} y={y + 4} width={6} height={5} /></g>}
                  {ok && <path d={hexPath(x, y)} fill="hsl(74 28% 28% / .22)" stroke="hsl(74 28% 28%)" strokeWidth={1.6} strokeDasharray="4 3" />}
                  <text x={x} y={y - H / 2 + 9} textAnchor="middle" fontSize={6.5} fontFamily="JetBrains Mono" fill="hsl(215 20% 30% / .7)">
                    {String(c + 1).padStart(2, '0')}{String(r + 1).padStart(2, '0')}
                  </text>
                </g>
              );
            }),
          )}
          {units.map((u) => {
            const { x, y } = center(...u.pos);
            const blue = u.side === 'blue';
            const isSel = sel === u.id;
            return (
              <g
                key={u.id}
                className="counter-move"
                style={{ transform: `translate(${x}px, ${y}px)` }}
                onClick={() => blue && setSel(isSel ? null : u.id)}
                role={blue ? 'button' : undefined}
                aria-label={blue ? `${u.label} を選択` : `敵ユニット ${u.label}`}
                data-testid={`counter-${u.id}`}
                cursor={blue ? 'pointer' : 'default'}
              >
                <rect x={-19} y={-19} width={38} height={38} rx={2} fill="hsl(215 38% 15% / .35)" transform="translate(2.5 2.5)" />
                <rect x={-19} y={-19} width={38} height={38} rx={2} fill={blue ? 'hsl(var(--squire-unit-blue))' : 'hsl(var(--squire-unit-red))'} stroke={isSel ? 'hsl(44 45% 65%)' : 'hsl(var(--squire-shadow))'} strokeWidth={isSel ? 2.5 : 1} />
                <text y={-12} textAnchor="middle" fontSize={5.5} fontFamily="JetBrains Mono" fill="hsl(var(--squire-unit-ink))">{u.label}</text>
                <g transform="translate(0 4)"><NatoSymbol hq={u.label === 'HQ'} color="hsl(var(--squire-unit-ink))" /></g>
                <text y={16} textAnchor="middle" fontSize={8} fontWeight={700} fontFamily="JetBrains Mono" fill="hsl(var(--squire-unit-ink))">{u.str}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <aside className="flex flex-col text-sm">
        <div className="px-4 py-3 border-b border-border/30">
          <div className="font-mono text-[11px] tracking-wider text-muted-foreground">TURN {String(turn).padStart(2, '0')} / 青軍</div>
          <div className="mt-1 font-bold" data-testid="text-selected">
            {selected ? `選択中：${selected.label}（移動力 ${selected.mv}）` : '青軍の駒を選択してください'}
          </div>
        </div>
        <ol className="px-4 py-3 space-y-1.5 font-mono text-[12px] flex-1 min-h-[120px]" data-testid="list-log">
          {log.map((l, i) => (
            <li key={`${l}-${i}`} className={i === 0 ? 'text-foreground' : 'text-muted-foreground'}>
              <span className="text-primary mr-1">{i === 0 ? '>' : '·'}</span>{l}
            </li>
          ))}
        </ol>
        <div className="px-4 py-3 border-t border-border/30 text-[12px] leading-relaxed text-muted-foreground">
          青い駒をクリックし、点線のヘックスへ移動。河川は進入不可。これはこのページ内だけの動作見本です。
        </div>
        <button onClick={reset} data-testid="button-reset-board" className="m-4 mt-0 border-2 border-border px-3 py-2 font-bold hover:bg-foreground hover:text-background transition-colors">
          初期配置に戻す
        </button>
      </aside>
    </div>
  );
}

export default function Home() {
  const [open, setOpen] = useState(false);
  useReveal();

  return (
    <div className="min-h-[100dvh] text-foreground">
      {/* header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b-2 border-border">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5" data-testid="link-home">
            <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
              <path d="M15 1 L28 8.5 L28 21.5 L15 29 L2 21.5 L2 8.5Z" fill="hsl(var(--primary))" />
              <rect x="9" y="9" width="12" height="12" fill="hsl(var(--background))" />
              <path d="M9 9 L21 21 M21 9 L9 21" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
            </svg>
            <span className="font-mono font-bold tracking-[0.25em] text-lg">SQUIRE</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-primary transition-colors" data-testid={`link-nav-${n.href.slice(1)}`}>{n.label}</a>
            ))}
            <a href={GITHUB} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 border-2 border-border px-3 py-1.5 hover:bg-foreground hover:text-background transition-colors" data-testid="link-github-header">
              <Github size={16} /> GitHub
            </a>
          </nav>
          <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label={open ? 'メニューを閉じる' : 'メニューを開く'} aria-expanded={open} data-testid="button-menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <nav className="md:hidden border-t border-border/30 px-5 py-3 flex flex-col gap-3 bg-background">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="py-1">{n.label}</a>
            ))}
            <a href={GITHUB} target="_blank" rel="noreferrer" className="py-1 inline-flex items-center gap-2"><Github size={16} /> GitHub</a>
          </nav>
        )}
      </header>

      <main id="top">
        {/* hero */}
        <section className="hexpaper relative overflow-hidden border-b-2 border-border">
          <div className="max-w-6xl mx-auto px-5 pt-14 pb-20 md:pt-24 md:pb-28 grid md:grid-cols-[1.15fr_1fr] gap-12 items-center">
            <div className="reveal">
              <div className="inline-flex items-center gap-2 font-mono text-[12px] tracking-wider border border-border px-2.5 py-1 bg-background">
                <span className="blink inline-block w-2 h-2 bg-primary" /> 開発中 / 公開準備中
              </div>
              <h1 className="font-display mt-6 text-[2.6rem] leading-[1.25] md:text-[4rem] md:leading-[1.15] font-extrabold tracking-tight">
                盤も駒も、<br />自分で作る。<br /><span className="text-primary">そのまま、指す。</span>
              </h1>
              <p className="mt-6 max-w-lg text-[1.05rem] leading-[1.95] text-foreground/85">
                SQUIRE（スクワイア）は、ボード・ウォーゲームのための軽いブラウザ卓です。
                地図とカウンターをブラウザで編集し、そのまま相手とオンラインで対戦する。
                重いインストールも、モジュール作りの遠回りもない卓を目指しています。
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a href="#board" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 font-bold border-2 border-border shadow-[4px_4px_0_hsl(var(--squire-shadow))] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_hsl(var(--squire-shadow))] transition-transform" data-testid="link-hero-board">
                  盤面イメージを触ってみる
                </a>
                <a href={GITHUB} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-background px-5 py-3 font-bold border-2 border-border hover:bg-foreground hover:text-background transition-colors" data-testid="link-hero-github">
                  <Github size={18} /> 開発の様子を見る
                </a>
              </div>
            </div>
            <div className="relative reveal" aria-hidden>
              <HeroStack />
            </div>
          </div>
        </section>

        {/* concept */}
        <section id="concept" className="max-w-6xl mx-auto px-5 py-20 md:py-28">
          <SectionHead no="01" title="構想" sub="Concept" />
          <div className="grid md:grid-cols-12 gap-6 mt-12">
            <Card className="md:col-span-7" icon={<PenTool size={22} />} k="A" title="盤と駒を、ブラウザで編集">
              地図画像を置き、ヘックスやスクエアを重ね、カウンターに兵科記号・戦力・移動力を書き込む。自作ゲームも、手元の作品の練習盤も、同じ画面で組み立てられるようにします。
            </Card>
            <Card className="md:col-span-5 md:mt-14" icon={<Swords size={22} />} k="B" title="そのまま、相手と対戦">
              作った盤をそのまま卓にして、離れた相手と同じ盤面を共有する。駒を動かせば、相手の盤にも反映される。そんな素直な対戦体験が目標です。
            </Card>
            <Card className="md:col-span-5" icon={<Feather size={22} />} k="C" title="軽さを最優先">
              VASSAL のような本格的な仕組みに敬意を払いつつ、SQUIRE は「今夜すぐ一局」に必要なものだけに絞ります。ブラウザを開けば始まる軽さを大切にします。
            </Card>
            <div className="md:col-span-7 border-2 border-border bg-secondary text-secondary-foreground p-7 md:p-9 flex flex-col justify-between">
              <p className="font-display text-2xl md:text-3xl leading-relaxed font-bold">
                「卓を広げる手間」を、<br />ゲームそのものの時間へ。
              </p>
              <p className="mt-6 text-sm leading-[1.9] opacity-85">
                名前の SQUIRE は、騎士に付き従う従者のこと。主役はあくまでゲームとプレイヤー。SQUIRE は盤を整え、駒を運ぶ係です。
              </p>
            </div>
          </div>
        </section>

        {/* board */}
        <section id="board" className="bg-muted/60 border-y-2 border-border">
          <div className="max-w-6xl mx-auto px-5 py-20 md:py-28">
            <SectionHead no="02" title="盤を触る" sub="Hands on" />
            <p className="mt-6 max-w-2xl leading-[1.9] text-foreground/85">
              完成品ではなく、手触りの見本です。青軍の駒を選んで、移動力の範囲内へ動かしてみてください。
            </p>
            <div className="mt-10 reveal"><Board /></div>
          </div>
        </section>

        {/* flow */}
        <section id="flow" className="max-w-6xl mx-auto px-5 py-20 md:py-28">
          <SectionHead no="03" title="想定している手順" sub="Sequence of play" />
          <ol className="mt-12 grid md:grid-cols-4 border-2 border-border">
            {[
              { i: <Layers size={20} />, t: '地図を敷く', d: '画像を読み込み、ヘックスやスクエアのグリッドを合わせる。' },
              { i: <ScrollText size={20} />, t: '駒を刷る', d: '色、兵科記号、数値を決めてカウンターを作る。' },
              { i: <Swords size={20} />, t: '相手を招く', d: '対戦相手と同じ盤面を開き、配置から始める。' },
              { i: <Dices size={20} />, t: '一局を指す', d: '駒を動かし、盤面を共有しながらゲームを進める。' },
            ].map((s, n) => (
              <li key={s.t} className={`reveal p-6 md:p-7 ${n < 3 ? 'border-b-2 md:border-b-0 md:border-r-2 border-border' : ''}`} style={{ transitionDelay: `${n * 90}ms` }}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-4xl font-bold text-primary">{n + 1}</span>
                  <span className="text-foreground/70">{s.i}</span>
                </div>
                <h3 className="mt-5 font-bold text-lg">{s.t}</h3>
                <p className="mt-2 text-sm leading-[1.85] text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-muted-foreground">各手順は開発中の構想であり、実際の画面や機能は変わる可能性があります。</p>
        </section>

        {/* status */}
        <section id="status" className="bg-foreground text-background">
          <div className="max-w-6xl mx-auto px-5 py-20 md:py-28 grid md:grid-cols-[1fr_1.1fr] gap-12">
            <div>
              <div className="font-mono text-sm tracking-[0.3em] text-primary">04 / STATUS</div>
              <h2 className="font-display mt-3 text-3xl md:text-4xl font-extrabold leading-snug">いまは、<br />開発と公開準備の段階です。</h2>
              <p className="mt-6 leading-[1.95] opacity-80">
                SQUIRE のアプリはまだ公開されていません。このページから編集や対戦を始めることはできません。
                進み具合はソースコードとあわせて GitHub で確認できます。
              </p>
              <a href={GITHUB} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 border-2 border-background px-5 py-3 font-bold hover:bg-background hover:text-foreground transition-colors" data-testid="link-status-github">
                <Github size={18} /> wargamerai/squire <ArrowUpRight size={16} />
              </a>
            </div>
            <div className="relative border-2 border-background/40 p-6 md:p-8">
              <div className="stamp absolute -top-5 right-4 md:right-8 border-[3px] border-primary text-primary font-display font-extrabold px-3 py-1 text-lg bg-foreground">準備中</div>
              <ul className="space-y-5">
                {[
                  { s: '進行中', t: 'コンセプトと画面構成の検討' },
                  { s: '進行中', t: '盤と駒の編集機能の開発' },
                  { s: '予定', t: 'オンライン対戦機能の開発' },
                  { s: '予定', t: '公開に向けた準備と案内' },
                ].map((r, i) => (
                  <li key={r.t} className="flex gap-4 items-start" data-testid={`status-item-${i}`}>
                    <span className={`shrink-0 font-mono text-[11px] px-2 py-1 border ${r.s === '進行中' ? 'border-primary text-primary' : 'border-background/40 opacity-70'}`}>{r.s}</span>
                    <span className="leading-relaxed">{r.t}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-8 pt-5 border-t border-background/20 text-xs opacity-60 leading-relaxed">公開時期は未定です。決まり次第、このページと GitHub でお知らせします。</p>
            </div>
          </div>
        </section>

        {/* faq */}
        <section id="faq" className="max-w-4xl mx-auto px-5 py-20 md:py-28">
          <SectionHead no="05" title="よくある質問" sub="Q&A" />
          <div className="mt-10 border-t-2 border-border">
            {[
              { q: 'いつ使えるようになりますか？', a: '現在は開発と公開準備の段階で、公開時期は決まっていません。進捗は GitHub リポジトリで確認できます。' },
              { q: 'VASSAL のモジュールは読み込めますか？', a: 'VASSAL との互換性はお約束していません。SQUIRE は、ブラウザ上で盤と駒を一から作る軽量な道具として設計を進めています。' },
              { q: 'インストールは必要ですか？', a: 'PC のブラウザで動作する形を目指しています。' },
              { q: 'このページの盤面は実際のアプリですか？', a: 'いいえ。「画面イメージ」と表示した盤面は、操作感を伝えるためにこのページ内だけで動く見本です。' },
            ].map((f, i) => (
              <details key={f.q} className="group border-b-2 border-border" data-testid={`faq-${i}`}>
                <summary className="flex items-center justify-between gap-4 py-5 cursor-pointer list-none font-bold text-lg">
                  <span><span className="font-mono text-primary mr-3">Q{i + 1}</span>{f.q}</span>
                  <span className="font-mono text-2xl transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="pb-6 pl-10 leading-[1.9] text-foreground/80">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-border hexpaper">
        <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col md:flex-row gap-6 md:items-center justify-between text-sm">
          <div>
            <div className="font-mono font-bold tracking-[0.25em]">SQUIRE</div>
            <div className="mt-1 text-muted-foreground">ボード・ウォーゲームのための軽量ブラウザ卓（開発中）</div>
          </div>
          <div className="flex gap-5">
            <a href="#top" className="hover:text-primary" data-testid="link-footer-top">ページ上部へ</a>
            <a href={GITHUB} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-primary" data-testid="link-footer-github"><Github size={15} /> GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHead({ no, title, sub }: { no: string; title: string; sub: string }) {
  return (
    <div className="reveal flex items-end gap-5 border-b-2 border-border pb-4">
      <span className="font-mono text-5xl md:text-6xl font-bold text-primary leading-none">{no}</span>
      <div>
        <div className="font-mono text-[11px] tracking-[0.3em] text-muted-foreground uppercase">{sub}</div>
        <h2 className="font-display text-2xl md:text-3xl font-extrabold">{title}</h2>
      </div>
    </div>
  );
}

function Card({ className = '', icon, k, title, children }: { className?: string; icon: ReactNode; k: string; title: string; children: ReactNode }) {
  return (
    <article className={`reveal border-2 border-border bg-card p-7 md:p-8 shadow-[6px_6px_0_hsl(var(--squire-shadow))] ${className}`}>
      <div className="flex items-center justify-between">
        <span className="w-11 h-11 grid place-items-center bg-foreground text-background">{icon}</span>
        <span className="font-mono text-xs tracking-widest text-muted-foreground">CASE {k}</span>
      </div>
      <h3 className="mt-6 font-display text-xl md:text-2xl font-extrabold">{title}</h3>
      <p className="mt-3 leading-[1.95] text-foreground/80">{children}</p>
    </article>
  );
}

function HeroStack() {
  const chits = [
    { c: 'hsl(var(--squire-unit-blue))', r: -9, x: 4, y: 30, t: '4-6' },
    { c: 'hsl(var(--squire-unit-red))', r: 7, x: 52, y: 8, t: '5-4' },
    { c: 'hsl(var(--squire-unit-olive))', r: -3, x: 30, y: 56, t: '2-8' },
  ];
  return (
    <div className="relative aspect-square max-w-[420px] mx-auto">
      <div className="absolute inset-[8%] border-2 border-border bg-card rotate-2 shadow-[10px_10px_0_hsl(var(--squire-shadow))]">
        <div className="absolute inset-3 hexpaper border border-border/30" />
        <div className="absolute left-3 bottom-3 font-mono text-[10px] tracking-wider bg-foreground text-background px-1.5 py-0.5">画面イメージ</div>
      </div>
      {chits.map((ch) => (
        <div
          key={ch.t}
          className="absolute w-[30%] aspect-square border-2 border-border grid place-items-center shadow-[4px_4px_0_hsl(var(--squire-shadow)/.5)]"
          style={{ background: ch.c, left: `${ch.x}%`, top: `${ch.y}%`, transform: `rotate(${ch.r}deg)` }}
        >
          <svg viewBox="-20 -20 40 40" className="w-3/4 h-3/4">
            <NatoSymbol color="hsl(var(--squire-unit-ink))" />
            <text y={15} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily="JetBrains Mono" fill="hsl(var(--squire-unit-ink))">{ch.t}</text>
          </svg>
        </div>
      ))}
    </div>
  );
}
