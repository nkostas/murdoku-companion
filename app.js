(() => {
  "use strict";

  const VERSION = "0.3.44";
  const CONFIG_KEY = "murdoku-general:config:v1";
  const PROGRESS_KEY = "murdoku-general:progress:v1";
  const LAYOUT_KEY = "murdoku-general:layout:v1";
  const VIEW_KEY = "murdoku-general:dark-view:v1";
  const PALETTE_PHASE_KEY = "murdoku-general:palette-phase:v1";
  const LONG_PRESS_MS = 600;
  const DRAG_THRESHOLD = 6;
  const RIBBON_COLORS = [
    {id:"white",value:"#ffffff"},{id:"black",value:"#111111"},
    {id:"red",value:"#f33437"},{id:"yellow",value:"#ffde27"},
    {id:"green",value:"#20c954"},{id:"blue",value:"#1684ef"},
    {id:"orange",value:"#ff9827"},{id:"purple",value:"#a75bdf"}
  ];
  const RIBBON_COLOR_MAP = Object.fromEntries(RIBBON_COLORS.map(c=>[c.id,c.value]));
  const NOTE_SYMBOLS = [
    { id:"@triangle", glyph:"▲", label:"Triangle", color:"#ff616f" },
    { id:"@circle",   glyph:"●", label:"Circle",   color:"#55aaff" },
    { id:"@square",   glyph:"■", label:"Square",   color:"#63d77a" },
    { id:"@star",     glyph:"★", label:"Star",     color:"#ffd84d" }
  ];
  function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = x => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function gcd(a,b){ while(b){ const t=b; b=a%b; a=t; } return Math.abs(a); }

function paletteStep(count){
  if(count <= 2) return 1;
  let step = Math.max(1, Math.floor(count / 2));
  while(step > 1 && gcd(step, count) !== 1) step--;
  if(gcd(step, count) !== 1){
    step = Math.max(1, Math.ceil(count / 2));
    while(step < count && gcd(step, count) !== 1) step++;
  }
  return Math.min(step, count - 1);
}

function paletteColor(index, total = 24) {
  const count = Math.max(1, Math.min(52, total));
  const step = paletteStep(count);
  const hueIndex = (index * step) % count;
  const hue = (hueIndex * 360 / count + 7) % 360;
  // Keep saturation/lightness stable so separation mainly comes from hue.
  // The hue order is a permutation of evenly spaced colors so consecutive
  // suspects are visually as different as practical.
  return hslToHex(hue, 82, 50);
}

let applyPalettePhase = 0;

function linearPaletteColor(index, total, phase = 0) {
  const count = Math.max(1, Math.min(52, total));
  const hue = (phase + (index * 360 / count)) % 360;
  return hslToHex(hue, 84, 50);
}

function nextApplyPalettePhase() {
  // Golden-angle rotation: every Apply gets a visibly different full-spectrum set.
  applyPalettePhase = (applyPalettePhase + 137.508) % 360;
  storageSet(PALETTE_PHASE_KEY, String(applyPalettePhase));
  return applyPalettePhase;
}

function legacyPaletteColor(index, total = 24) {
  const count = Math.max(1, Math.min(52, total));
  const hue = Math.round((index * 360 / count) % 360);
  const saturation = 72 - (index % 3) * 4;
  const lightness = 47 + (index % 2) * 6;
  return hslToHex(hue, saturation, lightness);
}

function rgbaFromHex(hex, alpha=.18){
  const value = String(hex || "").replace("#","");
  if(!/^[0-9a-fA-F]{6}$/.test(value)) return `rgba(70,120,190,${alpha})`;
  const n = parseInt(value,16);
  return `rgba(${n>>16},${(n>>8)&255},${n&255},${alpha})`;
}

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const el = {
    renameSuspectDialog: $("#renameSuspectDialog"), renameSuspectForm: $("#renameSuspectForm"), renameSuspectCurrent: $("#renameSuspectCurrent"), renameSuspectInput: $("#renameSuspectInput"), renameSuspectHelp: $("#renameSuspectHelp"), renameSuspectCancel: $("#renameSuspectCancel"),
    topbar: $("#topbar"), title: $("#puzzleTitle"), version: $("#versionBadge"), setupBtn: $("#setupBtn"),
    playScreen: $("#playScreen"), sidebar: $("#sidebar"), sidebarResizer: $("#sidebarResizer"), topbarResizer: $("#topbarResizer"),
    suspectList: $("#suspectList"), redistributeColors: $("#redistributeColorsBtn"), noteSymbols: $("#noteSymbols"), placedCount: $("#placedCount"), boardArea: $("#boardArea"), boardWrap: $("#boardWrap"), boardImage: $("#boardImage"), boardPlaceholder: $("#boardPlaceholder"), grid: $("#gridOverlay"), rowLabels: $("#rowLabels"), colLabels: $("#colLabels"),
    undo: $("#undoBtn"), redo: $("#redoBtn"), clearSelected: $("#clearSelectedBtn"), eraser: $("#eraserBtn"), reset: $("#resetBtn"), coords: $("#coordsBtn"), darkView: $("#darkViewBtn"), help: $("#helpBtn"), check: $("#checkBtn"), availableCells: $("#availableCellsCount"), availableTotal: $("#availableCellsTotal"), status: $("#status"), exportProgress: $("#exportProgressBtn"), importProgress: $("#importProgressInput"), helpDialog: $("#helpDialog"),
    setupScreen: $("#setupScreen"), setupFormResizer: $("#setupFormResizer"), setupHelp: $("#setupHelpBtn"), setupHelpDialog: $("#setupHelpDialog"), newPuzzle: $("#newPuzzleBtn"), cancelSetup: $("#cancelSetupBtn"), saveSetup: $("#saveSetupBtn"), setupTitle: $("#setupTitle"), setupRows: $("#setupRows"), setupCols: $("#setupCols"), setupSuspectCount: $("#setupSuspectCount"), applySuspectCount: $("#applySuspectCountBtn"), setupImageUrl: $("#setupImageUrl"), setupImageFile: $("#setupImageFile"), clearImage: $("#clearImageBtn"), imageStorageNote: $("#imageStorageNote"),
    annotationScale: $("#annotationScale"), annotationScaleValue: $("#annotationScaleValue"), editorModeTip: $("#editorModeTip"), editorModes: $("#editorModeButtons"), perspectiveTools: $("#perspectiveTools"), resetPerspective: $("#resetPerspectiveBtn"), applyPerspective: $("#applyPerspectiveBtn"), perspectiveStatus: $("#perspectiveStatus"), blockedTools: $("#blockedTools"), clearBlocked: $("#clearBlockedBtn"),
    previewArea: $("#setupPreviewArea"), previewWrap: $("#setupPreviewWrap"), previewImage: $("#setupPreviewImage"), previewPlaceholder: $("#setupPreviewPlaceholder"), perspectiveOverlay: $("#perspectiveOverlay"), perspectivePolygon: $("#perspectivePolygon"), perspectiveHandles: $("#perspectiveHandles"), setupGridBox: $("#setupGridBox"), setupGrid: $("#setupGridOverlay"), previewModeLabel: $("#previewModeLabel"), previewInfo: $("#previewInfo")
  };

  // X is forbidden in every puzzle. V is reserved for the Victim at <=22
  // suspects and omitted completely when there are more than 22 suspects.
  const ORDINARY_LETTERS = "ABCDEFGHIJKLMNOPQRSTUWYZ";
  const VICTIM_ORDINARY_LETTERS = "ABCDEFGHIJKLMNOPQRSTU";
  function victimLetterForCount(n) { return n <= 22 ? "V" : null; }
  function generatedIds(n, victimIndex = n - 1) {
    const letters = n <= 22 ? VICTIM_ORDINARY_LETTERS : ORDINARY_LETTERS;
    const pool = [...letters];
    if(n > 22){
      // Use AA, AB, ... after the permitted single-letter IDs.
      for(const first of letters) for(const second of letters) pool.push(first+second);
    }
    const result=[];
    let seq=0;
    for(let i=0;i<n;i++){
      result.push(n<=22 && i===victimIndex ? "V" : pool[seq++]);
    }
    return result;
  }
  function validSuspectLetter(id,count){
    return /^[A-Z]{1,2}$/.test(id) && !id.includes("X") &&
      (count <= 22 ? (id.length===1) : !id.includes("V"));
  }
  function compareSuspectIds(a,b) {
    const aa=String(a?.id ?? a ?? "").toUpperCase();
    const bb=String(b?.id ?? b ?? "").toUpperCase();
    if(aa.length!==bb.length)return aa.length-bb.length;
    return aa.localeCompare(bb,"en",{sensitivity:"base"});
  }
  function sortSuspects(list){ return [...list].sort(compareSuspectIds); }
  function makeSuspects(n, victimIndex = n - 1, phase = 0) {
    const ids = generatedIds(n, victimIndex);
    return Array.from({length:n}, (_,i) => ({ id: ids[i], color: linearPaletteColor(i, n, phase) }));
  }
  function defaultConfig() {
    const suspects=sortSuspects(makeSuspects(6,5));
    return {
      schemaVersion: 3, appVersion: VERSION, title: "New Puzzle", rows: 6, cols: 6,
      image: { type:"none", value:"", name:"" },
      gridInset: {left:0, top:0, right:0, bottom:0},
      annotationScale: 1,
      suspects,
      victimIndex: suspects.findIndex(s=>s.id===victimLetterForCount(suspects.length)),
      blockedCells: []
    };
  }
  function blankProgress(cfg=config) {
    return { selected: cfg.suspects[0]?.id || null, notes:{}, excludedCells:[], placements:{}, genders:{}, ribbons:{}, ribbonColors:{}, ribbonBrush:{style:"single",color:"white"}, coords:false };
  }
  const memoryStorage = new Map();
  function storageGet(key) {
    try {
      const value = window.localStorage.getItem(key);
      if (value !== null) memoryStorage.set(key, value);
      return value;
    } catch {
      return memoryStorage.has(key) ? memoryStorage.get(key) : null;
    }
  }
  function storageSet(key, value) {
    memoryStorage.set(key, value);
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
  applyPalettePhase = (Number(storageGet(PALETTE_PHASE_KEY)) || 0) % 360;
  let darkViewEnabled = storageGet(VIEW_KEY) === "true";
  function updateDarkView() {
    document.body.classList.toggle("dark-view", darkViewEnabled);
    el.darkView.textContent = darkViewEnabled ? "Light view" : "Dark view";
    el.darkView.setAttribute("aria-pressed", String(darkViewEnabled));
    el.darkView.title = darkViewEnabled ? "Switch to light view" : "Switch to dark view";
  }
  function redistributePlayColors() {
    const phase = nextApplyPalettePhase();
    const count = config.suspects.length;
    // IDs, selections, candidates, placements and excluded cells stay unchanged.
    config.suspects = config.suspects.map((suspect, i) => ({
      ...suspect, color: linearPaletteColor(i, count, phase)
    }));
    persistConfig();
    buildSuspects();
    render();
    setStatus("Suspect colors redistributed.", "good");
  }

  function safeParse(raw, fallback) {
    if (raw === null || raw === undefined || raw === "") return fallback;
    try {
      const value = JSON.parse(raw);
      return value === null || value === undefined ? fallback : value;
    } catch {
      return fallback;
    }
  }
  function normalizeConfig(c) {
    const d = defaultConfig(); c = c && typeof c === "object" ? c : {};
    const rows = clampInt(c.rows,1,60,d.rows), cols = clampInt(c.cols,1,60,d.cols);
    const source = Array.isArray(c.suspects) && c.suspects.length ? c.suspects.slice(0,52) : makeSuspects(6,5);
    const total=source.length;
    const hasVictim=total<=22;
    const legacy=Number(c.schemaVersion||0)<3;
    let victimIndex=hasVictim
      ? (source.findIndex(item=>String(item?.id||"").trim().toUpperCase()==="V"))
      : -1;
    if(hasVictim && victimIndex<0)victimIndex=Number.isInteger(c.victimIndex)&&c.victimIndex>=0&&c.victimIndex<total?c.victimIndex:total-1;
    const defaults=generatedIds(total,hasVictim?victimIndex:-1);
    // Old >22 puzzles had X as a victim and could use V as a suspect.
    // Upgrade them by position, avoiding both forbidden letters.
    const forceCanonical=legacy && total>22;
    let suspects=source.map((item,i)=>{
      const supplied=validHex(item?.color)?String(item.color).toLowerCase():"";
      const oldColor=legacyPaletteColor(i,total).toLowerCase();
      const color=!supplied||supplied===oldColor?paletteColor(i,total):item.color;
      let id=String(item?.id||"").trim().toUpperCase();
      if(forceCanonical)id=defaults[i];
      return {id,color};
    });
    const used=new Set();
    suspects.forEach((item,i)=>{
      if(hasVictim && i===victimIndex){item.id="V";used.add("V");return;}
      if(!validSuspectLetter(item.id,total)||item.id==="V"||used.has(item.id)){
        item.id=defaults.find(id=>id!=="V"&&!used.has(id)) || defaults[i];
      }
      used.add(item.id);
    });
    suspects=sortSuspects(suspects);
    victimIndex=hasVictim?suspects.findIndex(item=>item.id==="V"):-1;

    const inset = c.gridInset || {};
    return {
      schemaVersion:3, appVersion:VERSION, title:String(c.title || "New Puzzle"), rows, cols,
      image: normalizeImage(c.image),
      gridInset:{ left:clampNum(inset.left,0,45,0), top:clampNum(inset.top,0,45,0), right:clampNum(inset.right,0,45,0), bottom:clampNum(inset.bottom,0,45,0) },
      annotationScale: clampNum(c.annotationScale,0.7,1.5,1),
      suspects, victimIndex,
      blockedCells: normalizeCells(c.blockedCells,rows,cols)
    };
  }
  function normalizeImage(img) { if(!img||typeof img!=="object") return {type:"none",value:"",name:""}; const type=["none","url","data"].includes(img.type)?img.type:"none"; return {type,value:String(img.value||""),name:String(img.name||"")}; }
  function normalizeCells(arr,rows,cols){ const out=[],seen=new Set(); (Array.isArray(arr)?arr:[]).forEach(p=>{if(Array.isArray(p)&&p.length>=2){const r=+p[0],c=+p[1],k=`${r},${c}`;if(Number.isInteger(r)&&Number.isInteger(c)&&r>=1&&r<=rows&&c>=1&&c<=cols&&!seen.has(k)){seen.add(k);out.push([r,c]);}}}); return out; }
  function clampInt(v,min,max,f){v=parseInt(v,10);return Number.isFinite(v)?Math.min(max,Math.max(min,v)):f}
  function clampNum(v,min,max,f){v=parseFloat(v);return Number.isFinite(v)?Math.min(max,Math.max(min,v)):f}
  function validHex(v){return /^#[0-9a-f]{6}$/i.test(String(v||""))}

  const initialConfigRaw = storageGet(CONFIG_KEY);
  const hasSavedConfig = initialConfigRaw !== null && safeParse(initialConfigRaw, null) !== null;
  let config = normalizeConfig(safeParse(initialConfigRaw, defaultConfig()));
  let progress = sanitizeProgress(migrateLegacyProgress(
    safeParse(initialConfigRaw, null),
    safeParse(storageGet(PROGRESS_KEY), blankProgress(config)), config), config);
  let undoStack=[], redoStack=[], gesture=null, eraseMode=false;
  let draft=null, setupMode="calibrate", setupGesture=null, calibrationDrag=null, perspectiveCorners=null, perspectiveDrag=null, perspectiveBusy=false;

  function remapProgressIds(source,map){
    const p=clone(source&&typeof source==="object"?source:{});
    for(const field of ["notes","placements","genders","ribbons","ribbonColors"]){
      if(!p[field]||typeof p[field]!=="object")continue;
      const old=p[field],next={};
      Object.entries(old).forEach(([id,value])=>{next[map[id]||id]=value});
      p[field]=next;
    }
    if(map[p.selected])p.selected=map[p.selected];
    return p;
  }
  function migrateLegacyProgress(rawConfig,rawProgress,newConfig){
    if(!rawConfig || Number(rawConfig.schemaVersion||0)>=3 || !Array.isArray(rawConfig.suspects)
       || rawConfig.suspects.length<=22) return rawProgress;
    const oldOrder=sortSuspects(rawConfig.suspects);
    const newOrder=sortSuspects(newConfig.suspects);
    const map={};
    oldOrder.forEach((item,i)=>{
      const before=String(item?.id||"").toUpperCase();
      const after=newOrder[i]?.id;
      if(before&&after&&before!==after)map[before]=after;
    });
    return remapProgressIds(rawProgress,map);
  }
  function sanitizeProgress(p,cfg){
    p=p&&typeof p==="object"?p:{};
    const suspectIds=new Set(cfg.suspects.map(s=>s.id));
    const noteIds=new Set(NOTE_SYMBOLS.map(s=>s.id));
    const selectableIds=new Set([...suspectIds,...noteIds]);
    const out={selected:selectableIds.has(p.selected)?p.selected:(cfg.suspects[0]?.id||NOTE_SYMBOLS[0].id),notes:{},excludedCells:[],placements:{},genders:{},ribbons:{},ribbonColors:{},ribbonBrush:{style:"single",color:"white"},coords:!!p.coords};
    // Gender is a play note, not part of puzzle setup. Older saves default to Unknown.
    if(p.genders && typeof p.genders === "object" && !Array.isArray(p.genders)){
      Object.entries(p.genders).forEach(([id, gender])=>{
        if(suspectIds.has(id) && (gender==="male" || gender==="female")) out.genders[id]=gender;
      });
    }
    // Ribbons are play-only annotations. Missing/legacy values mean no ribbon.
    if(p.ribbons && typeof p.ribbons === "object" && !Array.isArray(p.ribbons)){
      Object.entries(p.ribbons).forEach(([id, ribbon])=>{
        if(suspectIds.has(id) && ["single", "double", "thick"].includes(ribbon)) out.ribbons[id]=ribbon;
      });
    }
    if(p.ribbonColors && typeof p.ribbonColors === "object" && !Array.isArray(p.ribbonColors)){
      Object.entries(p.ribbonColors).forEach(([id,color])=>{
        if(suspectIds.has(id) && RIBBON_COLOR_MAP[color] && color!=="white")out.ribbonColors[id]=color;
      });
    }
    // Shared ribbon brush: the first right-click on a different, unribboned
    // suspect uses the last chosen ribbon style AND color. Older saves derive
    // their brush from the existing annotations.
    const storedBrush=p.ribbonBrush;
    if(storedBrush&&typeof storedBrush==="object"&&!Array.isArray(storedBrush)){
      if(["single","double","thick"].includes(storedBrush.style))out.ribbonBrush.style=storedBrush.style;
      if(RIBBON_COLOR_MAP[storedBrush.color])out.ribbonBrush.color=storedBrush.color;
    }else{
      const last=Object.keys(out.ribbons).at(-1);
      if(last){
        out.ribbonBrush.style=out.ribbons[last];
        out.ribbonBrush.color=out.ribbonColors[last]||"white";
      }
    }
    const blocked=new Set(cfg.blockedCells.map(([r,c])=>`${r},${c}`));
    const excluded=new Set();

    // v0.3.9+: X marks are global cell notes, not suspect-specific notes.
    // Older progress files are still supported: any legacy suspect-specific X
    // marks are migrated once into global excludedCells.
    if(Array.isArray(p.excludedCells)){
      p.excludedCells.forEach(item=>{
        let r,c;
        if(Array.isArray(item)){r=+item[0];c=+item[1]}
        else if(typeof item==="string"){[r,c]=item.split(",").map(Number)}
        const k=`${r},${c}`;
        if(Number.isInteger(r)&&Number.isInteger(c)&&r>=1&&r<=cfg.rows&&c>=1&&c<=cfg.cols&&!blocked.has(k))excluded.add(k);
      });
    }

    Object.entries(p.notes||{}).forEach(([id,notes])=>{
      if(!selectableIds.has(id)||!notes||typeof notes!=="object")return;
      Object.entries(notes).forEach(([k,t])=>{
        const [r,c]=k.split(",").map(Number);
        if(!(r>=1&&r<=cfg.rows&&c>=1&&c<=cfg.cols&&!blocked.has(k)))return;
        if(t==="candidate"){
          out.notes[id]??={}; out.notes[id][k]="candidate";
        } else if(t==="excluded"){
          excluded.add(k);
        }
      });
    });
    Object.entries(p.placements||{}).forEach(([id,pos])=>{
      if(selectableIds.has(id)&&Array.isArray(pos)){
        const r=+pos[0],c=+pos[1],k=`${r},${c}`;
        if(r>=1&&r<=cfg.rows&&c>=1&&c<=cfg.cols&&!blocked.has(k))out.placements[id]=[r,c];
      }
    });
    const occupied=new Set(Object.values(out.placements).map(([r,c])=>`${r},${c}`));
    out.excludedCells=[...excluded].filter(k=>!occupied.has(k)).map(k=>k.split(",").map(Number));
    return out;
  }
  function persistConfig(){return storageSet(CONFIG_KEY,JSON.stringify(config))}
  function persistProgress(){storageSet(PROGRESS_KEY,JSON.stringify(progress))}
  function clone(v){return JSON.parse(JSON.stringify(v))}
  // Undo/Redo tracks only board edits. Suspect metadata, active selection and
  // UI options must never roll back when a board edit is undone or redone.
  function boardSnapshot(){
    return clone({notes:progress.notes,excludedCells:progress.excludedCells,placements:progress.placements});
  }
  function restoreBoardSnapshot(state){
    for(const key of ["notes","excludedCells","placements"])progress[key]=clone(state[key]||((key==="excludedCells")?[]:{}));
  }
  function checkpoint(){undoStack.push(boardSnapshot());if(undoStack.length>100)undoStack.shift();redoStack=[]}
  function setStatus(msg="",kind=""){el.status.textContent=msg;el.status.className=`status ${kind}`.trim()}
  function cellKey(r,c){return `${r},${c}`}
  function blockedSet(cfg=config){return new Set(cfg.blockedCells.map(([r,c])=>cellKey(r,c)))}
  function suspectById(id,cfg=config){return cfg.suspects.find(s=>s.id===id)}
  function noteSymbolById(id){return NOTE_SYMBOLS.find(s=>s.id===id)}
  function isNoteSymbol(id){return Boolean(noteSymbolById(id))}
  function selectableById(id,cfg=config){return suspectById(id,cfg)||noteSymbolById(id)}
  function darken(hex,amt=.30){let n=parseInt(hex.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255;r=Math.round(r*(1-amt));g=Math.round(g*(1-amt));b=Math.round(b*(1-amt));return `#${((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}`}
  function lighten(hex,amt=.48){let n=parseInt(hex.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255;r=Math.round(r+(255-r)*amt);g=Math.round(g+(255-g)*amt);b=Math.round(b+(255-b)*amt);return `#${((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}`}
  function escapeHtml(v){return String(v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]))}

  function imageSource(cfg=config){return cfg.image.type==="none"?"":cfg.image.value}
  function setImageElement(img,wrap,placeholder,cfg=config){const src=imageSource(cfg);wrap.classList.toggle("has-image",!!src);if(!src){img.removeAttribute("src");placeholder.style.display="grid";return;}placeholder.style.display="none";if(img.src!==src)img.src=src;}

  function applyGridGeometry(){const i=config.gridInset;el.grid.style.left=`${i.left}%`;el.grid.style.top=`${i.top}%`;el.grid.style.right=`${i.right}%`;el.grid.style.bottom=`${i.bottom}%`;el.grid.style.gridTemplateColumns=`repeat(${config.cols},1fr)`;el.grid.style.gridTemplateRows=`repeat(${config.rows},1fr)`;}
  function fitBoard(){const rect=el.boardArea.getBoundingClientRect();if(rect.width<2||rect.height<2)return;const has=imageSource();let ratio=config.cols/config.rows;if(has&&el.boardImage.naturalWidth&&el.boardImage.naturalHeight)ratio=el.boardImage.naturalWidth/el.boardImage.naturalHeight;let width=Math.min(rect.width,rect.height*ratio),height=width/ratio;if(height>rect.height){height=rect.height;width=height*ratio}el.boardWrap.style.width=`${Math.max(1,Math.floor(width))}px`;el.boardWrap.style.height=`${Math.max(1,Math.floor(height))}px`;updateCandidateSizes(width,height);}
  function updateCandidateSizes(width,height){const i=config.gridInset;const cw=(width*(100-i.left-i.right)/100)/config.cols;const ch=(height*(100-i.top-i.bottom)/100)/config.rows;const cell=Math.max(1,Math.min(cw,ch));const defs=[[2,"2"],[3,"3"],[4,"4"],[5,"5"],[6,"6"],[7,"7"],[8,"8"]];defs.forEach(([n,key])=>{const slot=cell*.98/n;const size=Math.max(2.8,slot*.78);el.boardWrap.style.setProperty(`--token-${key}`,`${size.toFixed(2)}px`);el.boardWrap.style.setProperty(`--font-${key}`,`${Math.max(2.4,size*.61).toFixed(2)}px`)});el.boardWrap.style.setProperty("--token-1","var(--token-2)");el.boardWrap.style.setProperty("--font-1","var(--font-2)");el.boardWrap.style.setProperty("--annotation-scale",String(config.annotationScale||1));}
  function buildGrid(){el.grid.innerHTML="";for(let r=1;r<=config.rows;r++)for(let c=1;c<=config.cols;c++){const b=document.createElement("button");b.type="button";b.className="cell";b.dataset.row=r;b.dataset.col=c;b.setAttribute("aria-label",`R${r} C${c}`);el.grid.appendChild(b)}buildCoords()}
  function buildCoords(){el.rowLabels.innerHTML="";el.colLabels.innerHTML="";const i=config.gridInset,W=100-i.left-i.right,H=100-i.top-i.bottom;for(let r=1;r<=config.rows;r++){const s=document.createElement("span");s.className="coord";s.textContent=r;s.style.left=`${i.left+.15}%`;s.style.top=`${i.top+(r-1)*H/config.rows+.12}%`;el.rowLabels.appendChild(s)}for(let c=1;c<=config.cols;c++){const s=document.createElement("span");s.className="coord";s.textContent=c;s.style.left=`${i.left+(c-1)*W/config.cols+.15}%`;s.style.top=`${i.top+.12}%`;el.colLabels.appendChild(s)}}
  const GENDER_CYCLE = ["unknown", "male", "female"];
  // Consistent, bold vector icons, matching the style of the reference portrait cards.
  // Using SVG avoids the very thin platform-dependent Unicode male/female glyphs.
  const GENDER_SVG = {
    unknown:"",
    male:'<svg class="gender-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="9" cy="15" r="5.2"/><path d="M12.7 11.3 20 4 M14.4 4 H20 V9.6"/></svg>',
    female:'<svg class="gender-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="8.5" r="5.4"/><path d="M12 14 V21 M7.7 18 H16.3"/></svg>'
  };
  const GENDER_LABEL = {unknown:"None", male:"Male", female:"Female"};
  const RIBBON_CYCLE = ["none", "single", "double", "thick"];
  const RIBBON_LABEL = {none:"None", single:"Single ribbon", double:"Double ribbon", thick:"Thick ribbon"};

  function suspectGender(id){return progress.genders?.[id] || "unknown";}
  function suspectRibbon(id){return progress.ribbons?.[id] || "none";}
  function suspectRibbonColor(id){return progress.ribbonColors?.[id] || "white";}
  function updateSuspectTile(button,id){
    const gender=suspectGender(id), ribbon=suspectRibbon(id), ribbonColor=suspectRibbonColor(id), placed=!!progress.placements[id];
    button.classList.toggle("active", id===progress.selected);
    button.classList.toggle("placed", placed);
    button.dataset.gender=gender;
    button.dataset.ribbon=ribbon;
    const genderMark=button.querySelector(".suspect-gender-mark");
    const ribbonMark=button.querySelector(".suspect-ribbon-mark");
    if(genderMark && genderMark.dataset.gender!==gender){
      genderMark.innerHTML=GENDER_SVG[gender];
      genderMark.dataset.gender=gender;
    }
    if(ribbonMark){
      ribbonMark.dataset.ribbon=ribbon;
      const fill=RIBBON_COLOR_MAP[ribbonColor]||RIBBON_COLOR_MAP.white;
      ribbonMark.style.setProperty("--ribbon-fill",fill);
      ribbonMark.style.setProperty("--ribbon-edge",["black","blue","purple"].includes(ribbonColor)?"#fff":"#131a23");
    }
    button.title=`${id} · ${GENDER_LABEL[gender]} · ${RIBBON_LABEL[ribbon]} (${ribbonColor})${placed?" · Placed":""}\nLeft click: select · Right click: ribbon · Ctrl+click: ribbon color · Shift+click: gender · Long press: change letter`;
    button.setAttribute("aria-label",`Suspect ${id}, ${GENDER_LABEL[gender]}, ${RIBBON_LABEL[ribbon]}, ${ribbonColor}${placed?", placed":""}. Left click to select, right click for ribbon, Ctrl click for ribbon color, Shift click for gender, long press to change letter.`);
  }
  function cycleSuspectGender(id){
    if(!suspectById(id))return;
    const current=suspectGender(id);
    const next=GENDER_CYCLE[(GENDER_CYCLE.indexOf(current)+1)%GENDER_CYCLE.length];
    progress.genders??={};
    if(next==="unknown")delete progress.genders[id];
    else progress.genders[id]=next;
    persistProgress();render();
    setStatus(`Suspect ${id}: ${GENDER_LABEL[next]}.`);
  }
  function cycleSuspectRibbon(id){
    if(!suspectById(id))return;
    const current=suspectRibbon(id);
    progress.ribbonBrush??={style:"single",color:"white"};
    const brush=progress.ribbonBrush;
    // For an unmarked suspect, START with the most recently used ribbon,
    // not necessarily a white single ribbon. Subsequent right-clicks on
    // that suspect continue its own none/single/double/thick cycle.
    const next=current==="none"
      ? (brush.style||"single")
      : RIBBON_CYCLE[(RIBBON_CYCLE.indexOf(current)+1)%RIBBON_CYCLE.length];
    progress.ribbons??={};
    progress.ribbonColors??={};
    if(next==="none"){
      delete progress.ribbons[id];
      brush.style="single"; // A repeated click after removal starts at single.
    }else{
      progress.ribbons[id]=next;
      if(brush.color==="white")delete progress.ribbonColors[id];
      else progress.ribbonColors[id]=brush.color;
      brush.style=next;
    }
    persistProgress();render();
    setStatus(`Suspect ${id}: ${RIBBON_LABEL[next]} (${suspectRibbonColor(id)}).`);
  }
  function cycleSuspectRibbonColor(id){
    if(!suspectById(id))return;
    progress.ribbonBrush??={style:"single",color:"white"};
    const brush=progress.ribbonBrush;
    // Color choices are shared across the suspect cards. If this suspect
    // already has a ribbon, advance from its actual color. Otherwise advance
    // from the last chosen brush color.
    const color=suspectRibbon(id)!=="none" ? suspectRibbonColor(id) : brush.color;
    const idx=RIBBON_COLORS.findIndex(c=>c.id===color);
    const next=RIBBON_COLORS[(idx+1)%RIBBON_COLORS.length].id;
    progress.ribbonColors??={};
    if(next==="white")delete progress.ribbonColors[id];
    else progress.ribbonColors[id]=next;
    brush.color=next;
    if(suspectRibbon(id)!=="none")brush.style=suspectRibbon(id);
    persistProgress();render();
    setStatus(`Suspect ${id}: ribbon ${suspectRibbonColor(id)}.`);
  }
  let renameSubjectId=null;
  function openRenameDialog(id){
    const suspect=suspectById(id);
    if(!suspect)return;
    if(id==="V" && config.suspects.length<=22){
      setStatus("V is reserved for the Victim and cannot be renamed.","error");return;
    }
    renameSubjectId=id;
    el.renameSuspectCurrent.textContent=id;
    el.renameSuspectInput.value=id;
    el.renameSuspectHelp.textContent=config.suspects.length<=22
      ? "One letter A–Z except X. V is reserved for the Victim. An existing letter swaps the two suspects."
      : "Letters A–Z except V and X, up to two characters. An existing letter swaps the two suspects.";
    el.renameSuspectDialog.showModal();
    el.renameSuspectInput.focus();el.renameSuspectInput.select();
  }
  function renameSuspectId(before,after){
    const current=suspectById(before);
    if(!current)return;
    after=String(after||"").trim().toUpperCase();
    if(after===before)return;
    if(!validSuspectLetter(after,config.suspects.length)||after==="V"){
      setStatus("Invalid letter: X is forbidden; V is reserved for the Victim (up to 22 suspects).","error");
      return false;
    }
    const other=suspectById(after);
    if(other?.id==="V"){
      setStatus("The Victim's letter cannot be changed.","error");return false;
    }
    const map={[before]:after};
    if(other)map[after]=before; // swap labels, preserving both suspects' notes and positions
    current.id=after;
    if(other)other.id=before;
    config.suspects=sortSuspects(config.suspects);
    config.victimIndex=config.suspects.findIndex(s=>s.id==="V");
    // Keep progress + old undo/redo notes linked to the same physical suspects.
    progress=remapProgressIds(progress,map);
    undoStack=undoStack.map(p=>remapProgressIds(p,map));
    redoStack=redoStack.map(p=>remapProgressIds(p,map));
    persistConfig();persistProgress();buildSuspects();render();
    setStatus(other?`Swapped ${before} and ${after}.`:`Suspect ${before} renamed to ${after}.`,"good");
    return true;
  }
  function buildSuspects(){
    el.suspectList.innerHTML="";
    sortSuspects(config.suspects).forEach(s=>{
      const b=document.createElement("button");
      b.type="button"; b.className="suspect suspect-entry"; b.dataset.id=s.id;
      b.style.setProperty("--suspect-color",s.color);
      b.style.setProperty("--suspect-dark",darken(s.color,.18));
      b.innerHTML=`<span class="avatar">${escapeHtml(s.id)}</span><span class="suspect-gender-mark" aria-hidden="true"></span><svg class="suspect-ribbon-mark" viewBox="0 0 34 34" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="ribbon-single" d="M 10 0 H 20 L 34 14 V 24 Z"/><path class="ribbon-double" d="M 2 0 H 9 L 34 25 V 32 Z M 15 0 H 22 L 34 12 V 19 Z"/><path class="ribbon-thick" d="M 7 0 H 25 L 34 9 V 27 Z"/></svg>`;
      updateSuspectTile(b,s.id);
      let pressTimer=null, pressStart=null, suppressNextClick=false;
      function clearPress(){if(pressTimer!==null){clearTimeout(pressTimer);pressTimer=null;}pressStart=null;}
      b.addEventListener("pointerdown",event=>{
        if(event.button===2){
          event.preventDefault();
          clearPress();
          cycleSuspectRibbon(s.id);
          return;
        }
        // Modifier clicks are immediate actions, not long-press rename gestures.
        if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey)return;
        clearPress();
        pressStart={x:event.clientX,y:event.clientY};
        pressTimer=setTimeout(()=>{
          pressTimer=null;
          suppressNextClick=true;
          openRenameDialog(s.id);
        },LONG_PRESS_MS);
      });
      b.addEventListener("pointermove",event=>{
        if(pressStart && Math.hypot(event.clientX-pressStart.x,event.clientY-pressStart.y)>DRAG_THRESHOLD)clearPress();
      });
      b.addEventListener("pointerup",clearPress);
      b.addEventListener("pointercancel",clearPress);
      b.addEventListener("pointerleave",clearPress);
      b.addEventListener("click",event=>{
        if(suppressNextClick){suppressNextClick=false;event.preventDefault();return;}
        if(event.ctrlKey||event.metaKey){event.preventDefault();cycleSuspectRibbonColor(s.id);return;}
        if(event.shiftKey){event.preventDefault();cycleSuspectGender(s.id);return;}
        eraseMode=false;progress.selected=s.id;persistProgress();render();setStatus(`Selected: ${s.id}`);
      });
      b.addEventListener("contextmenu",event=>event.preventDefault());
      el.suspectList.appendChild(b);
    });
    buildNoteSymbols();
  }
  function buildNoteSymbols(){
    if(!el.noteSymbols)return;
    el.noteSymbols.innerHTML="";
    NOTE_SYMBOLS.forEach(s=>{
      const b=document.createElement("button");
      b.type="button"; b.className=`note-symbol-button${s.id==="@circle"?" circle-symbol-button":""}`; b.dataset.id=s.id; b.title=s.label;
      b.style.setProperty("--note-color",s.color);
      b.innerHTML=`<span class="note-glyph">${s.glyph}</span>`;
      b.addEventListener("click",()=>{eraseMode=false;progress.selected=s.id;persistProgress();render();setStatus(`Note symbol: ${s.label}`)});
      el.noteSymbols.appendChild(b);
    });
  }
  function placementAt(r,c){return Object.entries(progress.placements).find(([,p])=>p[0]===r&&p[1]===c)||null}
  function rowColTaken(r,c,ignore=null){return Object.entries(progress.placements).some(([id,p])=>id!==ignore&&(p[0]===r||p[1]===c))}
  function autoExcluded(r,c){if(placementAt(r,c))return false;return Object.values(progress.placements).some(p=>p[0]===r||p[1]===c)}
  function note(id,r,c){return progress.notes[id]?.[cellKey(r,c)]}
  function globalExcludedSet(){return new Set((progress.excludedCells||[]).map(([r,c])=>cellKey(r,c)))}
  function isGloballyExcluded(r,c){return globalExcludedSet().has(cellKey(r,c))}
  function canCandidateMark(r,c){const k=cellKey(r,c);if(blockedSet().has(k)||isGloballyExcluded(r,c))return false;if(placementAt(r,c)||autoExcluded(r,c))return false;return true}
  function canGlobalExclude(r,c){const k=cellKey(r,c);if(blockedSet().has(k))return false;if(placementAt(r,c)||autoExcluded(r,c))return false;return true}
  function setNote(id,r,c,type,action){if(type!=="candidate"||!id||!canCandidateMark(r,c))return false;const key=cellKey(r,c),cur=note(id,r,c);if(action==="add"&&cur===type)return false;if(action==="remove"&&cur!==type)return false;progress.notes[id]??={};if(action==="add")progress.notes[id][key]=type;else delete progress.notes[id][key];if(!Object.keys(progress.notes[id]).length)delete progress.notes[id];return true}
  function clearCandidatesAt(r,c){
    const key=cellKey(r,c);
    Object.keys(progress.notes||{}).forEach(id=>{
      if(progress.notes[id]?.[key]==="candidate"){
        delete progress.notes[id][key];
        if(!Object.keys(progress.notes[id]).length)delete progress.notes[id];
      }
    });
  }
  function clearCellMarks(r,c){
    const key=cellKey(r,c);
    if(blockedSet().has(key))return false;
    let changed=false;

    Object.keys(progress.notes||{}).forEach(id=>{
      if(progress.notes[id]?.[key]!==undefined){
        delete progress.notes[id][key];
        if(!Object.keys(progress.notes[id]).length)delete progress.notes[id];
        changed=true;
      }
    });

    const excluded=globalExcludedSet();
    if(excluded.delete(key)){
      progress.excludedCells=[...excluded].map(k=>k.split(",").map(Number));
      changed=true;
    }

    const occ=placementAt(r,c);
    if(occ){
      delete progress.placements[occ[0]];
      changed=true;
    }

    return changed;
  }
  function setGlobalExcluded(r,c,action){
    if(!canGlobalExclude(r,c))return false;
    const key=cellKey(r,c),set=globalExcludedSet();
    if(action==="add"){
      if(set.has(key))return false;
      clearCandidatesAt(r,c);
      set.add(key);
    }else{
      if(!set.has(key))return false;
      set.delete(key);
    }
    progress.excludedCells=[...set].map(k=>k.split(",").map(Number));
    return true;
  }
  function candidateMap(){
    const m=new Map();
    const all=[...config.suspects,...NOTE_SYMBOLS];
    all.forEach(s=>{
      if(progress.placements[s.id])return;
      Object.entries(progress.notes[s.id]||{}).forEach(([k,t])=>{
        if(t!=="candidate")return; if(!m.has(k))m.set(k,[]); m.get(k).push(s.id);
      });
    });
    return m;
  }
  function density(n){const side=Math.max(2,Math.ceil(Math.sqrt(n)));return Math.min(8,side)}
  function renderGrid(){
    const selected=progress.selected,cand=candidateMap(),blocked=blockedSet(),globalX=globalExcludedSet();
    [...el.grid.children].forEach(cell=>{
      const r=+cell.dataset.row,c=+cell.dataset.col,k=cellKey(r,c),occ=placementAt(r,c),auto=autoExcluded(r,c),manualX=globalX.has(k);
      cell.className="cell"; cell.innerHTML="";

      if(blocked.has(k)){cell.classList.add("blocked");cell.title="Blocked cell";return}
      if(auto){const x=document.createElement("span");x.className="x-mark auto-x";x.textContent="×";cell.appendChild(x)}
      if(!auto&&!occ&&manualX){const x=document.createElement("span");x.className="x-mark manual-x";x.textContent="×";x.title="Excluded position";cell.appendChild(x)}
      if(!auto&&!occ&&!manualX){
        const ids=cand.get(k)||[];
        if(ids.length){
          const side=density(ids.length),stack=document.createElement("span");
          stack.className="candidate-stack";stack.style.setProperty("--stack-cols",side);stack.style.setProperty("--stack-rows",side);stack.style.setProperty("--token-size",`var(--token-${side})`);stack.style.setProperty("--token-font",`var(--font-${side})`);
          ids.forEach((id,slot)=>{const item=selectableById(id),noteSym=isNoteSymbol(id),t=document.createElement("span");t.className=`candidate-token${id===selected?" selected":""}${noteSym?" note-symbol-token":""}${id==="@circle"?" circle-symbol-token":""}${!noteSym&&String(id).length>1?" multi-char":""}`;t.textContent=noteSym?item.glyph:id;t.style.gridColumn=String((slot%side)+1);t.style.gridRow=String(Math.floor(slot/side)+1);const color=item?.color||"#3568a8";if(noteSym)t.style.setProperty("--token-text",color);else t.style.setProperty("--candidate-color",color);stack.appendChild(t)});
          cell.appendChild(stack);
        }
      }
      if(occ){const item=selectableById(occ[0]),noteSym=isNoteSymbol(occ[0]),color=item?.color||"#3568a8",m=document.createElement("span");cell.classList.add("occupied-cell");if(noteSym)cell.classList.add("occupied-note-symbol");cell.style.setProperty("--occupied-color",color);m.className=`marker${occ[0]===selected?" selected":""}${noteSym?" note-symbol-placement":""}${occ[0]==="@circle"?" circle-symbol-placement":""}`;m.textContent=noteSym?item.glyph:occ[0];m.style.setProperty("--marker-bg",noteSym?"#292733":darken(color,.18));m.style.setProperty("--marker-fg",noteSym?color:"#fff");cell.appendChild(m)}else{cell.style.removeProperty("--occupied-color")}
    });
  }
  function renderSuspects(){
    el.suspectList.querySelectorAll(".suspect").forEach(b=>updateSuspectTile(b,b.dataset.id));
    if(el.noteSymbols)[...el.noteSymbols.children].forEach(b=>{const id=b.dataset.id;b.classList.toggle("active",id===progress.selected);b.classList.toggle("placed",!!progress.placements[id]);const p=progress.placements[id];b.title=`${noteSymbolById(id)?.label||id}${p?` · R${p[0]} C${p[1]}`:""}`});
    const suspectPlaced=config.suspects.filter(s=>progress.placements[s.id]).length;
    el.placedCount.textContent=`${suspectPlaced}/${config.suspects.length}`;
  }
  function countAvailablePositions(){
    const blocked=blockedSet();
    const manualX=globalExcludedSet();
    const occupied=new Set();
    const occupiedRows=new Set(), occupiedCols=new Set();
    Object.values(progress.placements||{}).forEach(([r,c])=>{
      occupied.add(cellKey(r,c));
      occupiedRows.add(r);
      occupiedCols.add(c);
    });
    let available=0;
    for(let r=1;r<=config.rows;r++){
      for(let c=1;c<=config.cols;c++){
        const key=cellKey(r,c);
        if(blocked.has(key) || manualX.has(key) || occupied.has(key))continue;
        // These cells show the automatic X marks from placed suspects/symbols.
        if(occupiedRows.has(r) || occupiedCols.has(c))continue;
        available++;
      }
    }
    return available;
  }
  function render(){
    el.title.textContent=config.title;
    el.version.textContent=`v${VERSION}`;
    const selectedItem = selectableById(progress.selected);
    const hoverColor = eraseMode ? "#6f777c" : (selectedItem?.color || "#4b79a8");
    el.grid.style.setProperty("--hover-fill", rgbaFromHex(hoverColor,eraseMode?.18:.20));
    el.grid.style.setProperty("--hover-fill-press", rgbaFromHex(hoverColor,eraseMode?.25:.27));
    el.grid.classList.toggle("has-selection", Boolean(selectedItem));
    el.grid.classList.toggle("erase-mode", eraseMode);
    if(el.eraser){
      el.eraser.classList.toggle("active",eraseMode);
      el.eraser.setAttribute("aria-pressed",eraseMode?"true":"false");
    }
    renderSuspects();
    renderGrid();
    if(el.availableCells)el.availableCells.textContent=String(countAvailablePositions());
    if(el.availableTotal)el.availableTotal.textContent=` / ${config.rows*config.cols}`;
    el.boardWrap.classList.toggle("show-coords",progress.coords);
    el.undo.disabled=!undoStack.length;
    el.redo.disabled=!redoStack.length;
    requestAnimationFrame(fitBoard)
  }
  function loadPlay(){el.annotationScale.value=Math.round((config.annotationScale||1)*100);el.annotationScaleValue.value=`${el.annotationScale.value}%`;setImageElement(el.boardImage,el.boardWrap,el.boardPlaceholder);applyGridGeometry();buildGrid();buildSuspects();render();}

  function placeSelected(r,c){
    const id=progress.selected;
    if(!id)return false;
    const item=selectableById(id);
    if(!item)return false;
    const k=cellKey(r,c);
    if(blockedSet().has(k)){setStatus("This cell is blocked.","error");return false}
    if(isGloballyExcluded(r,c)){setStatus("This cell is marked with X.","error");return false}

    const exact=placementAt(r,c);
    const replacedId=exact&&exact[0]!==id?exact[0]:null;

    // Replacing an existing placement is allowed. Ignore both the active marker
    // and the marker being replaced while checking row/column conflicts.
    const rowColConflict=Object.entries(progress.placements).some(([pid,p])=>
      pid!==id&&pid!==replacedId&&(p[0]===r||p[1]===c)
    );
    if(rowColConflict){setStatus("Another placement already exists in this row or column.","error");return false}

    checkpoint();
    const old=progress.placements[id];
    const label=item.label||id;

    if(old&&old[0]===r&&old[1]===c){
      delete progress.placements[id];
      setStatus(`Placement removed: ${label}.`);
    }else{
      let replacedLabel="";
      if(replacedId){
        const replacedItem=selectableById(replacedId);
        replacedLabel=replacedItem?.label||replacedId;
        delete progress.placements[replacedId];
      }
      progress.placements[id]=[r,c];
      if(progress.notes[id]){
        delete progress.notes[id][k];
        if(!Object.keys(progress.notes[id]).length)delete progress.notes[id];
      }
      setStatus(replacedId
        ? `${label} → R${r} C${c}. Replaced: ${replacedLabel}.`
        : `${label} → R${r} C${c}. Row and column excluded.`
      ,"good");
    }
    persistProgress();
    render();
    return true;
  }
  function clearSelected(){if(!progress.selected)return;const id=progress.selected;if(!Object.keys(progress.notes[id]||{}).length&&!progress.placements[id])return;checkpoint();delete progress.notes[id];delete progress.placements[id];persistProgress();render();const item=selectableById(id);setStatus(`Cleared: ${item?.label||id}.`)}
  function undo(){if(!undoStack.length)return;redoStack.push(boardSnapshot());restoreBoardSnapshot(undoStack.pop());persistProgress();render()}
  function redo(){if(!redoStack.length)return;undoStack.push(boardSnapshot());restoreBoardSnapshot(redoStack.pop());persistProgress();render()}
  function resetProgress(){if(!confirm("Delete all progress?"))return;progress=blankProgress();undoStack=[];redoStack=[];persistProgress();render();setStatus("Progress reset.")}
  function checkPlacement(){
    const ids=config.suspects.map(s=>s.id),placed=ids.filter(id=>progress.placements[id]);
    if(placed.length!==ids.length){setStatus(`${placed.length}/${ids.length} suspects have been placed.`,"error");return}
    const seenR=new Set(),seenC=new Set(),blocked=blockedSet();
    for(const id of ids){
      const p=progress.placements[id];
      if(!p||seenR.has(p[0])||seenC.has(p[1])||blocked.has(cellKey(...p))){
        setStatus("There is a row/column conflict or a placement on a blocked cell.","error");
        return;
      }
      seenR.add(p[0]);seenC.add(p[1]);
    }
    setStatus("The placement is valid.","good");
  }
  function exportJson(obj,name){const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
  async function importProgress(file){
    try{
      const d=JSON.parse(await file.text());

      // v0.3.20 combined save file: puzzle + progress.
      if(d && d.puzzle){
        const newConfig=normalizeConfig(d.puzzle);
        const newProgress=sanitizeProgress(migrateLegacyProgress(d.puzzle,d.progress||{},newConfig),newConfig);

        config=newConfig;
        progress=newProgress;
        undoStack=[];
        redoStack=[];
        persistConfig();
        persistProgress();
        loadPlay();
        setStatus("Puzzle and progress imported.","good");
        return;
      }

      // Backward compatibility with older progress-only exports.
      const p=d.progress||d.state||d;
      checkpoint();
      progress=sanitizeProgress(p,config);
      persistProgress();
      render();
      setStatus("Progress imported.","good");
    }catch(e){
      setStatus(`Import failed: ${e.message}`,"error");
    }
  }

  function gridCellFromTarget(target,root){const c=target?.closest?.(".cell");return c&&root.contains(c)?c:null}
  function gridCellFromPoint(x,y){return gridCellFromTarget(document.elementFromPoint(x,y),el.grid)}
  function rc(cell){return [+cell.dataset.row,+cell.dataset.col]}
  function startGesture(ev){
    if(gesture)return;
    const cell=gridCellFromTarget(ev.target,el.grid);if(!cell)return;
    if(ev.pointerType==="mouse"&&![0,2].includes(ev.button))return;
    const [r,c]=rc(cell),k=cellKey(r,c);
    if(blockedSet().has(k))return;

    // Right click/drag: global X, completely independent of selected suspect/note symbol.
    if(ev.button===2){
      ev.preventDefault();
      const hasX=globalExcludedSet().has(k);
      gesture={id:ev.pointerId,button:2,kind:"global-x",action:hasX?"remove":"add",visited:new Set(),checkpointed:false,dragging:true};
      applyGestureCell(cell);return;
    }

    // Eraser mode: left click/drag clears every direct mark from each visited cell.
    // Right click/drag above keeps the normal global-X behavior.
    if(eraseMode){
      ev.preventDefault();
      gesture={id:ev.pointerId,button:0,kind:"eraser",visited:new Set(),checkpointed:false,dragging:true,long:false,timer:null};
      applyGestureCell(cell);
      return;
    }

    // Normal left actions still need an active suspect/note symbol.
    if(!progress.selected)return;
    ev.preventDefault();
    gesture={id:ev.pointerId,button:0,kind:"candidate",startR:r,startC:c,startX:ev.clientX,startY:ev.clientY,startHad:note(progress.selected,r,c)==="candidate",visited:new Set(),checkpointed:false,dragging:false,long:false,timer:null};
    cell.classList.add("pressing");
    gesture.timer=setTimeout(()=>{if(!gesture||gesture.id!==ev.pointerId||gesture.dragging)return;gesture.long=true;cell.classList.remove("pressing");placeSelected(r,c)},LONG_PRESS_MS);
  }
  function ensureGestureCheckpoint(){if(!gesture.checkpointed){checkpoint();gesture.checkpointed=true}}
  function applyGestureCell(cell){
    if(!gesture||!cell)return;
    const [r,c]=rc(cell),k=cellKey(r,c);if(gesture.visited.has(k))return;gesture.visited.add(k);
    if(gesture.kind==="global-x"){
      if(!canGlobalExclude(r,c))return;
      const exists=globalExcludedSet().has(k);
      if((gesture.action==="add"&&exists)||(gesture.action==="remove"&&!exists))return;
      ensureGestureCheckpoint();if(setGlobalExcluded(r,c,gesture.action))renderGrid();return;
    }
    if(gesture.kind==="eraser"){
      if(blockedSet().has(k))return;
      const hasCandidate=Object.values(progress.notes||{}).some(notes=>notes?.[k]!==undefined);
      const hasManualX=globalExcludedSet().has(k);
      const hasPlacement=Boolean(placementAt(r,c));
      if(!hasCandidate&&!hasManualX&&!hasPlacement)return;
      ensureGestureCheckpoint();
      if(clearCellMarks(r,c))renderGrid();
      return;
    }
    if(!progress.selected||!canCandidateMark(r,c))return;
    const cur=note(progress.selected,r,c);
    if((gesture.action==="add"&&cur==="candidate")||(gesture.action==="remove"&&cur!=="candidate"))return;
    ensureGestureCheckpoint();if(setNote(progress.selected,r,c,"candidate",gesture.action))renderGrid();
  }
  function moveGesture(ev){if(!gesture||ev.pointerId!==gesture.id)return;const cell=gridCellFromPoint(ev.clientX,ev.clientY);if(gesture.button===2||gesture.kind==="eraser"){ev.preventDefault();if(cell)applyGestureCell(cell);return}if(gesture.long)return;const dist=Math.hypot(ev.clientX-gesture.startX,ev.clientY-gesture.startY),moved=cell&&((+cell.dataset.row)!==gesture.startR||(+cell.dataset.col)!==gesture.startC);if(!gesture.dragging&&(dist>=DRAG_THRESHOLD||moved)){gesture.dragging=true;gesture.action=gesture.startHad?"remove":"add";clearTimeout(gesture.timer);$$('.cell.pressing').forEach(x=>x.classList.remove('pressing'));const start=el.grid.querySelector(`[data-row="${gesture.startR}"][data-col="${gesture.startC}"]`);applyGestureCell(start)}if(gesture.dragging&&cell){ev.preventDefault();applyGestureCell(cell)}}
  function endGesture(ev){if(!gesture||ev.pointerId!==gesture.id)return;const g=gesture;gesture=null;clearTimeout(g.timer);$$('.cell.pressing').forEach(x=>x.classList.remove('pressing'));if(g.button===0&&!g.long&&!g.dragging){const action=g.startHad?"remove":"add";if(progress.selected&&canCandidateMark(g.startR,g.startC)){checkpoint();setNote(progress.selected,g.startR,g.startC,"candidate",action);persistProgress();render()}}else if(g.checkpointed){persistProgress();render()}}

  function initResizable(){const prefs=safeParse(storageGet(LAYOUT_KEY),{}) || {};if(prefs.sidebar)document.documentElement.style.setProperty("--sidebar-width",`${prefs.sidebar}px`);if(prefs.topbar)document.documentElement.style.setProperty("--topbar-height",`${prefs.topbar}px`);function begin(kind,ev){if(innerWidth<700||ev.button!==0)return;ev.preventDefault();const sx=ev.clientX,sy=ev.clientY,sw=el.sidebar.getBoundingClientRect().width,sh=el.topbar.getBoundingClientRect().height;function move(e){if(kind==="sidebar"){const w=Math.max(220,Math.min(innerWidth*.68,sw+e.clientX-sx));document.documentElement.style.setProperty("--sidebar-width",`${w}px`);prefs.sidebar=Math.round(w)}else{const h=Math.max(32,Math.min(innerHeight*.28,sh+e.clientY-sy));document.documentElement.style.setProperty("--topbar-height",`${h}px`);prefs.topbar=Math.round(h)}storageSet(LAYOUT_KEY,JSON.stringify({...safeParse(storageGet(LAYOUT_KEY),{}),[kind==="sidebar"?"sidebar":"topbar"]:kind==="sidebar"?prefs.sidebar:prefs.topbar}));requestAnimationFrame(fitBoard)}function end(){removeEventListener("pointermove",move);removeEventListener("pointerup",end)}addEventListener("pointermove",move);addEventListener("pointerup",end)}el.sidebarResizer.addEventListener("pointerdown",e=>begin("sidebar",e));el.topbarResizer.addEventListener("pointerdown",e=>begin("topbar",e))}

  function initSetupResizable(){
    const prefs=safeParse(storageGet(LAYOUT_KEY),{}) || {};
    const applyWidth=(width)=>{
      const max=Math.max(270,Math.min(760,innerWidth-300));
      const value=Math.max(270,Math.min(max,width));
      document.documentElement.style.setProperty("--editor-panel-width",`${value}px`);
      return value;
    };
    applyWidth(Number(prefs.editorPanel)||390);
    const handle=el.setupFormResizer;
    let drag=null;
    handle.addEventListener("pointerdown",ev=>{
      if(ev.button!==0||innerWidth<=700)return;
      ev.preventDefault();
      drag={id:ev.pointerId,startX:ev.clientX,startWidth:el.setupScreen.querySelector(".setup-form").getBoundingClientRect().width};
      handle.setPointerCapture(ev.pointerId);
      document.body.classList.add("resizing-editor-panel");
    });
    handle.addEventListener("pointermove",ev=>{
      if(!drag||ev.pointerId!==drag.id)return;
      const width=applyWidth(drag.startWidth+ev.clientX-drag.startX);
      prefs.editorPanel=Math.round(width);
      requestAnimationFrame(fitSetupPreview);
    });
    const finish=ev=>{
      if(!drag||ev.pointerId!==drag.id)return;
      drag=null;
      document.body.classList.remove("resizing-editor-panel");
      if(handle.hasPointerCapture(ev.pointerId))handle.releasePointerCapture(ev.pointerId);
      storageSet(LAYOUT_KEY,JSON.stringify({...safeParse(storageGet(LAYOUT_KEY),{}),editorPanel:prefs.editorPanel}));
      requestAnimationFrame(fitSetupPreview);
    };
    handle.addEventListener("pointerup",finish);
    handle.addEventListener("pointercancel",finish);
    handle.addEventListener("keydown",ev=>{
      if(ev.key!=="ArrowLeft"&&ev.key!=="ArrowRight")return;
      ev.preventDefault();
      const width=applyWidth((Number(prefs.editorPanel)||390)+(ev.key==="ArrowRight"?20:-20));
      prefs.editorPanel=Math.round(width);
      storageSet(LAYOUT_KEY,JSON.stringify({...safeParse(storageGet(LAYOUT_KEY),{}),editorPanel:prefs.editorPanel}));
      requestAnimationFrame(fitSetupPreview);
    });
    addEventListener("resize",()=>{
      if(innerWidth>700)applyWidth(Number(prefs.editorPanel)||390);
      if(!el.setupScreen.classList.contains("hidden"))requestAnimationFrame(fitSetupPreview);
    });
  }

  function cornersFromInset(inset){
    const i=inset||{left:0,top:0,right:0,bottom:0};
    return {
      tl:{x:clampNum(i.left,0,100,0),y:clampNum(i.top,0,100,0)},
      tr:{x:clampNum(100-i.right,0,100,100),y:clampNum(i.top,0,100,0)},
      br:{x:clampNum(100-i.right,0,100,100),y:clampNum(100-i.bottom,0,100,100)},
      bl:{x:clampNum(i.left,0,100,0),y:clampNum(100-i.bottom,0,100,100)}
    };
  }
  function resetPerspectiveCorners(){
    if(!draft)return;
    perspectiveCorners=cornersFromInset(draft.gridInset);
    renderPerspectiveOverlay();
    if(el.perspectiveStatus){el.perspectiveStatus.textContent="";el.perspectiveStatus.classList.remove("error")}
  }
  function renderPerspectiveOverlay(){
    if(!perspectiveCorners||!el.perspectivePolygon||!el.perspectiveHandles)return;
    const order=["tl","tr","br","bl"];
    el.perspectivePolygon.setAttribute("points",order.map(k=>`${perspectiveCorners[k].x.toFixed(3)},${perspectiveCorners[k].y.toFixed(3)}`).join(" "));
    order.forEach(k=>{
      const h=el.perspectiveHandles.querySelector(`[data-corner="${k}"]`);if(!h)return;
      h.style.left=`${perspectiveCorners[k].x}%`;h.style.top=`${perspectiveCorners[k].y}%`;
    });
  }
  function quadIsValid(c=perspectiveCorners){
    if(!c)return false;
    const p=[c.tl,c.tr,c.br,c.bl];
    const cross=(a,b,d)=>(b.x-a.x)*(d.y-b.y)-(b.y-a.y)*(d.x-b.x);
    const signs=[];
    for(let i=0;i<4;i++){const z=cross(p[i],p[(i+1)%4],p[(i+2)%4]);if(Math.abs(z)<0.02)return false;signs.push(Math.sign(z))}
    if(!signs.every(v=>v===signs[0]))return false;
    let area=0;for(let i=0;i<4;i++){const a=p[i],b=p[(i+1)%4];area+=a.x*b.y-b.x*a.y}
    return Math.abs(area)/2>4;
  }
  function startPerspectiveDrag(corner,ev){
    if(setupMode!=="perspective"||!perspectiveCorners||perspectiveBusy)return;
    ev.preventDefault();
    const rect=el.previewWrap.getBoundingClientRect();
    perspectiveDrag={corner,id:ev.pointerId,rect};
    addEventListener("pointermove",movePerspectiveDrag,{passive:false});
    addEventListener("pointerup",endPerspectiveDrag,{once:true});
    addEventListener("pointercancel",endPerspectiveDrag,{once:true});
  }
  function movePerspectiveDrag(ev){
    if(!perspectiveDrag||ev.pointerId!==perspectiveDrag.id)return;
    ev.preventDefault();
    const {rect,corner}=perspectiveDrag;
    perspectiveCorners[corner]={
      x:clampNum((ev.clientX-rect.left)/rect.width*100,0,100,perspectiveCorners[corner].x),
      y:clampNum((ev.clientY-rect.top)/rect.height*100,0,100,perspectiveCorners[corner].y)
    };
    renderPerspectiveOverlay();
    if(el.perspectiveStatus){
      const ok=quadIsValid();
      el.perspectiveStatus.textContent=ok?"The four corners form a valid area.":"The corners must not cross.";
      el.perspectiveStatus.classList.toggle("error",!ok);
    }
  }
  function endPerspectiveDrag(ev){
    if(perspectiveDrag&&ev?.pointerId!==undefined&&ev.pointerId!==perspectiveDrag.id)return;
    perspectiveDrag=null;removeEventListener("pointermove",movePerspectiveDrag);
  }
  function loadProcessImage(src,type){
    return new Promise((resolve,reject)=>{
      const img=new Image();
      if(type==="url")img.crossOrigin="anonymous";
      img.onload=()=>resolve(img);
      img.onerror=()=>reject(new Error(type==="url"?"The remote image does not allow CORS processing. Download it and choose it as a local image.":"The image could not be loaded."));
      img.src=src;
    });
  }
  function squareToQuadMatrix(c){
    const p0={x:c.tl.x/100,y:c.tl.y/100},p1={x:c.tr.x/100,y:c.tr.y/100},p2={x:c.br.x/100,y:c.br.y/100},p3={x:c.bl.x/100,y:c.bl.y/100};
    const dx1=p1.x-p2.x,dx2=p3.x-p2.x,dx3=p0.x-p1.x+p2.x-p3.x;
    const dy1=p1.y-p2.y,dy2=p3.y-p2.y,dy3=p0.y-p1.y+p2.y-p3.y;
    let g=0,h=0;
    if(Math.abs(dx3)>1e-10||Math.abs(dy3)>1e-10){
      const det=dx1*dy2-dx2*dy1;if(Math.abs(det)<1e-10)throw new Error("The selected corners do not form a valid perspective.");
      g=(dx3*dy2-dx2*dy3)/det;h=(dx1*dy3-dx3*dy1)/det;
    }
    const a=p1.x-p0.x+g*p1.x,b=p3.x-p0.x+h*p3.x,cc=p0.x;
    const d=p1.y-p0.y+g*p1.y,e=p3.y-p0.y+h*p3.y,f=p0.y;
    return new Float32Array([a,d,g,b,e,h,cc,f,1]);
  }
  function rectifiedDimensions(img,c){
    const px=p=>({x:p.x/100*img.naturalWidth,y:p.y/100*img.naturalHeight});
    const tl=px(c.tl),tr=px(c.tr),br=px(c.br),bl=px(c.bl),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
    const w=(dist(tl,tr)+dist(bl,br))/2,h=(dist(tl,bl)+dist(tr,br))/2;
    const aspect=Math.max(.05,Math.min(20,draft.cols/draft.rows));
    const area=Math.max(4096,w*h);
    let outW=Math.sqrt(area*aspect),outH=outW/aspect;
    const maxDim=2400,scale=Math.min(1,maxDim/Math.max(outW,outH));outW*=scale;outH*=scale;
    return {width:Math.max(64,Math.round(outW)),height:Math.max(64,Math.round(outH))};
  }
  function compileShader(gl,type,source){
    const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);
    if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){const msg=gl.getShaderInfoLog(sh)||"Shader error";gl.deleteShader(sh);throw new Error(msg)}return sh;
  }
  function rectifyImageWebGL(img,corners){
    const dims=rectifiedDimensions(img,corners),canvas=document.createElement("canvas");canvas.width=dims.width;canvas.height=dims.height;
    const gl=canvas.getContext("webgl",{preserveDrawingBuffer:true,alpha:false,antialias:true});if(!gl)throw new Error("This browser does not support WebGL perspective correction.");
    const vs=compileShader(gl,gl.VERTEX_SHADER,`attribute vec2 a_pos;attribute vec2 a_uv;varying vec2 v_uv;void main(){v_uv=a_uv;gl_Position=vec4(a_pos,0.0,1.0);}`);
    const fs=compileShader(gl,gl.FRAGMENT_SHADER,`precision highp float;varying vec2 v_uv;uniform sampler2D u_tex;uniform mat3 u_map;void main(){vec3 p=u_map*vec3(v_uv,1.0);vec2 uv=p.xy/p.z;if(uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0){gl_FragColor=vec4(1.0);return;}gl_FragColor=texture2D(u_tex,uv);}`);
    const prog=gl.createProgram();gl.attachShader(prog,vs);gl.attachShader(prog,fs);gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(prog)||"WebGL link error");gl.useProgram(prog);
    const data=new Float32Array([-1,-1,0,1, 1,-1,1,1, -1,1,0,0, -1,1,0,0, 1,-1,1,1, 1,1,1,0]);
    const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);const stride=16;
    const ap=gl.getAttribLocation(prog,"a_pos"),au=gl.getAttribLocation(prog,"a_uv");gl.enableVertexAttribArray(ap);gl.vertexAttribPointer(ap,2,gl.FLOAT,false,stride,0);gl.enableVertexAttribArray(au);gl.vertexAttribPointer(au,2,gl.FLOAT,false,stride,8);
    const tex=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
    gl.uniform1i(gl.getUniformLocation(prog,"u_tex"),0);gl.uniformMatrix3fv(gl.getUniformLocation(prog,"u_map"),false,squareToQuadMatrix(corners));gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,6);gl.finish();
    let url;try{url=canvas.toDataURL("image/jpeg",.94)}catch{throw new Error("The browser cannot export this image. For an image URL, use a local file instead.")}
    return {url,width:canvas.width,height:canvas.height};
  }
  async function applyPerspectiveCorrection(){
    if(perspectiveBusy)return;
    if(!imageSource(draft)){alert("Set a puzzle image first.");return}
    if(!quadIsValid()){alert("The four corners must form a valid, non-crossing area.");return}
    perspectiveBusy=true;el.applyPerspective.disabled=true;if(el.perspectiveStatus){el.perspectiveStatus.textContent="Rectifying perspective…";el.perspectiveStatus.classList.remove("error")}
    try{
      const img=await loadProcessImage(imageSource(draft),draft.image.type),result=rectifyImageWebGL(img,perspectiveCorners);
      const base=(draft.image.name||draft.title||"puzzle").replace(/\.[a-z0-9]{1,8}$/i,"");
      draft.image={type:"data",value:result.url,name:`${base}-rectified.jpg`};
      draft.gridInset={left:0,top:0,right:0,bottom:0};syncInsetInputs();setSetupImage();buildSetupGrid();perspectiveCorners=cornersFromInset(draft.gridInset);renderPerspectiveOverlay();
      if(el.perspectiveStatus)el.perspectiveStatus.textContent=`Done: ${result.width} × ${result.height}px. The new image is rectangular.`;
      setSetupMode("calibrate");
    }catch(err){if(el.perspectiveStatus){el.perspectiveStatus.textContent=err.message;el.perspectiveStatus.classList.add("error")}else alert(err.message)}
    finally{perspectiveBusy=false;el.applyPerspective.disabled=false}
  }

  function titleIsUnset(value){const t=String(value||"").trim();return !t||t==="New Puzzle"}
  function imageNameToTitle(value){
    let name=String(value||"").trim();
    if(!name)return "";
    try{if(/^https?:/i.test(name)){const u=new URL(name);name=decodeURIComponent(u.pathname.split("/").filter(Boolean).pop()||"")}}catch{}
    name=name.split(/[\/]/).pop().split(/[?#]/)[0];
    return name.replace(/\.[a-z0-9]{1,8}$/i,"").trim();
  }
  function applyImageTitle(value){if(!draft)return;const current=el.setupTitle.value;if(!titleIsUnset(current))return;const title=imageNameToTitle(value);if(!title)return;draft.title=title;el.setupTitle.value=title}
  function newPuzzle(){
    if(!confirm("Start a new puzzle? Unsaved changes in New / Edit will be lost."))return;
    draft=defaultConfig();
    draft.title="";
    draft.blockedCells=[];
    setupMode="calibrate";
    setupGesture=null;
    el.setupImageFile.value="";
    populateSetup();
  }
  function openSetup(){eraseMode=false;draft=clone(config);setupMode="calibrate";populateSetup();el.setupScreen.classList.remove("hidden");requestAnimationFrame(fitSetupPreview)}
  function closeSetup(){el.setupScreen.classList.add("hidden");draft=null;requestAnimationFrame(fitBoard)}
  function populateSetup(){
    el.setupTitle.value=draft.title;
    el.setupRows.value=draft.rows;
    el.setupCols.value=draft.cols;
    el.setupSuspectCount.value=draft.suspects.length;
    el.setupImageUrl.value=draft.image.type==="url"?draft.image.value:"";
    el.imageStorageNote.textContent=draft.image.type==="data"
      ? `Local image: ${draft.image.name||"embedded"}`
      : (draft.image.type==="url"?"Using image URL.":"No image.");
    setSetupImage();
    buildSetupGrid();
    resetPerspectiveCorners();
    setSetupMode("calibrate");
  }
  function syncDraftBasics(){
    const typedTitle=el.setupTitle.value.trim();
    const imageTitle=imageNameToTitle(draft.image?.name||draft.image?.value);
    draft.title=typedTitle||imageTitle||"New Puzzle";
    if(!typedTitle&&imageTitle)el.setupTitle.value=imageTitle;
    draft.rows=clampInt(el.setupRows.value,1,60,draft.rows);
    draft.cols=clampInt(el.setupCols.value,1,60,draft.cols);
    el.setupRows.value=draft.rows;
    el.setupCols.value=draft.cols;
    draft.blockedCells=normalizeCells(draft.blockedCells,draft.rows,draft.cols);
    buildSetupGrid();
    fitSetupPreview();
  }
  function applySuspectCount(){
    const rows=clampInt(el.setupRows.value,1,60,draft.rows);
    const cols=clampInt(el.setupCols.value,1,60,draft.cols);
    const n=clampInt(el.setupSuspectCount.value,1,52,draft.suspects.length);
    const victimId=victimLetterForCount(n);
    draft.rows=rows;
    draft.cols=cols;
    const palettePhase=nextApplyPalettePhase();
    draft.suspects=sortSuspects(makeSuspects(n,n-1,palettePhase));
    draft.victimIndex=draft.suspects.findIndex(s=>s.id===victimId);
    draft.blockedCells=normalizeCells(draft.blockedCells,rows,cols);
    el.setupRows.value=rows;
    el.setupCols.value=cols;
    el.setupSuspectCount.value=n;
    buildSetupGrid();
    fitSetupPreview();
  }
  function ensureInsetRoom(){if(draft.gridInset.left+draft.gridInset.right>90)draft.gridInset.right=90-draft.gridInset.left;if(draft.gridInset.top+draft.gridInset.bottom>90)draft.gridInset.bottom=90-draft.gridInset.top}
  function setSetupImage(){const src=imageSource(draft);el.previewWrap.classList.toggle("has-image",!!src);if(!src){el.previewImage.removeAttribute("src");el.previewPlaceholder.style.display="grid";fitSetupPreview();return}el.previewPlaceholder.style.display="none";el.previewImage.src=src}
  function fitSetupPreview(){const rect=el.previewArea.getBoundingClientRect();if(rect.width<2||rect.height<2)return;let ratio=draft.cols/draft.rows;if(imageSource(draft)&&el.previewImage.naturalWidth&&el.previewImage.naturalHeight)ratio=el.previewImage.naturalWidth/el.previewImage.naturalHeight;let w=Math.min(rect.width-16,(rect.height-16)*ratio),h=w/ratio;if(h>rect.height-16){h=rect.height-16;w=h*ratio}el.previewWrap.style.width=`${Math.max(1,Math.floor(w))}px`;el.previewWrap.style.height=`${Math.max(1,Math.floor(h))}px`;positionSetupGridBox();renderPerspectiveOverlay()}
  function positionSetupGridBox(){if(!draft)return;const i=draft.gridInset;el.setupGridBox.style.left=`${i.left}%`;el.setupGridBox.style.top=`${i.top}%`;el.setupGridBox.style.right=`${i.right}%`;el.setupGridBox.style.bottom=`${i.bottom}%`;el.previewInfo.textContent=`${draft.rows} × ${draft.cols} · ${draft.suspects.length} suspects`}
  function buildSetupGrid(){el.setupGrid.innerHTML="";el.setupGrid.style.gridTemplateColumns=`repeat(${draft.cols},1fr)`;el.setupGrid.style.gridTemplateRows=`repeat(${draft.rows},1fr)`;const blocked=new Set(draft.blockedCells.map(([r,c])=>cellKey(r,c)));for(let r=1;r<=draft.rows;r++)for(let c=1;c<=draft.cols;c++){const d=document.createElement("div");d.className="setup-cell";d.dataset.row=r;d.dataset.col=c;const k=cellKey(r,c);if(blocked.has(k))d.classList.add("blocked");el.setupGrid.appendChild(d)}positionSetupGridBox()}
  function setSetupMode(mode){
    setupMode=mode;
    const perspective=mode==="perspective";
    $$('#editorModeButtons button[data-mode]').forEach(b=>{
      const active=b.dataset.mode===mode;
      b.classList.toggle("active",active);
      b.setAttribute("aria-pressed",String(active));
    });
    el.perspectiveTools.classList.toggle("hidden",!perspective);
    el.blockedTools.classList.toggle("hidden",mode!=="blocked");
    el.perspectiveStatus.classList.toggle("hidden",!perspective);
    el.editorModeTip.textContent=perspective
      ? "Drag the four corners to the puzzle grid corners, then use Rectify image. The corrected image follows the Columns : Rows ratio."
      : mode==="calibrate"
        ? "Drag the four grid edges directly on the preview to align the grid."
        : "Left click or drag: add blocks starting from a free cell, or remove them starting from a blocked cell. Right click is disabled.";
    el.setupGridBox.classList.toggle("calibrate",mode==="calibrate");
    el.setupGridBox.classList.toggle("perspective-hidden",perspective);
    el.perspectiveOverlay.classList.toggle("hidden",!perspective);
    el.perspectiveHandles.classList.toggle("hidden",!perspective);
    el.previewModeLabel.textContent=perspective?"Perspective correction":mode==="calibrate"?"Grid calibration":"Blocked cells";
    if(perspective){if(!perspectiveCorners)resetPerspectiveCorners();renderPerspectiveOverlay()}
  }
  function setupCellFromTarget(target){const c=target?.closest?.(".setup-cell");return c&&el.setupGrid.contains(c)?c:null}
  function setupCellFromPoint(x,y){return setupCellFromTarget(document.elementFromPoint(x,y))}
  function applyBlockedCell(cell,action=setupGesture?.action||"paint"){if(!cell)return;const r=+cell.dataset.row,c=+cell.dataset.col,k=cellKey(r,c);if(setupGesture?.visited?.has(k))return;setupGesture?.visited?.add(k);const idx=draft.blockedCells.findIndex(p=>p[0]===r&&p[1]===c);if(action==="paint"&&idx<0)draft.blockedCells.push([r,c]);if(action==="erase"&&idx>=0)draft.blockedCells.splice(idx,1);buildSetupGrid()}
  function startCalibration(edge,ev){if(setupMode!=="calibrate")return;ev.preventDefault();const rect=el.previewWrap.getBoundingClientRect(),start=clone(draft.gridInset);calibrationDrag={edge,id:ev.pointerId,rect,start};addEventListener("pointermove",moveCalibration);addEventListener("pointerup",endCalibration,{once:true})}
  function moveCalibration(ev){if(!calibrationDrag||ev.pointerId!==calibrationDrag.id)return;const {edge,rect,start}=calibrationDrag,x=(ev.clientX-rect.left)/rect.width*100,y=(ev.clientY-rect.top)/rect.height*100;if(edge==="left")draft.gridInset.left=clampNum(x,0,90-start.right,start.left);if(edge==="right")draft.gridInset.right=clampNum(100-x,0,90-start.left,start.right);if(edge==="top")draft.gridInset.top=clampNum(y,0,90-start.bottom,start.top);if(edge==="bottom")draft.gridInset.bottom=clampNum(100-y,0,90-start.top,start.bottom);positionSetupGridBox()}
  function endCalibration(){calibrationDrag=null;removeEventListener("pointermove",moveCalibration)}
  function structuralSignature(cfg){return JSON.stringify({rows:cfg.rows,cols:cfg.cols,ids:cfg.suspects.map(s=>s.id),victimIndex:cfg.victimIndex})}
  function saveSetup(){syncDraftBasics();const oldSig=structuralSignature(config),newCfg=normalizeConfig(draft),newSig=structuralSignature(newCfg);config=newCfg;const saved=persistConfig();if(oldSig!==newSig){progress=blankProgress(config);undoStack=[];redoStack=[]}else progress=sanitizeProgress(progress,config);persistProgress();closeSetup();loadPlay();setStatus(saved?"Puzzle saved.":"The puzzle is running, but the image/settings were too large for localStorage. Export the puzzle JSON.",saved?"good":"error")}

  function wireSetup(){
    el.setupBtn.addEventListener("click",openSetup);
    el.setupHelp.addEventListener("click",()=>el.setupHelpDialog.showModal());
    el.newPuzzle.addEventListener("click",newPuzzle);
    el.cancelSetup.addEventListener("click",closeSetup);
    el.saveSetup.addEventListener("click",saveSetup);
    [el.setupTitle,el.setupRows,el.setupCols].forEach(x=>x.addEventListener("change",syncDraftBasics));
    el.applySuspectCount.addEventListener("click",applySuspectCount);

    $$(".preset-size-buttons [data-preset-size]").forEach(btn=>btn.addEventListener("click",()=>{
      const n=clampInt(btn.dataset.presetSize,1,60,6);
      el.setupRows.value=n;
      el.setupCols.value=n;
      el.setupSuspectCount.value=n;
    }));

    el.setupImageUrl.addEventListener("change",()=>{
      const v=el.setupImageUrl.value.trim();
      draft.image=v?{type:"url",value:v,name:imageNameToTitle(v)}:{type:"none",value:"",name:""};
      if(v)applyImageTitle(v);
      setSetupImage();resetPerspectiveCorners();
    });
    el.setupImageFile.addEventListener("change",e=>{
      const f=e.target.files[0];if(!f)return;
      const rd=new FileReader();
      rd.onload=()=>{
        draft.image={type:"data",value:rd.result,name:f.name};
        el.setupImageUrl.value="";
        el.imageStorageNote.textContent=`Local image: ${f.name}`;
        applyImageTitle(f.name);
        setSetupImage();resetPerspectiveCorners();
      };
      rd.readAsDataURL(f);
    });
    el.clearImage.addEventListener("click",()=>{draft.image={type:"none",value:"",name:""};el.setupImageUrl.value="";el.imageStorageNote.textContent="No image.";setSetupImage();resetPerspectiveCorners()});

    el.editorModes.addEventListener("click",e=>{const b=e.target.closest("button[data-mode]");if(b)setSetupMode(b.dataset.mode)});
    el.resetPerspective.addEventListener("click",resetPerspectiveCorners);
    el.applyPerspective.addEventListener("click",applyPerspectiveCorrection);
    $$('.perspective-handle').forEach(h=>h.addEventListener("pointerdown",e=>startPerspectiveDrag(h.dataset.corner,e)));
    el.clearBlocked.addEventListener("click",()=>{if(confirm("Clear all blocked cells?")){draft.blockedCells=[];buildSetupGrid()}});
    el.previewImage.addEventListener("load",fitSetupPreview);
    addEventListener("resize",()=>{if(!el.setupScreen.classList.contains("hidden"))fitSetupPreview()});
    $$('.cal-handle').forEach(h=>h.addEventListener("pointerdown",e=>startCalibration(h.dataset.edge,e)));

    el.setupGrid.addEventListener("contextmenu",e=>{if(setupMode==="blocked")e.preventDefault()});
    el.setupGrid.addEventListener("pointerdown",e=>{
      if(setupMode!=="blocked")return;
      const cell=setupCellFromTarget(e.target);if(!cell)return;
      // Only the primary (left) button edits blocked cells.
      if(e.button!==0)return;
      e.preventDefault();
      const r=+cell.dataset.row,c=+cell.dataset.col;
      const alreadyBlocked=draft.blockedCells.some(p=>p[0]===r&&p[1]===c);
      // Choose one brush for the entire drag based on its FIRST cell:
      // blocked -> erase; available -> paint. Never toggle each cell.
      setupGesture={id:e.pointerId,action:alreadyBlocked?"erase":"paint",visited:new Set()};
      applyBlockedCell(cell,setupGesture.action);
    });
    addEventListener("pointermove",e=>{if(!setupGesture||setupMode!=="blocked"||e.pointerId!==setupGesture.id)return;const cell=setupCellFromPoint(e.clientX,e.clientY);if(cell)applyBlockedCell(cell,setupGesture.action)});
    addEventListener("pointerup",e=>{if(setupGesture&&e.pointerId===setupGesture.id)setupGesture=null});
    addEventListener("pointercancel",e=>{if(setupGesture&&e.pointerId===setupGesture.id)setupGesture=null});
  }

  function slug(s){return String(s||"puzzle").toLowerCase().replace(/[^a-z0-9α-ωάέήίόύώϊϋΐΰ]+/gi,"-").replace(/^-|-$/g,"")||"puzzle"}

  function exportFilename(title){
    const now=new Date();
    const pad=n=>String(n).padStart(2,"0");
    const stamp=`${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    const safe=String(title||"Puzzle").trim().replace(/[\\/:*?"<>|\x00-\x1f]/g,"_").replace(/[. ]+$/g,"")||"Puzzle";
    return `${safe}_${stamp}.json`;
  }

  function wirePlay(){
    el.annotationScale.addEventListener("input",()=>{
      const amount=clampNum((+el.annotationScale.value||100)/100,0.7,1.5,1);
      config.annotationScale=amount;
      el.annotationScaleValue.value=`${Math.round(amount*100)}%`;
      el.boardWrap.style.setProperty("--annotation-scale",String(amount));
      persistConfig();
    });
    el.redistributeColors.addEventListener("click", redistributePlayColors);
    el.darkView.addEventListener("click", () => {
      darkViewEnabled = !darkViewEnabled;
      storageSet(VIEW_KEY, String(darkViewEnabled));
      updateDarkView();
    });
    el.undo.addEventListener("click",undo);
    el.redo.addEventListener("click",redo);
    el.clearSelected.addEventListener("click",clearSelected);
    el.eraser.addEventListener("click",()=>{eraseMode=!eraseMode;render();setStatus(eraseMode?"Eraser active: left click/drag clears cells; right click/drag marks X.":"");});
    el.reset.addEventListener("click",resetProgress);
    el.coords.addEventListener("click",()=>{progress.coords=!progress.coords;persistProgress();render()});
    el.help.addEventListener("click",()=>el.helpDialog.showModal());
    el.check.addEventListener("click",checkPlacement);
    el.exportProgress.addEventListener("click",()=>exportJson({
      format:"murdoku-save",
      version:1,
      appVersion:VERSION,
      puzzle:config,
      progress
    },exportFilename(config.title)));
    el.importProgress.addEventListener("change",e=>e.target.files[0]&&importProgress(e.target.files[0]));
    el.renameSuspectCancel.addEventListener("click",()=>el.renameSuspectDialog.close());
    el.renameSuspectForm.addEventListener("submit",event=>{
      event.preventDefault();
      if(renameSuspectId(renameSubjectId,el.renameSuspectInput.value))el.renameSuspectDialog.close();
    });
    el.grid.addEventListener("pointerdown",startGesture);
    el.grid.addEventListener("contextmenu",e=>e.preventDefault());
    addEventListener("pointermove",moveGesture,{passive:false});
    addEventListener("pointerup",endGesture);
    el.boardImage.addEventListener("load",fitBoard);
    addEventListener("resize",fitBoard);
    if(window.ResizeObserver)new ResizeObserver(fitBoard).observe(el.boardArea);

    document.addEventListener("keydown",e=>{
      // Keep the existing undo/redo keyboard shortcuts.
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){
        e.preventDefault();
        e.shiftKey?redo():undo();
        return;
      }
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="y"){
        e.preventDefault();
        redo();
        return;
      }

      // Play shortcut: A–Z selects the suspect with the matching ID.
      // Do not interfere with typing or Setup/Edit.
      if(e.ctrlKey||e.metaKey||e.altKey) return;
      if(!el.setupScreen.classList.contains("hidden")) return;
      const target=e.target;
      const tag=(target?.tagName||"").toLowerCase();
      if(tag==="input"||tag==="textarea"||tag==="select"||target?.isContentEditable) return;
      if(e.key.length!==1||!/[a-z]/i.test(e.key)) return;

      const key=e.key.toUpperCase();
      const suspect=config.suspects.find(s=>String(s.id||"").toUpperCase()===key);
      if(!suspect) return;

      eraseMode=false;
      progress.selected=suspect.id;
      persistProgress();
      render();
      setStatus(`Selected: ${suspect.id}`);
      e.preventDefault();
    });
  }

  el.version.textContent=`v${VERSION}`;
  updateDarkView();initResizable();initSetupResizable();wirePlay();wireSetup();loadPlay();
  if(!hasSavedConfig)setTimeout(openSetup,150);
})();
