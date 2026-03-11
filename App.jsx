import { useState, useCallback } from "react";

/* ── Palette ── */
const C = {
  bg:      "#07060f",
  bg2:     "#0d0b1a",
  bg3:     "#12103e",
  card:    "rgba(255,255,255,0.04)",
  border:  "rgba(255,255,255,0.08)",
  purple:  "#6c3bff",
  pink:    "#ff2d7e",
  cyan:    "#00e5ff",
  yellow:  "#ffe600",
  green:   "#00ffb3",
  text:    "#e8e4ff",
  muted:   "#6b6888",
};

const PROC_COLORS = ["#ff2d7e","#6c3bff","#00e5ff","#ffe600","#00ffb3","#ff7c2d","#c77dff","#2dfff0","#ff6b6b","#b2ff59"];

const DEFAULTS = [
  { pid:"P1", arrival:0, burst:5, priority:2, color:PROC_COLORS[0] },
  { pid:"P2", arrival:1, burst:3, priority:1, color:PROC_COLORS[1] },
  { pid:"P3", arrival:2, burst:8, priority:4, color:PROC_COLORS[2] },
  { pid:"P4", arrival:3, burst:2, priority:3, color:PROC_COLORS[3] },
];

/* ── Algorithms ── */
function fcfs(ps){
  const s=[...ps].sort((a,b)=>a.arrival-b.arrival),g=[],st={};let t=0;
  for(const p of s){if(t<p.arrival)t=p.arrival;g.push({pid:p.pid,start:t,end:t+p.burst,color:p.color});st[p.pid]={pid:p.pid,arrival:p.arrival,burst:p.burst,start:t,finish:t+p.burst,waiting:t-p.arrival,turnaround:t+p.burst-p.arrival,response:t-p.arrival};t+=p.burst;}
  return{gantt:g,stats:st};
}
function sjf(ps){
  const pr=ps.map(p=>({...p,done:false})),g=[],st={};let t=0,d=0;
  while(d<pr.length){const av=pr.filter(p=>!p.done&&p.arrival<=t);if(!av.length){t++;continue;}av.sort((a,b)=>a.burst-b.burst);const p=av[0];g.push({pid:p.pid,start:t,end:t+p.burst,color:p.color});st[p.pid]={pid:p.pid,arrival:p.arrival,burst:p.burst,start:t,finish:t+p.burst,waiting:t-p.arrival,turnaround:t+p.burst-p.arrival,response:t-p.arrival};t+=p.burst;p.done=true;d++;}
  return{gantt:g,stats:st};
}
function srtf(ps){
  const pr=ps.map(p=>({...p,rem:p.burst,started:false,done:false})),g=[],st={};let t=0,d=0;
  const mx=ps.reduce((s,p)=>s+p.burst,0)+5;
  while(d<pr.length&&t<mx){const av=pr.filter(p=>!p.done&&p.arrival<=t);if(!av.length){t++;continue;}av.sort((a,b)=>a.rem-b.rem);const p=av[0];if(!p.started){st[p.pid]={pid:p.pid,arrival:p.arrival,burst:p.burst,response:t-p.arrival};p.started=true;}if(g.length&&g[g.length-1].pid===p.pid)g[g.length-1].end++;else g.push({pid:p.pid,start:t,end:t+1,color:p.color});p.rem--;t++;if(p.rem===0){st[p.pid].finish=t;st[p.pid].waiting=t-p.arrival-p.burst;st[p.pid].turnaround=t-p.arrival;st[p.pid].start=t-p.burst;p.done=true;d++;}}
  return{gantt:g,stats:st};
}
function rr(ps,q){
  const pr=ps.map(p=>({...p,rem:p.burst,started:false})),g=[],st={};let t=0,i=0;const queue=[];
  pr.sort((a,b)=>a.arrival-b.arrival);
  while(pr.some(p=>p.rem>0)){while(i<pr.length&&pr[i].arrival<=t){queue.push(pr[i]);i++;}if(!queue.length){t=pr[i]?.arrival??t+1;continue;}const p=queue.shift();if(!p.started){st[p.pid]={pid:p.pid,arrival:p.arrival,burst:p.burst,response:t-p.arrival};p.started=true;}const run=Math.min(q,p.rem);g.push({pid:p.pid,start:t,end:t+run,color:p.color});t+=run;p.rem-=run;while(i<pr.length&&pr[i].arrival<=t){queue.push(pr[i]);i++;}if(p.rem>0)queue.push(p);else{st[p.pid].finish=t;st[p.pid].start=t-p.burst;st[p.pid].waiting=t-p.arrival-p.burst;st[p.pid].turnaround=t-p.arrival;}}
  return{gantt:g,stats:st};
}
function pri(ps){
  const pr=ps.map(p=>({...p,done:false})),g=[],st={};let t=0,d=0;
  while(d<pr.length){const av=pr.filter(p=>!p.done&&p.arrival<=t);if(!av.length){t++;continue;}av.sort((a,b)=>a.priority-b.priority);const p=av[0];g.push({pid:p.pid,start:t,end:t+p.burst,color:p.color});st[p.pid]={pid:p.pid,arrival:p.arrival,burst:p.burst,priority:p.priority,start:t,finish:t+p.burst,waiting:t-p.arrival,turnaround:t+p.burst-p.arrival,response:t-p.arrival};t+=p.burst;p.done=true;d++;}
  return{gantt:g,stats:st};
}

const ALGOS=[
  {id:"FCFS",   label:"FCFS",         sub:"First Come First Serve", icon:"①"},
  {id:"SJF",    label:"SJF",          sub:"Shortest Job First",     icon:"②"},
  {id:"SRTF",   label:"SRTF",         sub:"Shortest Remaining Time",icon:"③"},
  {id:"RR",     label:"Round Robin",  sub:"Time Quantum Based",     icon:"④"},
  {id:"Priority",label:"Priority",    sub:"Priority Scheduling",    icon:"⑤"},
];

/* ══════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════ */
export default function App(){
  const [page,setPage]=useState("home");
  return page==="home"
    ? <Home onStart={()=>setPage("sim")}/>
    : <Sim   onHome={()=>setPage("home")}/>;
}

/* ══════════════════════════════════════════════
   HOME
══════════════════════════════════════════════ */
function Home({onStart}){
  return(
    <div style={{width:"100vw",minHeight:"100vh",background:C.bg,color:C.text,
      fontFamily:"'Rajdhani',sans-serif",overflowX:"hidden"}}>

      {/* Noise overlay */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,opacity:.03,
        backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")"
      }}/>

      {/* Gradient blobs */}
      <div style={{position:"fixed",top:"-20%",left:"-10%",width:600,height:600,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(108,59,255,0.18) 0%,transparent 70%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",top:"40%",right:"-15%",width:500,height:500,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(255,45,126,0.12) 0%,transparent 70%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",bottom:"-10%",left:"30%",width:400,height:400,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(0,229,255,0.1) 0%,transparent 70%)",pointerEvents:"none",zIndex:0}}/>

      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:100,
        background:"rgba(7,6,15,0.85)",backdropFilter:"blur(20px)",
        borderBottom:`1px solid ${C.border}`,padding:"14px 48px",
        display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:900,
          background:`linear-gradient(90deg,${C.purple},${C.pink})`,
          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:2}}>
          ⬡ CPUSIM
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <NBtn label="Home" active/>
          <NBtn label="Simulator" glow onClick={onStart}/>
        </div>
      </nav>

      {/* HERO */}
      <section style={{position:"relative",zIndex:1,textAlign:"center",
        padding:"100px 24px 80px"}}>

        <div style={{display:"inline-block",background:"rgba(108,59,255,0.15)",
          border:"1px solid rgba(108,59,255,0.4)",borderRadius:100,
          padding:"6px 20px",fontSize:11,color:C.purple,letterSpacing:3,
          fontWeight:700,marginBottom:28}}>
          OPERATING SYSTEM LABORATORY
        </div>

        <h1 style={{fontFamily:"'Orbitron',sans-serif",
          fontSize:"clamp(32px,5.5vw,80px)",fontWeight:900,lineHeight:1.05,
          marginBottom:24,letterSpacing:-1}}>
          <span style={{background:`linear-gradient(135deg,${C.cyan} 0%,${C.purple} 50%,${C.pink} 100%)`,
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            CPU SCHEDULING
          </span>
          <br/>
          <span style={{color:C.text,fontSize:"0.65em",letterSpacing:8,fontWeight:400}}>
            SIMULATOR
          </span>
        </h1>

        <p style={{fontSize:16,color:C.muted,maxWidth:480,margin:"0 auto 48px",
          lineHeight:1.8,fontWeight:600}}>
          Visualize how your OS decides which process gets CPU time.
          <br/>Compare algorithms. Analyze performance metrics.
        </p>

        <button onClick={onStart}
          onMouseOver={e=>e.currentTarget.style.transform="translateY(-3px) scale(1.03)"}
          onMouseOut={e=>e.currentTarget.style.transform="translateY(0) scale(1)"}
          style={{
            padding:"16px 52px",fontSize:15,fontWeight:700,letterSpacing:3,
            fontFamily:"'Orbitron',sans-serif",cursor:"pointer",borderRadius:12,
            background:`linear-gradient(135deg,${C.purple},${C.pink})`,
            border:"none",color:"#fff",
            boxShadow:`0 0 40px rgba(108,59,255,0.45)`,
            transition:"transform .2s, box-shadow .2s"
          }}>
          LAUNCH SIMULATOR ›
        </button>

        {/* Stat chips */}
        <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:56,flexWrap:"wrap"}}>
          {[["5","Algorithms"],["3","View Modes"],["∞","Processes"]].map(([n,l])=>(
            <div key={l} style={{background:C.card,border:`1px solid ${C.border}`,
              borderRadius:12,padding:"14px 28px",minWidth:100}}>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:28,fontWeight:900,
                background:`linear-gradient(135deg,${C.purple},${C.cyan})`,
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{n}</div>
              <div style={{fontSize:11,color:C.muted,letterSpacing:2,marginTop:4}}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{position:"relative",zIndex:1,padding:"0 48px 60px",maxWidth:1100,margin:"0 auto"}}>
        <SectionTitle>FEATURES</SectionTitle>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16,marginTop:32}}>
          {[
            {icon:"📊",t:"Gantt Chart",   d:"Color-coded CPU execution timeline with time markers"},
            {icon:"📋",t:"Statistics",    d:"Waiting, turnaround & response time per process"},
            {icon:"📈",t:"Timeline View", d:"Visual per-process execution bars at a glance"},
            {icon:"⚡",t:"5 Algorithms",  d:"FCFS, SJF, SRTF, Round Robin, Priority"},
          ].map(f=>(
            <div key={f.t}
              onMouseOver={e=>{e.currentTarget.style.borderColor=C.purple;e.currentTarget.style.transform="translateY(-4px)";}}
              onMouseOut={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="translateY(0)";}}
              style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,
                padding:"28px 24px",transition:"all .2s",cursor:"default"}}>
              <div style={{fontSize:36,marginBottom:14}}>{f.icon}</div>
              <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:8}}>{f.t}</div>
              <div style={{fontSize:13,color:C.muted,lineHeight:1.7}}>{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ALGORITHMS */}
      <section style={{position:"relative",zIndex:1,padding:"0 48px 80px",maxWidth:1100,margin:"0 auto"}}>
        <SectionTitle>ALGORITHMS</SectionTitle>
        <div style={{display:"flex",flexWrap:"wrap",gap:12,marginTop:32,justifyContent:"center"}}>
          {[
            {n:"FCFS",  f:"First Come First Serve",   c:C.pink},
            {n:"SJF",   f:"Shortest Job First",       c:C.purple},
            {n:"SRTF",  f:"Shortest Remaining Time",  c:C.cyan},
            {n:"RR",    f:"Round Robin",               c:C.yellow},
            {n:"Priority",f:"Priority Scheduling",    c:C.green},
          ].map(a=>(
            <div key={a.n} style={{background:`${a.c}12`,border:`1px solid ${a.c}40`,
              borderRadius:12,padding:"16px 24px",minWidth:160,textAlign:"center"}}>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:700,
                color:a.c,marginBottom:6}}>{a.n}</div>
              <div style={{fontSize:11,color:C.muted}}>{a.f}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{borderTop:`1px solid ${C.border}`,padding:"20px 48px",
        display:"flex",justifyContent:"space-between",alignItems:"center",
        position:"relative",zIndex:1,flexWrap:"wrap",gap:10}}>
        <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:700,
          background:`linear-gradient(90deg,${C.purple},${C.pink})`,
          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>⬡ CPUSIM</div>
        <div style={{fontSize:11,color:C.muted}}>CPU SCHEDULING SIMULATOR · OPERATING SYSTEM LABORATORY</div>
      </footer>
    </div>
  );
}

function SectionTitle({children}){
  return(
    <div style={{textAlign:"center"}}>
      <span style={{fontSize:10,fontWeight:700,letterSpacing:5,color:C.purple,
        fontFamily:"'Orbitron',sans-serif"}}>{children}</span>
      <div style={{width:40,height:2,background:`linear-gradient(90deg,${C.purple},${C.pink})`,
        margin:"10px auto 0",borderRadius:2}}/>
    </div>
  );
}

function NBtn({label,active,glow,onClick}){
  return(
    <button onClick={onClick} style={{
      padding:"8px 20px",borderRadius:8,cursor:"pointer",
      fontSize:12,fontWeight:700,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif",
      background:glow?`linear-gradient(135deg,${C.purple},${C.pink})`
               :active?"rgba(108,59,255,0.15)":"transparent",
      border:glow?"none":`1px solid ${active?C.purple:C.border}`,
      color:glow?"#fff":active?C.purple:C.muted,
      boxShadow:glow?`0 0 20px rgba(108,59,255,0.4)`:"none",
      transition:"all .15s"
    }}>{label}</button>
  );
}

/* ══════════════════════════════════════════════
   SIMULATOR
══════════════════════════════════════════════ */
function Sim({onHome}){
  const [procs,setProcs]=useState(DEFAULTS);
  const [algo,setAlgo]=useState("FCFS");
  const [q,setQ]=useState(2);
  const [result,setResult]=useState(null);
  const [tab,setTab]=useState("gantt");
  const [loading,setLoading]=useState(false);
  const [newP,setNewP]=useState({pid:"P5",arrival:0,burst:1,priority:1});

  const run=useCallback(()=>{
    setLoading(true);
    setTimeout(()=>{
      const m={FCFS:fcfs,SJF:sjf,SRTF:srtf,RR:(p)=>rr(p,q),Priority:pri};
      setResult(m[algo](procs));setLoading(false);setTab("gantt");
    },400);
  },[procs,algo,q]);

  const add=()=>{
    if(!newP.pid.trim())return;
    setProcs([...procs,{...newP,color:PROC_COLORS[procs.length%PROC_COLORS.length]}]);
    setNewP({pid:`P${procs.length+2}`,arrival:0,burst:1,priority:1});
  };

  const sa=result?Object.values(result.stats):[];
  const n=sa.length;
  const avgWT =n?(sa.reduce((s,x)=>s+x.waiting,0)/n).toFixed(2):"—";
  const avgTAT=n?(sa.reduce((s,x)=>s+x.turnaround,0)/n).toFixed(2):"—";
  const avgRT =n?(sa.reduce((s,x)=>s+(x.response??0),0)/n).toFixed(2):"—";
  const totalB=procs.reduce((s,p)=>s+p.burst,0);
  const totalT=result?.gantt?.length?result.gantt[result.gantt.length-1].end:0;
  const util=totalT?((totalB/totalT)*100).toFixed(1):"—";
  const gMax=result?.gantt?Math.max(...result.gantt.map(g=>g.end),1):1;

  return(
    <div style={{width:"100vw",height:"100vh",background:C.bg,color:C.text,
      fontFamily:"'Rajdhani',sans-serif",
      display:"grid",gridTemplateColumns:"280px 1fr",overflow:"hidden"}}>

      {/* Gradient blobs */}
      <div style={{position:"fixed",top:"-30%",left:"-20%",width:500,height:500,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(108,59,255,0.1) 0%,transparent 70%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",bottom:"-20%",right:"-10%",width:400,height:400,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(255,45,126,0.08) 0%,transparent 70%)",pointerEvents:"none",zIndex:0}}/>

      {/* ── SIDEBAR ── */}
      <aside style={{background:C.bg2,borderRight:`1px solid ${C.border}`,
        display:"flex",flexDirection:"column",gap:12,
        padding:"16px 14px",overflowY:"auto",height:"100vh",position:"relative",zIndex:1}}>

        {/* Brand + Home */}
        <div style={{paddingBottom:14,borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:13,fontWeight:900,
            background:`linear-gradient(90deg,${C.purple},${C.pink})`,
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
            letterSpacing:2,marginBottom:12,textAlign:"center"}}>⬡ CPUSIM</div>
          <button onClick={onHome}
            onMouseOver={e=>{e.currentTarget.style.background=`rgba(108,59,255,0.15)`;e.currentTarget.style.borderColor=C.purple;e.currentTarget.style.color=C.purple;}}
            onMouseOut={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}
            style={{width:"100%",padding:"8px",background:"transparent",
              border:`1px solid ${C.border}`,color:C.muted,borderRadius:8,cursor:"pointer",
              fontSize:12,fontWeight:700,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif",
              display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all .15s"}}>
            ← HOME
          </button>
        </div>

        {/* Algorithm */}
        <Panel title="ALGORITHM" color={C.purple}>
          {ALGOS.map(a=>(
            <button key={a.id} onClick={()=>setAlgo(a.id)}
              style={{width:"100%",padding:"9px 12px",borderRadius:8,cursor:"pointer",
                display:"flex",justifyContent:"space-between",alignItems:"center",
                background:algo===a.id?`${C.purple}20`:"transparent",
                border:`1px solid ${algo===a.id?C.purple:C.border}`,
                color:algo===a.id?C.text:C.muted,
                fontFamily:"'Rajdhani',sans-serif",transition:"all .15s",textAlign:"left",marginBottom:5}}>
              <span style={{fontWeight:700,fontSize:13}}>{a.label}</span>
              <span style={{fontSize:10,opacity:.6}}>{a.sub}</span>
            </button>
          ))}
          {algo==="RR"&&(
            <div style={{display:"flex",alignItems:"center",gap:10,marginTop:6,
              background:`${C.purple}10`,border:`1px solid ${C.purple}40`,
              borderRadius:8,padding:"8px 12px"}}>
              <span style={{fontSize:11,color:C.purple,fontWeight:700,letterSpacing:1}}>QUANTUM</span>
              <input type="number" min={1} max={20} value={q} onChange={e=>setQ(+e.target.value)}
                style={{width:52,background:"transparent",border:`1px solid ${C.purple}`,
                  color:C.purple,padding:"4px 8px",borderRadius:6,
                  fontFamily:"'Orbitron',sans-serif",fontSize:13,textAlign:"center"}}/>
            </div>
          )}
        </Panel>

        {/* Processes */}
        <Panel title={`PROCESSES · ${procs.length}`} color={C.cyan}>
          <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:175,overflowY:"auto"}}>
            {procs.map(p=>(
              <div key={p.pid} style={{display:"flex",alignItems:"center",gap:8,
                background:`${p.color}0d`,border:`1px solid ${p.color}30`,
                borderRadius:8,padding:"6px 10px"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:p.color,
                  boxShadow:`0 0 6px ${p.color}`,flexShrink:0}}/>
                <span style={{fontWeight:700,fontSize:12,color:p.color,minWidth:26}}>{p.pid}</span>
                <span style={{fontSize:10,color:C.muted,flex:1}}>AT:{p.arrival} BT:{p.burst} PR:{p.priority}</span>
                <button onClick={()=>setProcs(procs.filter(x=>x.pid!==p.pid))}
                  style={{background:"none",border:"none",color:"#ff4466",cursor:"pointer",fontSize:15,padding:0}}>×</button>
              </div>
            ))}
          </div>
          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:10,marginTop:8}}>
            <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginBottom:8,fontWeight:700}}>ADD PROCESS</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {[["PID","pid","text"],["Arrival","arrival","number"],["Burst","burst","number"],["Priority","priority","number"]].map(([l,k,t])=>(
                <div key={k}>
                  <div style={{fontSize:9,color:C.muted,marginBottom:3,letterSpacing:2,fontWeight:700}}>{l}</div>
                  <input type={t} value={newP[k]}
                    onChange={e=>setNewP({...newP,[k]:t==="number"?+e.target.value:e.target.value})}
                    style={{width:"100%",background:"rgba(255,255,255,0.04)",
                      border:`1px solid ${C.border}`,color:C.text,
                      padding:"6px 8px",borderRadius:6,fontFamily:"'Rajdhani',sans-serif",
                      fontSize:13,boxSizing:"border-box"}}/>
                </div>
              ))}
            </div>
            <button onClick={add}
              onMouseOver={e=>e.currentTarget.style.background=`${C.cyan}25`}
              onMouseOut={e=>e.currentTarget.style.background=`${C.cyan}10`}
              style={{width:"100%",marginTop:8,padding:"8px",
                background:`${C.cyan}10`,border:`1px solid ${C.cyan}60`,
                color:C.cyan,borderRadius:8,cursor:"pointer",
                fontSize:12,fontWeight:700,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif",
                transition:"background .15s"}}>
              + ADD PROCESS
            </button>
          </div>
        </Panel>

        {/* Run */}
        <button onClick={run} disabled={loading||!procs.length}
          onMouseOver={e=>!loading&&!procs.length||e.currentTarget.style.setProperty("box-shadow",`0 0 30px rgba(108,59,255,0.6)`)}
          onMouseOut={e=>e.currentTarget.style.setProperty("box-shadow",`0 0 20px rgba(108,59,255,0.35)`)}
          style={{
            padding:"14px",
            background:loading||!procs.length?"rgba(108,59,255,0.2)":`linear-gradient(135deg,${C.purple},${C.pink})`,
            border:"none",color:"#fff",borderRadius:10,
            fontSize:13,fontWeight:700,letterSpacing:3,
            fontFamily:"'Orbitron',sans-serif",
            boxShadow:`0 0 20px rgba(108,59,255,0.35)`,
            transition:"all .2s",
            opacity:loading||!procs.length?.5:1,
            cursor:loading||!procs.length?"not-allowed":"pointer"
          }}>
          {loading?"COMPUTING...":"▶  RUN"}
        </button>
      </aside>

      {/* ── MAIN ── */}
      <main style={{display:"flex",flexDirection:"column",height:"100vh",
        overflow:"hidden",position:"relative",zIndex:1}}>

        {/* Top bar */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"12px 20px",borderBottom:`1px solid ${C.border}`,
          background:"rgba(7,6,15,0.6)",backdropFilter:"blur(10px)",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={onHome}
              onMouseOver={e=>{e.currentTarget.style.background=`${C.purple}20`;e.currentTarget.style.borderColor=C.purple;e.currentTarget.style.color=C.text;}}
              onMouseOut={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}
              style={{padding:"6px 16px",background:"transparent",
                border:`1px solid ${C.border}`,color:C.muted,borderRadius:8,cursor:"pointer",
                fontSize:12,fontWeight:700,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif",transition:"all .15s"}}>
              ← HOME
            </button>
            <span style={{fontSize:12,color:C.muted,letterSpacing:2}}>/ SIMULATOR /</span>
            <span style={{fontSize:12,color:C.purple,fontWeight:700,letterSpacing:2}}>{algo}</span>
          </div>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:10,fontWeight:700,
            color:C.muted,letterSpacing:3}}>CPU SCHEDULING SIMULATOR</div>
        </div>

        {/* Metrics */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,
          padding:"12px 20px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          {[
            {l:"Avg Wait",     v:avgWT!=="—"?`${avgWT} ms`:"—",  c:C.yellow,  g:"#ff9f00"},
            {l:"Avg Turnaround",v:avgTAT!=="—"?`${avgTAT} ms`:"—",c:C.pink,   g:"#ff6b6b"},
            {l:"Avg Response",  v:avgRT!=="—"?`${avgRT} ms`:"—", c:C.cyan,    g:"#00b4d8"},
            {l:"CPU Utilization",v:util!=="—"?`${util}%`:"—",     c:C.green,   g:"#00c896"},
          ].map(m=>(
            <div key={m.l} style={{
              background:`linear-gradient(135deg,${m.c}0d,${m.g}08)`,
              border:`1px solid ${m.c}30`,borderRadius:12,
              padding:"12px 16px",textAlign:"center"}}>
              <div style={{fontSize:9,color:C.muted,letterSpacing:2,marginBottom:6,fontWeight:700}}>{m.l.toUpperCase()}</div>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:20,fontWeight:900,color:m.c}}>{m.v}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:4,padding:"10px 20px",
          borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          {[["gantt","📊  GANTT"],["table","📋  STATS"],["timeline","📈  TIMELINE"]].map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)}
              style={{padding:"8px 20px",borderRadius:8,cursor:"pointer",
                fontSize:11,fontWeight:700,letterSpacing:2,
                fontFamily:"'Rajdhani',sans-serif",
                background:tab===id?`${C.purple}25`:"transparent",
                border:`1px solid ${tab===id?C.purple:C.border}`,
                color:tab===id?C.text:C.muted,transition:"all .15s"}}>
              {lbl}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{flex:1,overflowY:"auto",padding:"20px"}}>
          {!result?(
            <div style={{height:"100%",display:"flex",flexDirection:"column",
              alignItems:"center",justifyContent:"center",gap:16}}>
              <div style={{width:80,height:80,borderRadius:"50%",
                border:`2px solid ${C.purple}40`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:32,opacity:.3}}>⚙</div>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:13,color:"#2a2040",letterSpacing:4}}>
                AWAITING SIMULATION
              </div>
              <div style={{fontSize:11,color:"#1a1830",letterSpacing:3}}>
                SELECT ALGORITHM → CONFIGURE → RUN
              </div>
            </div>
          ):(
            <>
              {tab==="gantt"    && <GanttV    gantt={result.gantt} gMax={gMax} procs={procs} algo={algo}/>}
              {tab==="table"    && <TableV    stats={sa} showPri={algo==="Priority"} totalB={totalB} totalT={totalT} n={procs.length}/>}
              {tab==="timeline" && <TimelineV procs={procs} stats={result.stats} gMax={gMax}/>}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

/* ── Shared ── */
function Panel({title,color,children}){
  return(
    <div style={{background:`${color}08`,border:`1px solid ${color}25`,borderRadius:12,padding:14}}>
      <div style={{fontSize:10,letterSpacing:3,color,marginBottom:10,fontWeight:700,
        fontFamily:"'Orbitron',sans-serif"}}>{title}</div>
      {children}
    </div>
  );
}

function GanttV({gantt,gMax,procs,algo}){
  const ticks=[];
  const step=Math.max(1,Math.floor(gMax/16));
  for(let t=0;t<=gMax;t+=step)ticks.push(t);
  if(ticks[ticks.length-1]!==gMax)ticks.push(gMax);
  return(
    <div>
      <VLabel>GANTT CHART — {algo}</VLabel>
      <div style={{overflowX:"auto",paddingBottom:4}}>
        <div style={{minWidth:500}}>
          <div style={{display:"flex",height:64,borderRadius:10,overflow:"hidden",
            border:`1px solid ${C.border}`,boxShadow:`0 0 20px rgba(108,59,255,0.1)`}}>
            {gantt.map((b,i)=>{
              const w=((b.end-b.start)/gMax)*100;
              return(
                <div key={i} title={`${b.pid}: ${b.start}→${b.end}`}
                  style={{width:`${w}%`,height:"100%",background:b.color,
                    borderRight:"2px solid rgba(7,6,15,0.5)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:w>4?12:0,fontWeight:900,color:"rgba(0,0,0,0.8)",
                    position:"relative",overflow:"hidden",flexShrink:0,cursor:"default"}}>
                  {w>4&&b.pid}
                  <div style={{position:"absolute",top:0,left:0,right:0,height:"40%",
                    background:"rgba(255,255,255,0.2)"}}/>
                </div>
              );
            })}
          </div>
          <div style={{position:"relative",height:24,marginTop:4}}>
            {ticks.map(t=>(
              <div key={t} style={{position:"absolute",left:`${(t/gMax)*100}%`,
                fontSize:10,color:C.muted,transform:"translateX(-50%)",top:4,
                fontWeight:700}}>{t}</div>
            ))}
          </div>
        </div>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:20}}>
        {procs.map(p=>(
          <div key={p.pid} style={{display:"flex",alignItems:"center",gap:7,
            background:`${p.color}12`,border:`1px solid ${p.color}40`,
            borderRadius:8,padding:"5px 12px"}}>
            <div style={{width:8,height:8,borderRadius:2,background:p.color,
              boxShadow:`0 0 6px ${p.color}`}}/>
            <span style={{fontSize:12,color:p.color,fontWeight:700}}>{p.pid}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TableV({stats,showPri,totalB,totalT,n}){
  const cols=["PID","Arrival","Burst",...(showPri?["Priority"]:[]),"Start","Finish","Waiting","Turnaround","Response"];
  return(
    <div>
      <VLabel>PROCESS STATISTICS</VLabel>
      <div style={{overflowX:"auto",borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr style={{background:`${C.purple}15`,borderBottom:`1px solid ${C.border}`}}>
              {cols.map(c=><th key={c} style={{padding:"11px 14px",textAlign:"right",
                fontSize:9,color:C.purple,letterSpacing:2,fontWeight:700,
                fontFamily:"'Orbitron',sans-serif"}}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {stats.map((s,i)=>(
              <tr key={s.pid} style={{background:i%2?`rgba(255,255,255,0.02)`:"transparent",
                borderBottom:`1px solid ${C.border}`}}>
                <td style={{padding:"10px 14px",fontWeight:800,fontSize:13,
                  background:`${PROC_COLORS[i%PROC_COLORS.length]}12`}}>
                  <span style={{color:PROC_COLORS[i%PROC_COLORS.length]}}>{s.pid}</span>
                </td>
                <td style={{padding:"10px 14px",textAlign:"right",color:C.muted}}>{s.arrival}</td>
                <td style={{padding:"10px 14px",textAlign:"right",color:C.muted}}>{s.burst}</td>
                {showPri&&<td style={{padding:"10px 14px",textAlign:"right",color:C.cyan}}>{s.priority}</td>}
                <td style={{padding:"10px 14px",textAlign:"right",color:C.cyan}}>{s.start??"-"}</td>
                <td style={{padding:"10px 14px",textAlign:"right",color:C.cyan}}>{s.finish}</td>
                <td style={{padding:"10px 14px",textAlign:"right",color:C.yellow,fontWeight:700}}>{s.waiting}</td>
                <td style={{padding:"10px 14px",textAlign:"right",color:C.pink,fontWeight:700}}>{s.turnaround}</td>
                <td style={{padding:"10px 14px",textAlign:"right",color:C.green}}>{s.response??s.waiting}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginTop:20}}>
        {[
          {l:"Total CPU Burst",  v:`${totalB} units`, c:C.purple},
          {l:"Time Elapsed",     v:`${totalT} units`, c:C.cyan},
          {l:"Throughput",       v:totalT?`${(n/totalT).toFixed(3)} p/u`:"—", c:C.green},
        ].map(m=>(
          <div key={m.l} style={{background:`${m.c}0d`,border:`1px solid ${m.c}30`,
            borderRadius:12,padding:"14px 18px"}}>
            <div style={{fontSize:9,color:C.muted,letterSpacing:2,marginBottom:6,fontWeight:700}}>{m.l}</div>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:18,fontWeight:900,color:m.c}}>{m.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineV({procs,stats,gMax}){
  return(
    <div>
      <VLabel>PROCESS TIMELINE</VLabel>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {procs.map(p=>{
          const s=stats[p.pid];if(!s)return null;
          const sl=(p.arrival/gMax)*100;
          const ww=(s.waiting/gMax)*100;
          const bw=(p.burst/gMax)*100;
          const tw=(s.turnaround/gMax)*100;
          return(
            <div key={p.pid} style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{minWidth:30,fontSize:13,fontWeight:800,color:p.color,
                fontFamily:"'Orbitron',sans-serif",fontSize:11}}>{p.pid}</div>
              <div style={{flex:1,height:32,background:"rgba(255,255,255,0.03)",borderRadius:6,
                overflow:"hidden",position:"relative",border:`1px solid ${p.color}20`}}>
                <div style={{position:"absolute",left:`${sl}%`,width:`${tw}%`,height:"100%",background:`${p.color}15`}}/>
                <div style={{position:"absolute",left:`${sl}%`,width:`${ww}%`,height:"100%",background:`${p.color}40`}}/>
                <div style={{position:"absolute",left:`${sl+ww}%`,width:`${bw}%`,height:"100%",
                  background:p.color,display:"flex",alignItems:"center",justifyContent:"center",
                  boxShadow:`0 0 10px ${p.color}60`}}>
                  <span style={{fontSize:9,fontWeight:900,color:"rgba(0,0,0,0.8)"}}>{p.burst}u</span>
                </div>
              </div>
              <div style={{minWidth:130,fontSize:11,textAlign:"right",fontWeight:700}}>
                WT:<span style={{color:C.yellow}}> {s.waiting}</span>
                &nbsp;&nbsp;TAT:<span style={{color:C.pink}}> {s.turnaround}</span>
              </div>
            </div>
          );
        })}
        <div style={{display:"flex",gap:20,marginTop:10,fontSize:10,color:C.muted}}>
          <span>█ Burst</span>
          <span style={{opacity:.6}}>▓ Waiting</span>
          <span style={{opacity:.3}}>░ Turnaround</span>
        </div>
      </div>
    </div>
  );
}

function VLabel({children}){
  return(
    <div style={{fontSize:10,color:C.muted,letterSpacing:3,marginBottom:16,
      fontWeight:700,fontFamily:"'Orbitron',sans-serif"}}>{children}</div>
  );
}