"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Settings = {
  speed: number;
  distance: number;
  fov: number;
  detail: number;
  shadows: boolean;
  volumetric: boolean;
  bands: boolean;
  rings: boolean;
};

type MobileMove = { pointerId: number | null; x: number; z: number };

const WORLDS = [
  { name: "MANDELBOX", code: "01", formula: "boxFold(p) · scale − offset" },
  { name: "LIMINAL", code: "02", formula: "rooms(p) ∩ repetition(xz)" },
  { name: "LATTICE", code: "03", formula: "min(grid(p), nodes(p))" },
  { name: "ORGANIC", code: "04", formula: "length(sin(p·1.4)) − 0.72" },
  { name: "∞ PIZZA", code: "05", formula: "crust(p) ∪ cheese(p) ∪ toppings(p)" },
  { name: "CATHEDRAL", code: "06", formula: "vaults(p) ∪ pillars(p)" },
  { name: "MENGER", code: "07", formula: "box(p) − recursiveCross(p)" },
  { name: "CRYSTAL", code: "08", formula: "repeat(octahedron(p))" },
  { name: "VOID RINGS", code: "09", formula: "torus(p) ∪ orbit(p)" },
];

const VERT = `#version 300 es
in vec2 position;
void main(){ gl_Position=vec4(position,0.,1.); }`;

function fragmentSource(customExpression = "length(p)-1.0") {
  return `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uResolution;
uniform float uTime;
uniform float uFov;
uniform float uDistance;
uniform float uDetail;
uniform float uShadows;
uniform float uVolumetric;
uniform float uBands;
uniform float uRings;
uniform int uWorld;
uniform vec3 uCamera;
uniform mat3 uRotation;

#define PI 3.14159265359
float hash21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
mat2 rot(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float sdBox(vec3 p,vec3 b){ vec3 q=abs(p)-b; return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.); }
float sdTorus(vec3 p,vec2 t){ vec2 q=vec2(length(p.xz)-t.x,p.y); return length(q)-t.y; }

float mandelbox(vec3 p){
  vec3 z=p; float scale=2.55; float dr=1.;
  for(int i=0;i<7;i++){
    z=clamp(z,-1.,1.)*2.-z;
    float r2=dot(z,z);
    float k=clamp(max(1.0/r2,1.0),1.0,4.0);
    z*=k; dr*=k;
    z=z*scale+p; dr=dr*abs(scale)+1.;
  }
  return length(z)/abs(dr)-0.012;
}

float liminal(vec3 p){
  vec3 q=p; q.xz=mod(q.xz+4.,8.)-4.;
  float room=-sdBox(q,vec3(3.5,2.25,3.5));
  float pillars=sdBox(vec3(abs(q.x)-3.05,q.y,mod(q.z+1.5,3.)-1.5),vec3(.18,2.2,.18));
  float ceiling=abs(q.y-2.2)-.12;
  float door=sdBox(vec3(q.x,q.y+.45,abs(q.z)-3.45),vec3(.75,1.55,.16));
  return min(max(room,-door),min(pillars,ceiling));
}

float lattice(vec3 p){
  vec3 q=mod(p+2.,4.)-2.;
  vec3 a=abs(q);
  float bars=min(length(a.xy)-.09,min(length(a.yz)-.09,length(a.xz)-.09));
  float node=length(q)-.32;
  return min(bars,node);
}

float organic(vec3 p){
  p.xy*=rot(.22*sin(p.z*.18));
  vec3 q=sin(p*1.35+sin(p.zxy*.7+uTime*.09));
  float shell=abs(length(q)-1.02)-.075;
  float vein=length(sin(p.xy*2.4+sin(p.z)*.8))-.22;
  return min(shell,vein*.55);
}

float pizza(vec3 p){
  vec3 q=p; q.z=mod(q.z+3.,6.)-3.;
  q.xy*=rot(q.z*.22);
  float disk=max(length(q.xy)-2.25,abs(q.z)-.16);
  float crust=sdTorus(vec3(q.x,q.z,q.y),vec2(2.02,.22));
  vec2 id=floor((q.xy+2.)*.9);
  vec2 pp=mod(q.xy+2.,1.1)-.55;
  float pepper=max(length(pp)-.23,abs(q.z)-.23);
  pepper += (hash21(id)-.5)*.05;
  return min(disk,min(crust,pepper));
}

float cathedral(vec3 p){
  vec3 q=p; q.x=mod(q.x+3.,6.)-3.; q.z=mod(q.z+5.,10.)-5.;
  float columns=sdBox(vec3(abs(q.x)-2.45,q.y,mod(q.z+2.5,5.)-2.5),vec3(.22,3.2,.22));
  float nave=max(abs(q.x)-2.8,abs(q.y)-3.25);
  float vault=abs(length(vec2(q.x,q.y-2.6))-2.8)-.12;
  float ribs=sdTorus(vec3(q.x,q.z,q.y-2.4),vec2(2.5,.08));
  return min(columns,min(max(nave,-vault),ribs));
}

float menger(vec3 p){
  float d=sdBox(p,vec3(2.2)); float s=1.;
  for(int i=0;i<5;i++){
    vec3 a=mod(p*s+1.,2.)-1.; s*=3.;
    vec3 r=abs(1.-3.*abs(a));
    float c=(min(max(r.x,r.y),min(max(r.y,r.z),max(r.z,r.x)))-1.)/s;
    d=max(d,c);
  }
  return d;
}

float sdOcta(vec3 p,float s){ p=abs(p); return (p.x+p.y+p.z-s)*.57735027; }
float crystal(vec3 p){
  vec3 q=mod(p+2.5,5.)-2.5;
  q.xy*=rot(.2*sin(floor((p.z+2.5)/5.)));
  float gem=sdOcta(q,1.55);
  float core=length(q)-.34;
  return min(gem,core);
}

float voidRings(vec3 p){
  p.xy*=rot(.18*p.z+uTime*.035);
  vec3 q=p; q.z=mod(q.z+4.,8.)-4.;
  float a=sdTorus(q,vec2(2.1,.12));
  q.xy*=rot(PI*.5); float b=sdTorus(q,vec2(1.35,.08));
  vec3 cell=mod(p+1.5,3.)-1.5;
  return min(min(a,b),length(cell)-.055);
}

float customField(vec3 p,float t){ return ${customExpression}; }

float map(vec3 p){
  if(uWorld==0) return mandelbox(p*.52)*1.9;
  if(uWorld==1) return liminal(p);
  if(uWorld==2) return lattice(p);
  if(uWorld==3) return organic(p);
  if(uWorld==4) return pizza(p);
  if(uWorld==5) return cathedral(p);
  if(uWorld==6) return menger(p*.65)*1.55;
  if(uWorld==7) return crystal(p);
  if(uWorld==8) return voidRings(p);
  return customField(p,uTime);
}

vec3 normal(vec3 p){
  float e=.0015; vec2 h=vec2(e,0.);
  return normalize(vec3(map(p+h.xyy)-map(p-h.xyy),map(p+h.yxy)-map(p-h.yxy),map(p+h.yyx)-map(p-h.yyx)));
}

float softShadow(vec3 ro,vec3 rd,float mint,float maxt){
  float res=1.,t=mint;
  for(int i=0;i<24;i++){ float h=map(ro+rd*t); res=min(res,12.*h/t); t+=clamp(h,.02,.35); if(h<.001||t>maxt) break; }
  return clamp(res,0.,1.);
}

vec3 palette(float x){
  if(uWorld==1) return mix(vec3(.14,.035,.018),vec3(.9,.28,.06),x);
  if(uWorld==4) return mix(vec3(.42,.055,.02),vec3(1.,.72,.12),x);
  if(uWorld==3) return mix(vec3(.015,.08,.07),vec3(.35,1.,.58),x);
  if(uWorld==5) return mix(vec3(.025,.03,.08),vec3(.25,.55,1.),x);
  if(uWorld==6) return mix(vec3(.08,.025,.12),vec3(.95,.18,1.),x);
  if(uWorld==7) return mix(vec3(.02,.08,.12),vec3(.35,.92,1.),x);
  if(uWorld==8) return mix(vec3(.015,.005,.04),vec3(.72,.2,1.),x);
  return mix(vec3(.005,.15,.17),vec3(.7,1.,.12),x);
}

void main(){
  vec2 uv=(gl_FragCoord.xy*2.-uResolution.xy)/uResolution.y;
  vec3 ro=uCamera;
  float focal=1.0/tan(radians(uFov)*.5);
  vec3 rd=normalize(uRotation*vec3(uv,focal));
  float t=0.,glow=0.;
  int steps=int(mix(80.,160.,uDetail)*(1.-uRings)+mix(48.,112.,uDetail)*uRings);
  float hitEpsilon=mix(.0032,.0015,uRings);
  float marchScale=mix(.50,.72,uRings);
  float minimumStep=mix(.004,.008,uRings);
  float d=0.;
  for(int i=0;i<176;i++){
    if(i>=steps) break;
    d=map(ro+rd*t);
    glow+=exp(-12.*abs(d))*.006;
    if(abs(d)<hitEpsilon*(1.+t*.012)||t>uDistance) break;
    t+=max(abs(d)*marchScale,minimumStep);
  }
  vec3 col=vec3(.002,.009,.009);
  if(t<uDistance){
    vec3 p=ro+rd*t,n=normal(p);
    vec3 light=normalize(vec3(.5,.8,-.7));
    float dif=max(dot(n,light),0.);
    float sh=mix(1.,softShadow(p+n*.01,light,.02,8.),uShadows*uBands);
    float edge=pow(1.-abs(dot(n,-rd)),2.2);
    float bands=.5+.5*sin((p.x+p.y+p.z)*3.2+uTime*.22);
    float paletteTone=mix(.55,.25+.5*dif+.25*bands,uBands);
    float lighting=mix(.72,.12+dif*sh*.82,uBands);
    col=palette(paletteTone)*lighting+palette(1.)*edge*.35*uBands;
    if(uWorld==4){ float cheese=smoothstep(.0,.18,abs(fract((p.x+p.y)*.7)-.5)); col*=mix(vec3(1.,.36,.08),vec3(1.,.82,.24),cheese); }
    col*=exp(-t*.018);
  }
  col+=palette(1.)*glow*uVolumetric;
  col+=palette(.3)*pow(max(dot(rd,normalize(vec3(.1,.04,1.))),0.),90.)*.7;
  float vig=1.-dot(uv*.36,uv*.36); col*=clamp(vig,.15,1.);
  col=pow(col,vec3(.72));
  float grain=(hash21(gl_FragCoord.xy+fract(uTime)*91.)-.5)*.035;
  fragColor=vec4(col+grain,1.);
}`;
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader) || "Shader compilation failed";
    gl.deleteShader(shader);
    throw new Error(error.replace(/ERROR: \d+:/g, "line "));
  }
  return shader;
}

function FractalCanvas({ world, settings, customExpression, mobileMoveRef, onStats }: {
  world: number; settings: Settings; customExpression: string; mobileMoveRef: { current: MobileMove }; onStats: (fps: number, pos: number[], rot: number[]) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ world, settings, yaw: 0, pitch: 0, pos: [0, 0, -4] as number[], keys: new Set<string>(), touchLook: null as null | {id:number,x:number,y:number} });
  useEffect(() => { stateRef.current.world = world; stateRef.current.settings = settings; }, [world, settings]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext("webgl2", { antialias: false, powerPreference: "high-performance" });
    if (!gl) return;
    let program: WebGLProgram;
    try {
      const vs = compileShader(gl, gl.VERTEX_SHADER, VERT);
      const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource(customExpression));
      program = gl.createProgram()!; gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "Link failed");
    } catch (e) { console.error(e); return; }
    const vao=gl.createVertexArray(); gl.bindVertexArray(vao);
    const buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(program,"position"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    const uni=(name:string)=>gl.getUniformLocation(program,name);
    const U={res:uni("uResolution"),time:uni("uTime"),fov:uni("uFov"),distance:uni("uDistance"),detail:uni("uDetail"),shadows:uni("uShadows"),vol:uni("uVolumetric"),bands:uni("uBands"),rings:uni("uRings"),world:uni("uWorld"),camera:uni("uCamera"),rotation:uni("uRotation")};
    let frame=0,last=performance.now(),fps=60,raf=0;
    const resize=()=>{ const dpr=Math.min(devicePixelRatio,stateRef.current.settings.detail>.7?1.7:1.25); const w=Math.floor(canvas.clientWidth*dpr),h=Math.floor(canvas.clientHeight*dpr); if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);} };
    const render=(now:number)=>{
      resize(); const s=stateRef.current,dt=Math.min((now-last)/1000,.05); last=now;
      const cp=Math.cos(s.pitch),sp=Math.sin(s.pitch),cy=Math.cos(s.yaw),sy=Math.sin(s.yaw);
      const forward=[sy*cp,-sp,cy*cp],right=[cy,0,-sy],up=[sy*sp,cp,cy*sp];
      let mx=0,my=0,mz=0; if(s.keys.has("KeyW"))mz++; if(s.keys.has("KeyS"))mz--; if(s.keys.has("KeyD"))mx++; if(s.keys.has("KeyA"))mx--; if(s.keys.has("Space"))my++; if(s.keys.has("KeyC"))my--;
      mx+=mobileMoveRef.current.x; mz+=mobileMoveRef.current.z;
      const boost=s.keys.has("ShiftLeft")||s.keys.has("ShiftRight")?3:1, vel=s.settings.speed*.06*boost;
      for(let i=0;i<3;i++) s.pos[i]+=(forward[i]*mz+right[i]*mx+(i===1?my:0))*vel*dt;
      const mat=new Float32Array([right[0],right[1],right[2],up[0],up[1],up[2],forward[0],forward[1],forward[2]]);
      gl.useProgram(program); gl.uniform2f(U.res,canvas.width,canvas.height); gl.uniform1f(U.time,now/1000); gl.uniform1f(U.fov,s.settings.fov); gl.uniform1f(U.distance,s.settings.distance); gl.uniform1f(U.detail,s.settings.detail); gl.uniform1f(U.shadows,s.settings.shadows?1:0); gl.uniform1f(U.vol,s.settings.volumetric?1:0); gl.uniform1f(U.bands,s.settings.bands?1:0); gl.uniform1f(U.rings,s.settings.rings?1:0); gl.uniform1i(U.world,s.world); gl.uniform3f(U.camera,s.pos[0],s.pos[1],s.pos[2]); gl.uniformMatrix3fv(U.rotation,false,mat); gl.drawArrays(gl.TRIANGLES,0,3);
      frame++; if(frame%20===0){fps=Math.round(1/Math.max(dt,.001));onStats(fps,s.pos,[s.pitch,s.yaw]);}
      raf=requestAnimationFrame(render);
    };
    const keyDown=(e:KeyboardEvent)=>stateRef.current.keys.add(e.code),keyUp=(e:KeyboardEvent)=>stateRef.current.keys.delete(e.code);
    const mouse=(e:MouseEvent)=>{if(document.pointerLockElement===canvas){stateRef.current.yaw+=e.movementX*.0022;stateRef.current.pitch=Math.max(-1.5,Math.min(1.5,stateRef.current.pitch+e.movementY*.0022));}};
    const wheel=(e:WheelEvent)=>{stateRef.current.settings.speed=Math.max(.1,Math.min(50,stateRef.current.settings.speed-e.deltaY*.015));};
    const touchStart=(e:TouchEvent)=>{for(const t of Array.from(e.changedTouches)){if(!stateRef.current.touchLook)stateRef.current.touchLook={id:t.identifier,x:t.clientX,y:t.clientY};}};
    const touchMove=(e:TouchEvent)=>{for(const t of Array.from(e.touches)){const look=stateRef.current.touchLook;if(look&&t.identifier===look.id){const dx=t.clientX-look.x,dy=t.clientY-look.y;stateRef.current.yaw+=dx*.006;stateRef.current.pitch=Math.max(-1.5,Math.min(1.5,stateRef.current.pitch+dy*.006));stateRef.current.touchLook={id:look.id,x:t.clientX,y:t.clientY};}}e.preventDefault();};
    const touchEnd=(e:TouchEvent)=>{for(const t of Array.from(e.changedTouches)){if(stateRef.current.touchLook?.id===t.identifier)stateRef.current.touchLook=null;}};
    canvas.onclick=()=>canvas.requestPointerLock?.(); window.addEventListener("keydown",keyDown);window.addEventListener("keyup",keyUp);window.addEventListener("mousemove",mouse);canvas.addEventListener("wheel",wheel,{passive:true});canvas.addEventListener("touchstart",touchStart,{passive:true});canvas.addEventListener("touchmove",touchMove,{passive:false});canvas.addEventListener("touchend",touchEnd);raf=requestAnimationFrame(render);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("keydown",keyDown);window.removeEventListener("keyup",keyUp);window.removeEventListener("mousemove",mouse);canvas.removeEventListener("wheel",wheel);canvas.removeEventListener("touchstart",touchStart);canvas.removeEventListener("touchmove",touchMove);canvas.removeEventListener("touchend",touchEnd);gl.deleteProgram(program);};
  }, [customExpression, mobileMoveRef, onStats]);
  return <canvas ref={canvasRef} className={`fractal-canvas world-${world}`} aria-label="Interactive three-dimensional fractal world" />;
}

function MobileJoystick({ inputRef }: { inputRef: { current: MobileMove } }) {
  const applyPoint=(stick:HTMLDivElement,clientX:number,clientY:number)=>{
    const r=stick.getBoundingClientRect(),max=Math.max(1,r.width*.32);
    let dx=clientX-(r.left+r.width/2),dy=clientY-(r.top+r.height/2);
    const length=Math.hypot(dx,dy);if(length>max){dx=dx/length*max;dy=dy/length*max;}
    inputRef.current.x=dx/max;inputRef.current.z=-dy/max;
    const knob=stick.querySelector<HTMLElement>("i");if(knob)knob.style.transform=`translate3d(${dx}px,${dy}px,0)`;
  };
  const reset=(stick:HTMLDivElement)=>{inputRef.current={pointerId:null,x:0,z:0};const knob=stick.querySelector<HTMLElement>("i");if(knob)knob.style.transform="translate3d(0,0,0)";};
  const pointerStart=(e:React.PointerEvent<HTMLDivElement>)=>{if(e.pointerType==="touch")return;inputRef.current.pointerId=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);applyPoint(e.currentTarget,e.clientX,e.clientY);e.preventDefault();e.stopPropagation();};
  const pointerMove=(e:React.PointerEvent<HTMLDivElement>)=>{if(e.pointerType==="touch"||inputRef.current.pointerId!==e.pointerId)return;applyPoint(e.currentTarget,e.clientX,e.clientY);e.preventDefault();e.stopPropagation();};
  const pointerStop=(e:React.PointerEvent<HTMLDivElement>)=>{if(e.pointerType==="touch"||inputRef.current.pointerId!==e.pointerId)return;reset(e.currentTarget);e.preventDefault();e.stopPropagation();};
  const touchStart=(e:React.TouchEvent<HTMLDivElement>)=>{const t=e.changedTouches[0];if(!t)return;inputRef.current.pointerId=t.identifier;applyPoint(e.currentTarget,t.clientX,t.clientY);e.preventDefault();e.stopPropagation();};
  const touchMove=(e:React.TouchEvent<HTMLDivElement>)=>{const t=Array.from(e.touches).find(x=>x.identifier===inputRef.current.pointerId);if(!t)return;applyPoint(e.currentTarget,t.clientX,t.clientY);e.preventDefault();e.stopPropagation();};
  const touchStop=(e:React.TouchEvent<HTMLDivElement>)=>{if(!Array.from(e.changedTouches).some(x=>x.identifier===inputRef.current.pointerId))return;reset(e.currentTarget);e.preventDefault();e.stopPropagation();};
  return <div className="joystick" onPointerDown={pointerStart} onPointerMove={pointerMove} onPointerUp={pointerStop} onPointerCancel={pointerStop} onTouchStart={touchStart} onTouchMove={touchMove} onTouchEnd={touchStop} onTouchCancel={touchStop}><i/></div>;
}

function Range({ label, value, min, max, step, display, onChange }: { label:string; value:number; min:number; max:number; step:number; display:string; onChange:(v:number)=>void }) {
  return <label className="range-control"><span className="control-label"><b>{label}</b><output>{display}</output></span><input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(+e.target.value)} /><span className="range-minmax"><i>{min}</i><i>{max}</i></span></label>;
}

export default function Home() {
  const mobileMoveRef=useRef<MobileMove>({pointerId:null,x:0,z:0});
  const [world,setWorld]=useState(0);
  const [panel,setPanel]=useState(false);
  const [hud,setHud]=useState(false);
  const [worldMenu,setWorldMenu]=useState(false);
  const [fullscreen,setFullscreen]=useState(false);
  const [formulaOpen,setFormulaOpen]=useState(false);
  const [formula,setFormula]=useState("length(mod(p + 2.0, 4.0) - 2.0) - 0.72");
  const [compiled,setCompiled]=useState(formula);
  const [formulaError,setFormulaError]=useState("");
  const [custom,setCustom]=useState(false);
  const [stats,setStats]=useState({fps:60,pos:[0,0,-4],rot:[0,0]});
  const [settings,setSettings]=useState<Settings>({speed:12.4,distance:42,fov:70,detail:.66,shadows:true,volumetric:true,bands:true,rings:true});
  const update=<K extends keyof Settings>(key:K,value:Settings[K])=>setSettings(s=>({...s,[key]:value}));
  const onStats=useCallback((fps:number,pos:number[],rot:number[])=>setStats({fps,pos:[...pos],rot:[...rot]}),[]);
  const compile=()=>{
    if(/[;{}#]/.test(formula)){setFormulaError("Use one GLSL expression only — no semicolons or blocks.");return;}
    try{
      const gl=document.createElement("canvas").getContext("webgl2");
      if(gl) compileShader(gl,gl.FRAGMENT_SHADER,fragmentSource(formula));
    }catch(e){setFormulaError(e instanceof Error?e.message:"Shader compilation failed");return;}
    setFormulaError("");setCompiled(formula);setCustom(true);setFormulaOpen(false);
  };
  useEffect(()=>{const k=(e:KeyboardEvent)=>{if(e.key.toLowerCase()==="f"&&!(e.target instanceof HTMLTextAreaElement))setFormulaOpen(v=>!v);if(/^\d$/.test(e.key)&&+e.key>=1&&+e.key<=9){setWorld(+e.key-1);setCustom(false);}};window.addEventListener("keydown",k);return()=>window.removeEventListener("keydown",k);},[]);
  useEffect(()=>{const sync=()=>setFullscreen(Boolean(document.fullscreenElement));document.addEventListener("fullscreenchange",sync);return()=>document.removeEventListener("fullscreenchange",sync)},[]);
  const toggleFullscreen=async()=>{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();};

  return <main className={`app-shell ${panel?"":"panel-hidden"} ${hud?"":"hud-hidden"}`}>
    <FractalCanvas world={custom?9:world} settings={settings} customExpression={compiled} mobileMoveRef={mobileMoveRef} onStats={onStats}/>
    {settings.bands&&<div className="scanlines" />}
    <header className="identity">
      <div className="eyebrow"><span>REALTIME FRACTAL NAVIGATOR</span><span>/ {custom?"ƒ":WORLDS[world].code}</span></div>
      <h1>FRACTAL<br/>DRIFT</h1>
      <button className="mobile-world-trigger" onClick={()=>setWorldMenu(v=>!v)} aria-expanded={worldMenu} aria-controls="world-picker"><span>WORLD / {custom?"ƒ":WORLDS[world].code}</span><b>{custom?"CUSTOM FIELD":WORLDS[world].name}</b><i>{worldMenu?"×":"＋"}</i></button>
      <nav id="world-picker" className={`worlds ${worldMenu?"mobile-open":""}`} aria-label="Fractal worlds">
        <div className="mobile-picker-head"><span>SELECT FIELD</span><button onClick={()=>setWorldMenu(false)}>CLOSE ×</button></div>
        {WORLDS.map((w,i)=><button key={w.name} className={!custom&&world===i?"active":""} onClick={()=>{setWorld(i);setCustom(false);setWorldMenu(false)}}><span>{String(i+1).padStart(2,"0")}</span>{w.name}</button>)}
        <button className={`formula-world ${custom?"active":""}`} onClick={()=>{setWorldMenu(false);setFormulaOpen(true)}}><span>ƒ</span>{custom?"CUSTOM ACTIVE":"CUSTOM FORMULA"}</button>
      </nav>
    </header>

    <button className={`mobile-scrim ${worldMenu?"open":""}`} onClick={()=>setWorldMenu(false)} aria-label="Close world selector" />

    <div className="utility-dock" style={{right:panel?304:12}}>
      <button onClick={()=>setPanel(v=>!v)} aria-label="Toggle flight parameters"><span className="desktop-label">{panel?"PANEL →":"PANEL ←"}</span><span className="mobile-label"><i>⚙</i>SETTINGS</span></button>
      <button onClick={()=>setHud(v=>!v)} aria-label="Toggle bottom telemetry"><span className="desktop-label">{hud?"HUD ↓":"HUD ↑"}</span><span className="mobile-label"><i>⌁</i>HUD</span></button>
      <button onClick={toggleFullscreen} aria-label="Toggle fullscreen"><span className="desktop-label">{fullscreen?"EXIT FULL":"FULLSCREEN ⛶"}</span><span className="mobile-label"><i>⛶</i>{fullscreen?"EXIT":"FULL"}</span></button>
    </div>
    <aside className={`control-rail ${panel?"open":""}`}>
      <div className="rail-head"><span>FLIGHT PARAMETERS</span><span>{custom?"ƒ":WORLDS[world].code}</span><button className="rail-close" onClick={()=>setPanel(false)} aria-label="Close flight parameters">×</button></div>
      <Range label="SPEED" value={settings.speed} min={.1} max={50} step={.1} display={settings.speed.toFixed(1)} onChange={v=>update("speed",v)}/>
      <Range label="DRAW DISTANCE" value={settings.distance} min={12} max={80} step={1} display={String(settings.distance)} onChange={v=>update("distance",v)}/>
      <Range label="FIELD OF VIEW" value={settings.fov} min={30} max={120} step={1} display={`${settings.fov}°`} onChange={v=>update("fov",v)}/>
      <Range label="DETAIL / STEPS" value={settings.detail} min={.05} max={1} step={.01} display={String(Math.round(48+settings.detail*64))} onChange={v=>update("detail",v)}/>
      <div className="switches">
        <button onClick={()=>update("shadows",!settings.shadows)}><span>SHADOWS</span><i className={settings.shadows?"on":""}/></button>
        <button onClick={()=>update("volumetric",!settings.volumetric)}><span>VOLUMETRIC</span><i className={settings.volumetric?"on":""}/></button>
        <button onClick={()=>update("bands",!settings.bands)}><span>SOFT LIGHTING</span><i className={settings.bands?"":"on"}/></button>
        <button onClick={()=>update("rings",!settings.rings)}><span>RAY RINGS</span><i className={settings.rings?"on":""}/></button>
      </div>
      <button className="formula-trigger" onClick={()=>setFormulaOpen(true)}><span>ƒ</span><b>CUSTOM FORMULA</b><i>↗</i></button>
      <code className="formula-preview">{custom?compiled:WORLDS[world].formula}</code>
    </aside>

    <div className="crosshair" aria-hidden="true"><i/><i/></div>
    <footer className={`telemetry ${hud?"":"collapsed"}`}>
      <div className="t-block position"><small>POSITION</small><span>X {stats.pos[0].toFixed(3)}</span><span>Y {stats.pos[1].toFixed(3)}</span><span>Z {stats.pos[2].toFixed(3)}</span></div>
      <div className="t-block rotation"><small>ROTATION</small><span>P {(stats.rot[0]*57.3).toFixed(1)}°</span><span>Y {(stats.rot[1]*57.3).toFixed(1)}°</span></div>
      <div className="t-block velocity"><small>VELOCITY / {stats.fps} FPS</small><div className="meter">{Array.from({length:22},(_,i)=><i key={i} className={i<Math.round(settings.speed/2.3)?"lit":""}/>)}</div></div>
      <div className="key-help"><span><b>[WASD]</b>MOVE</span><span><b>[MOUSE]</b>LOOK</span><span><b>[SHIFT]</b>BOOST</span><span><b>[F]</b>FORMULA</span></div>
      <div className="speed-readout"><small>SPEED</small><strong>{settings.speed.toFixed(1)}</strong><em>×</em></div>
    </footer>

    <div className="touch-controls"><MobileJoystick inputRef={mobileMoveRef}/><div className="touch-look" aria-hidden="true">DRAG<br/>TO LOOK</div></div>

    <div className={`formula-editor ${formulaOpen?"open":""}`} role="dialog" aria-modal="true" aria-label="Custom distance field formula">
      <div className="editor-head"><div><span>ƒ / FIELD COMPILER</span><small>GLSL EXPRESSION</small></div><button onClick={()=>setFormulaOpen(false)}>CLOSE [ESC]</button></div>
      <p>Write a signed-distance expression. Available: <code>p</code> (vec3), <code>t</code> (time), <code>sin cos abs length mod min max dot</code>.</p>
      <div className="code-area"><span>float customField(vec3 p, float t) &#123;<br/>&nbsp;&nbsp;return</span><textarea value={formula} onChange={e=>setFormula(e.target.value)} onKeyDown={e=>{if((e.metaKey||e.ctrlKey)&&e.key==="Enter"){e.preventDefault();compile();}if(e.key==="Escape")setFormulaOpen(false)}} spellCheck={false}/><span>;<br/>&#125;</span></div>
      {formulaError&&<div className="formula-error">COMPILER / {formulaError}</div>}
      <div className="formula-presets"><span>RECOMMENDED</span>{[
        {label:"SPHERE",expr:"length(p)-1.0"},
        {label:"ORGANIC",expr:"length(sin(p*1.4))-0.72"},
        {label:"WARP",expr:"abs(dot(sin(p),cos(p.zxy)))-0.18"}
      ].map(x=><button key={x.label} onClick={()=>setFormula(x.expr)}><b>{x.label}</b><code>{x.expr}</code></button>)}</div>
      <div className="editor-actions"><button onClick={()=>setFormula("length(p)-1.0")}>RESET</button><button className="compile" onClick={compile}>COMPILE FIELD <span>⌘↵</span></button></div>
    </div>
  </main>;
}
