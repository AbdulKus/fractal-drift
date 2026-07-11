(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,31713,e=>{"use strict";var t=e.i(43476),r=e.i(71645);let n=[{name:"MANDELBOX",code:"01",formula:"boxFold(p) · scale − offset"},{name:"LIMINAL",code:"02",formula:"rooms(p) ∩ repetition(xz)"},{name:"LATTICE",code:"03",formula:"min(grid(p), nodes(p))"},{name:"ORGANIC",code:"04",formula:"length(sin(p·1.4)) − 0.72"},{name:"∞ PIZZA",code:"05",formula:"crust(p) ∪ cheese(p) ∪ toppings(p)"},{name:"CATHEDRAL",code:"06",formula:"vaults(p) ∪ pillars(p)"},{name:"MENGER",code:"07",formula:"box(p) − recursiveCross(p)"},{name:"CRYSTAL",code:"08",formula:"repeat(octahedron(p))"},{name:"VOID RINGS",code:"09",formula:"torus(p) ∪ orbit(p)"}],a=`#version 300 es
in vec2 position;
void main(){ gl_Position=vec4(position,0.,1.); }`;function o(e="length(p)-1.0"){return`#version 300 es
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

float customField(vec3 p,float t){ return ${e}; }

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
}`}function s(e,t,r){let n=e.createShader(t);if(e.shaderSource(n,r),e.compileShader(n),!e.getShaderParameter(n,e.COMPILE_STATUS)){let t=e.getShaderInfoLog(n)||"Shader compilation failed";throw e.deleteShader(n),Error(t.replace(/ERROR: \d+:/g,"line "))}return n}function i({world:e,settings:n,customExpression:l,mobileMoveRef:c,onStats:d}){let u=(0,r.useRef)(null),m=(0,r.useRef)({world:e,settings:n,yaw:0,pitch:0,pos:[0,0,-4],keys:new Set,touchLook:null});return(0,r.useEffect)(()=>{m.current.world=e,m.current.settings=n},[e,n]),(0,r.useEffect)(()=>{let e,t=u.current,r=t.getContext("webgl2",{antialias:!1,powerPreference:"high-performance"});if(!r)return;try{let t=s(r,r.VERTEX_SHADER,a),n=s(r,r.FRAGMENT_SHADER,o(l));if(e=r.createProgram(),r.attachShader(e,t),r.attachShader(e,n),r.linkProgram(e),!r.getProgramParameter(e,r.LINK_STATUS))throw Error(r.getProgramInfoLog(e)||"Link failed")}catch(e){console.error(e);return}let n=r.createVertexArray();r.bindVertexArray(n);let i=r.createBuffer();r.bindBuffer(r.ARRAY_BUFFER,i),r.bufferData(r.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),r.STATIC_DRAW);let p=r.getAttribLocation(e,"position");r.enableVertexAttribArray(p),r.vertexAttribPointer(p,2,r.FLOAT,!1,0,0);let h={res:r.getUniformLocation(e,"uResolution"),time:r.getUniformLocation(e,"uTime"),fov:r.getUniformLocation(e,"uFov"),distance:r.getUniformLocation(e,"uDistance"),detail:r.getUniformLocation(e,"uDetail"),shadows:r.getUniformLocation(e,"uShadows"),vol:r.getUniformLocation(e,"uVolumetric"),bands:r.getUniformLocation(e,"uBands"),rings:r.getUniformLocation(e,"uRings"),world:r.getUniformLocation(e,"uWorld"),camera:r.getUniformLocation(e,"uCamera"),rotation:r.getUniformLocation(e,"uRotation")},f=0,x=performance.now(),v=0,g=n=>{let a,o,s;a=Math.min(devicePixelRatio,m.current.settings.detail>.7?1.7:1.25),o=Math.floor(t.clientWidth*a),s=Math.floor(t.clientHeight*a),(t.width!==o||t.height!==s)&&(t.width=o,t.height=s,r.viewport(0,0,o,s));let i=m.current,l=Math.min((n-x)/1e3,.05);x=n;let u=Math.cos(i.pitch),p=Math.sin(i.pitch),j=Math.cos(i.yaw),b=Math.sin(i.yaw),y=[b*u,-p,j*u],E=[j,0,-b],L=[b*p,u,j*p],S=0,T=0,w=0;i.keys.has("KeyW")&&w++,i.keys.has("KeyS")&&w--,i.keys.has("KeyD")&&S++,i.keys.has("KeyA")&&S--,i.keys.has("Space")&&T++,i.keys.has("KeyC")&&T--,S+=c.current.x,w+=c.current.z;let k=i.keys.has("ShiftLeft")||i.keys.has("ShiftRight")?3:1,R=.06*i.settings.speed*k;for(let e=0;e<3;e++)i.pos[e]+=(y[e]*w+E[e]*S+(1===e?T:0))*R*l;let C=new Float32Array([E[0],E[1],E[2],L[0],L[1],L[2],y[0],y[1],y[2]]);r.useProgram(e),r.uniform2f(h.res,t.width,t.height),r.uniform1f(h.time,n/1e3),r.uniform1f(h.fov,i.settings.fov),r.uniform1f(h.distance,i.settings.distance),r.uniform1f(h.detail,i.settings.detail),r.uniform1f(h.shadows,+!!i.settings.shadows),r.uniform1f(h.vol,+!!i.settings.volumetric),r.uniform1f(h.bands,+!!i.settings.bands),r.uniform1f(h.rings,+!!i.settings.rings),r.uniform1i(h.world,i.world),r.uniform3f(h.camera,i.pos[0],i.pos[1],i.pos[2]),r.uniformMatrix3fv(h.rotation,!1,C),r.drawArrays(r.TRIANGLES,0,3),++f%20==0&&d(Math.round(1/Math.max(l,.001)),i.pos,[i.pitch,i.yaw]),v=requestAnimationFrame(g)},j=e=>m.current.keys.add(e.code),b=e=>m.current.keys.delete(e.code),y=e=>{document.pointerLockElement===t&&(m.current.yaw+=.0022*e.movementX,m.current.pitch=Math.max(-1.5,Math.min(1.5,m.current.pitch+.0022*e.movementY)))},E=e=>{m.current.settings.speed=Math.max(.1,Math.min(50,m.current.settings.speed-.015*e.deltaY))},L=e=>{for(let t of Array.from(e.changedTouches))m.current.touchLook||(m.current.touchLook={id:t.identifier,x:t.clientX,y:t.clientY})},S=e=>{for(let t of Array.from(e.touches)){let e=m.current.touchLook;if(e&&t.identifier===e.id){let r=t.clientX-e.x,n=t.clientY-e.y;m.current.yaw+=.006*r,m.current.pitch=Math.max(-1.5,Math.min(1.5,m.current.pitch+.006*n)),m.current.touchLook={id:e.id,x:t.clientX,y:t.clientY}}}e.preventDefault()},T=e=>{for(let t of Array.from(e.changedTouches))m.current.touchLook?.id===t.identifier&&(m.current.touchLook=null)};return t.onclick=()=>t.requestPointerLock?.(),window.addEventListener("keydown",j),window.addEventListener("keyup",b),window.addEventListener("mousemove",y),t.addEventListener("wheel",E,{passive:!0}),t.addEventListener("touchstart",L,{passive:!0}),t.addEventListener("touchmove",S,{passive:!1}),t.addEventListener("touchend",T),v=requestAnimationFrame(g),()=>{cancelAnimationFrame(v),window.removeEventListener("keydown",j),window.removeEventListener("keyup",b),window.removeEventListener("mousemove",y),t.removeEventListener("wheel",E),t.removeEventListener("touchstart",L),t.removeEventListener("touchmove",S),t.removeEventListener("touchend",T),r.deleteProgram(e)}},[l,c,d]),(0,t.jsx)("canvas",{ref:u,className:`fractal-canvas world-${e}`,"aria-label":"Interactive three-dimensional fractal world"})}function l({inputRef:e}){let r=(t,r,n)=>{let a=t.getBoundingClientRect(),o=Math.max(1,.32*a.width),s=r-(a.left+a.width/2),i=n-(a.top+a.height/2),l=Math.hypot(s,i);l>o&&(s=s/l*o,i=i/l*o),e.current.x=s/o,e.current.z=-i/o;let c=t.querySelector("i");c&&(c.style.transform=`translate3d(${s}px,${i}px,0)`)},n=t=>{e.current={pointerId:null,x:0,z:0};let r=t.querySelector("i");r&&(r.style.transform="translate3d(0,0,0)")},a=t=>{"touch"!==t.pointerType&&e.current.pointerId===t.pointerId&&(n(t.currentTarget),t.preventDefault(),t.stopPropagation())},o=t=>{Array.from(t.changedTouches).some(t=>t.identifier===e.current.pointerId)&&(n(t.currentTarget),t.preventDefault(),t.stopPropagation())};return(0,t.jsx)("div",{className:"joystick",onPointerDown:t=>{"touch"!==t.pointerType&&(e.current.pointerId=t.pointerId,t.currentTarget.setPointerCapture(t.pointerId),r(t.currentTarget,t.clientX,t.clientY),t.preventDefault(),t.stopPropagation())},onPointerMove:t=>{"touch"!==t.pointerType&&e.current.pointerId===t.pointerId&&(r(t.currentTarget,t.clientX,t.clientY),t.preventDefault(),t.stopPropagation())},onPointerUp:a,onPointerCancel:a,onTouchStart:t=>{let n=t.changedTouches[0];n&&(e.current.pointerId=n.identifier,r(t.currentTarget,n.clientX,n.clientY),t.preventDefault(),t.stopPropagation())},onTouchMove:t=>{let n=Array.from(t.touches).find(t=>t.identifier===e.current.pointerId);n&&(r(t.currentTarget,n.clientX,n.clientY),t.preventDefault(),t.stopPropagation())},onTouchEnd:o,onTouchCancel:o,children:(0,t.jsx)("i",{})})}function c({label:e,value:r,min:n,max:a,step:o,display:s,onChange:i}){return(0,t.jsxs)("label",{className:"range-control",children:[(0,t.jsxs)("span",{className:"control-label",children:[(0,t.jsx)("b",{children:e}),(0,t.jsx)("output",{children:s})]}),(0,t.jsx)("input",{type:"range",min:n,max:a,step:o,value:r,onChange:e=>i(+e.target.value)}),(0,t.jsxs)("span",{className:"range-minmax",children:[(0,t.jsx)("i",{children:n}),(0,t.jsx)("i",{children:a})]})]})}e.s(["default",0,function(){let e=(0,r.useRef)({pointerId:null,x:0,z:0}),[a,d]=(0,r.useState)(0),[u,m]=(0,r.useState)(!1),[p,h]=(0,r.useState)(!1),[f,x]=(0,r.useState)(!1),[v,g]=(0,r.useState)(!1),[j,b]=(0,r.useState)(!1),[y,E]=(0,r.useState)("length(mod(p + 2.0, 4.0) - 2.0) - 0.72"),[L,S]=(0,r.useState)(y),[T,w]=(0,r.useState)(""),[k,R]=(0,r.useState)(!1),[C,N]=(0,r.useState)({fps:60,pos:[0,0,-4],rot:[0,0]}),[A,q]=(0,r.useState)({speed:12.4,distance:42,fov:70,detail:.66,shadows:!0,volumetric:!0,bands:!0,rings:!0}),I=(e,t)=>q(r=>({...r,[e]:t})),z=(0,r.useCallback)((e,t,r)=>N({fps:e,pos:[...t],rot:[...r]}),[]),F=()=>{if(/[;{}#]/.test(y))return void w("Use one GLSL expression only — no semicolons or blocks.");try{let e=document.createElement("canvas").getContext("webgl2");e&&s(e,e.FRAGMENT_SHADER,o(y))}catch(e){w(e instanceof Error?e.message:"Shader compilation failed");return}w(""),S(y),R(!0),b(!1)};(0,r.useEffect)(()=>{let e=e=>{"f"!==e.key.toLowerCase()||e.target instanceof HTMLTextAreaElement||b(e=>!e),/^\d$/.test(e.key)&&+e.key>=1&&9>=+e.key&&(d(e.key-1),R(!1))};return window.addEventListener("keydown",e),()=>window.removeEventListener("keydown",e)},[]),(0,r.useEffect)(()=>{let e=()=>g(!!document.fullscreenElement);return document.addEventListener("fullscreenchange",e),()=>document.removeEventListener("fullscreenchange",e)},[]);let M=async()=>{document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen()};return(0,t.jsxs)("main",{className:`app-shell ${u?"":"panel-hidden"} ${p?"":"hud-hidden"}`,children:[(0,t.jsx)(i,{world:k?9:a,settings:A,customExpression:L,mobileMoveRef:e,onStats:z}),A.bands&&(0,t.jsx)("div",{className:"scanlines"}),(0,t.jsxs)("header",{className:"identity",children:[(0,t.jsxs)("div",{className:"eyebrow",children:[(0,t.jsx)("span",{children:"REALTIME FRACTAL NAVIGATOR"}),(0,t.jsxs)("span",{children:["/ ",k?"ƒ":n[a].code]})]}),(0,t.jsxs)("h1",{children:["FRACTAL",(0,t.jsx)("br",{}),"DRIFT"]}),(0,t.jsxs)("button",{className:"mobile-world-trigger",onClick:()=>x(e=>!e),"aria-expanded":f,"aria-controls":"world-picker",children:[(0,t.jsxs)("span",{children:["WORLD / ",k?"ƒ":n[a].code]}),(0,t.jsx)("b",{children:k?"CUSTOM FIELD":n[a].name}),(0,t.jsx)("i",{children:f?"×":"＋"})]}),(0,t.jsxs)("nav",{id:"world-picker",className:`worlds ${f?"mobile-open":""}`,"aria-label":"Fractal worlds",children:[(0,t.jsxs)("div",{className:"mobile-picker-head",children:[(0,t.jsx)("span",{children:"SELECT FIELD"}),(0,t.jsx)("button",{onClick:()=>x(!1),children:"CLOSE ×"})]}),n.map((e,r)=>(0,t.jsxs)("button",{className:k||a!==r?"":"active",onClick:()=>{d(r),R(!1),x(!1)},children:[(0,t.jsx)("span",{children:String(r+1).padStart(2,"0")}),e.name]},e.name)),(0,t.jsxs)("button",{className:`formula-world ${k?"active":""}`,onClick:()=>{x(!1),b(!0)},children:[(0,t.jsx)("span",{children:"ƒ"}),k?"CUSTOM ACTIVE":"CUSTOM FORMULA"]})]})]}),(0,t.jsx)("button",{className:`mobile-scrim ${f?"open":""}`,onClick:()=>x(!1),"aria-label":"Close world selector"}),(0,t.jsxs)("div",{className:"utility-dock",style:{right:u?304:12},children:[(0,t.jsxs)("button",{onClick:()=>m(e=>!e),"aria-label":"Toggle flight parameters",children:[(0,t.jsx)("span",{className:"desktop-label",children:u?"PANEL →":"PANEL ←"}),(0,t.jsxs)("span",{className:"mobile-label",children:[(0,t.jsx)("i",{children:"⚙"}),"SETTINGS"]})]}),(0,t.jsxs)("button",{onClick:()=>h(e=>!e),"aria-label":"Toggle bottom telemetry",children:[(0,t.jsx)("span",{className:"desktop-label",children:p?"HUD ↓":"HUD ↑"}),(0,t.jsxs)("span",{className:"mobile-label",children:[(0,t.jsx)("i",{children:"⌁"}),"HUD"]})]}),(0,t.jsxs)("button",{onClick:M,"aria-label":"Toggle fullscreen",children:[(0,t.jsx)("span",{className:"desktop-label",children:v?"EXIT FULL":"FULLSCREEN ⛶"}),(0,t.jsxs)("span",{className:"mobile-label",children:[(0,t.jsx)("i",{children:"⛶"}),v?"EXIT":"FULL"]})]})]}),(0,t.jsxs)("aside",{className:`control-rail ${u?"open":""}`,children:[(0,t.jsxs)("div",{className:"rail-head",children:[(0,t.jsx)("span",{children:"FLIGHT PARAMETERS"}),(0,t.jsx)("span",{children:k?"ƒ":n[a].code}),(0,t.jsx)("button",{className:"rail-close",onClick:()=>m(!1),"aria-label":"Close flight parameters",children:"×"})]}),(0,t.jsx)(c,{label:"SPEED",value:A.speed,min:.1,max:50,step:.1,display:A.speed.toFixed(1),onChange:e=>I("speed",e)}),(0,t.jsx)(c,{label:"DRAW DISTANCE",value:A.distance,min:12,max:80,step:1,display:String(A.distance),onChange:e=>I("distance",e)}),(0,t.jsx)(c,{label:"FIELD OF VIEW",value:A.fov,min:30,max:120,step:1,display:`${A.fov}\xb0`,onChange:e=>I("fov",e)}),(0,t.jsx)(c,{label:"DETAIL / STEPS",value:A.detail,min:.05,max:1,step:.01,display:String(Math.round(48+64*A.detail)),onChange:e=>I("detail",e)}),(0,t.jsxs)("div",{className:"switches",children:[(0,t.jsxs)("button",{onClick:()=>I("shadows",!A.shadows),children:[(0,t.jsx)("span",{children:"SHADOWS"}),(0,t.jsx)("i",{className:A.shadows?"on":""})]}),(0,t.jsxs)("button",{onClick:()=>I("volumetric",!A.volumetric),children:[(0,t.jsx)("span",{children:"VOLUMETRIC"}),(0,t.jsx)("i",{className:A.volumetric?"on":""})]}),(0,t.jsxs)("button",{onClick:()=>I("bands",!A.bands),children:[(0,t.jsx)("span",{children:"SOFT LIGHTING"}),(0,t.jsx)("i",{className:A.bands?"":"on"})]}),(0,t.jsxs)("button",{onClick:()=>I("rings",!A.rings),children:[(0,t.jsx)("span",{children:"RAY RINGS"}),(0,t.jsx)("i",{className:A.rings?"on":""})]})]}),(0,t.jsxs)("button",{className:"formula-trigger",onClick:()=>b(!0),children:[(0,t.jsx)("span",{children:"ƒ"}),(0,t.jsx)("b",{children:"CUSTOM FORMULA"}),(0,t.jsx)("i",{children:"↗"})]}),(0,t.jsx)("code",{className:"formula-preview",children:k?L:n[a].formula})]}),(0,t.jsxs)("div",{className:"crosshair","aria-hidden":"true",children:[(0,t.jsx)("i",{}),(0,t.jsx)("i",{})]}),(0,t.jsxs)("footer",{className:`telemetry ${p?"":"collapsed"}`,children:[(0,t.jsxs)("div",{className:"t-block position",children:[(0,t.jsx)("small",{children:"POSITION"}),(0,t.jsxs)("span",{children:["X ",C.pos[0].toFixed(3)]}),(0,t.jsxs)("span",{children:["Y ",C.pos[1].toFixed(3)]}),(0,t.jsxs)("span",{children:["Z ",C.pos[2].toFixed(3)]})]}),(0,t.jsxs)("div",{className:"t-block rotation",children:[(0,t.jsx)("small",{children:"ROTATION"}),(0,t.jsxs)("span",{children:["P ",(57.3*C.rot[0]).toFixed(1),"°"]}),(0,t.jsxs)("span",{children:["Y ",(57.3*C.rot[1]).toFixed(1),"°"]})]}),(0,t.jsxs)("div",{className:"t-block velocity",children:[(0,t.jsxs)("small",{children:["VELOCITY / ",C.fps," FPS"]}),(0,t.jsx)("div",{className:"meter",children:Array.from({length:22},(e,r)=>(0,t.jsx)("i",{className:r<Math.round(A.speed/2.3)?"lit":""},r))})]}),(0,t.jsxs)("div",{className:"key-help",children:[(0,t.jsxs)("span",{children:[(0,t.jsx)("b",{children:"[WASD]"}),"MOVE"]}),(0,t.jsxs)("span",{children:[(0,t.jsx)("b",{children:"[MOUSE]"}),"LOOK"]}),(0,t.jsxs)("span",{children:[(0,t.jsx)("b",{children:"[SHIFT]"}),"BOOST"]}),(0,t.jsxs)("span",{children:[(0,t.jsx)("b",{children:"[F]"}),"FORMULA"]})]}),(0,t.jsxs)("div",{className:"speed-readout",children:[(0,t.jsx)("small",{children:"SPEED"}),(0,t.jsx)("strong",{children:A.speed.toFixed(1)}),(0,t.jsx)("em",{children:"×"})]})]}),(0,t.jsxs)("div",{className:"touch-controls",children:[(0,t.jsx)(l,{inputRef:e}),(0,t.jsxs)("div",{className:"touch-look","aria-hidden":"true",children:["DRAG",(0,t.jsx)("br",{}),"TO LOOK"]})]}),(0,t.jsxs)("div",{className:`formula-editor ${j?"open":""}`,role:"dialog","aria-modal":"true","aria-label":"Custom distance field formula",children:[(0,t.jsxs)("div",{className:"editor-head",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("span",{children:"ƒ / FIELD COMPILER"}),(0,t.jsx)("small",{children:"GLSL EXPRESSION"})]}),(0,t.jsx)("button",{onClick:()=>b(!1),children:"CLOSE [ESC]"})]}),(0,t.jsxs)("p",{children:["Write a signed-distance expression. Available: ",(0,t.jsx)("code",{children:"p"})," (vec3), ",(0,t.jsx)("code",{children:"t"})," (time), ",(0,t.jsx)("code",{children:"sin cos abs length mod min max dot"}),"."]}),(0,t.jsxs)("div",{className:"code-area",children:[(0,t.jsxs)("span",{children:["float customField(vec3 p, float t) {",(0,t.jsx)("br",{}),"  return"]}),(0,t.jsx)("textarea",{value:y,onChange:e=>E(e.target.value),onKeyDown:e=>{(e.metaKey||e.ctrlKey)&&"Enter"===e.key&&(e.preventDefault(),F()),"Escape"===e.key&&b(!1)},spellCheck:!1}),(0,t.jsxs)("span",{children:[";",(0,t.jsx)("br",{}),"}"]})]}),T&&(0,t.jsxs)("div",{className:"formula-error",children:["COMPILER / ",T]}),(0,t.jsxs)("div",{className:"formula-presets",children:[(0,t.jsx)("span",{children:"RECOMMENDED"}),[{label:"SPHERE",expr:"length(p)-1.0"},{label:"ORGANIC",expr:"length(sin(p*1.4))-0.72"},{label:"WARP",expr:"abs(dot(sin(p),cos(p.zxy)))-0.18"}].map(e=>(0,t.jsxs)("button",{onClick:()=>E(e.expr),children:[(0,t.jsx)("b",{children:e.label}),(0,t.jsx)("code",{children:e.expr})]},e.label))]}),(0,t.jsxs)("div",{className:"editor-actions",children:[(0,t.jsx)("button",{onClick:()=>E("length(p)-1.0"),children:"RESET"}),(0,t.jsxs)("button",{className:"compile",onClick:F,children:["COMPILE FIELD ",(0,t.jsx)("span",{children:"⌘↵"})]})]})]})]})}])}]);