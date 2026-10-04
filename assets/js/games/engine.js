window.GameVerseGames = {};
window.GameVerseEngine = (() => {
  const register = config => window.GameVerseGames[config.id] = config;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const rand = (min, max) => Math.random() * (max - min) + min;
  const choice = list => list[Math.floor(Math.random() * list.length)];

  function create(config, canvas, report) {
    const ctx = canvas.getContext("2d", {alpha:true});
    let width = 0, height = 0, running = false, last = 0, elapsed = 0, frame = 0;
    let score = 0, misses = 0, selected = -1, pointerDown = false;
    let objects = [], particles = [], trail = [], board = [], fixed = new Set();
    let player = {};

    const resize = () => {
      const ratio = Math.min(devicePixelRatio || 1, 2);
      width = canvas.clientWidth; height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const reset = () => {
      score = 0; misses = 0; elapsed = 0; frame = 0; objects = []; particles = []; trail = []; selected = -1;
      player = {x:width*.2,y:height*.64,w:34,h:54,vy:0,lane:1,tilt:0};
      if(config.type === "grid") board = Array(9).fill("");
      if(config.type === "sudoku") {
        board = [5,3,0,0,7,0,0,0,0,6,0,0,1,9,5,0,0,0,0,9,8,0,0,0,0,6,0,8,0,0,0,6,0,0,0,3,4,0,0,8,0,3,0,0,1,7,0,0,0,2,0,0,0,6,0,6,0,0,0,0,2,8,0,0,0,0,4,1,9,0,0,5,0,0,0,0,8,0,0,7,9];
        fixed = new Set(board.map((v,i)=>v?i:-1).filter(i=>i>=0));
      }
      report(0);
    };
    const start = () => { resize(); reset(); running = true; last = performance.now(); requestAnimationFrame(loop); };
    const stop = message => { if(!running) return; running = false; report(Math.floor(score), message || "Run complete"); };

    function roundRect(x,y,w,h,r,fill,stroke) {
      ctx.beginPath(); ctx.roundRect(x,y,w,h,r);
      if(fill){ctx.fillStyle=fill;ctx.fill()} if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}
    }
    function circle(x,y,r,fill,stroke) {
      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);
      if(fill){ctx.fillStyle=fill;ctx.fill()} if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}
    }
    function glow(color, blur=18){ctx.shadowColor=color;ctx.shadowBlur=blur}
    function noGlow(){ctx.shadowBlur=0;ctx.shadowColor="transparent"}
    function background(theme=config.type) {
      ctx.clearRect(0,0,width,height);
      const g=ctx.createLinearGradient(0,0,width,height);
      const palettes={arcade:["rgba(4,18,35,.84)","rgba(32,7,35,.84)"],flyer:["rgba(18,45,78,.66)","rgba(21,16,57,.82)"],sudoku:["rgba(8,19,31,.9)","rgba(18,21,39,.88)"],grid:["rgba(5,16,33,.9)","rgba(30,7,41,.88)"],target:["rgba(4,28,31,.86)","rgba(26,18,13,.88)"],runner:["rgba(20,14,47,.82)","rgba(6,25,40,.88)"],racing:["rgba(4,18,30,.82)","rgba(25,7,31,.88)"]};
      const p=palettes[theme]||palettes.arcade;g.addColorStop(0,p[0]);g.addColorStop(1,p[1]);ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
      for(let i=0;i<36;i++){const x=(i*83+frame*.08*(i%3+1))%width,y=(i*47)%height;circle(x,y,i%5===0?1.4:.7,"rgba(255,255,255,.18)")}
    }
    function burst(x,y,color,count=14){for(let i=0;i<count;i++)particles.push({x,y,vx:rand(-190,190),vy:rand(-210,70),life:rand(.35,.75),size:rand(2,6),color})}
    function drawParticles(dt){
      particles.forEach(p=>{p.life-=dt;p.vy+=360*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;ctx.globalAlpha=clamp(p.life*2,0,1);circle(p.x,p.y,p.size,p.color)});ctx.globalAlpha=1;particles=particles.filter(p=>p.life>0);
    }
    function city(horizon=height*.62){
      const base=horizon;for(let i=0;i<14;i++){const w=55+(i%4)*16,h=80+(i*37)%170,x=i*(width/12)-30;ctx.fillStyle=`rgba(${15+i*2},25,55,.72)`;ctx.fillRect(x,base-h,w,h);for(let yy=base-h+18;yy<base-12;yy+=22){for(let xx=x+12;xx<x+w-8;xx+=18){ctx.fillStyle=(xx+yy+frame)%5<2?"rgba(92,232,255,.5)":"rgba(255,90,190,.16)";ctx.fillRect(xx,yy,4,7)}}}
    }
    function fruit(item){
      ctx.save();ctx.translate(item.x,item.y);ctx.rotate(item.rot);glow(item.color,18);
      ctx.font=`${item.r*2.15}px "Noto Color Emoji","Segoe UI Emoji",Arial`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(item.emoji,0,2);
      noGlow();ctx.strokeStyle="rgba(255,255,255,.5)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(-item.r*.1,-item.r*.08,item.r*.62,3.6,5);ctx.stroke();ctx.restore();
    }
    function arcade(dt){
      if(frame % Math.max(24,55-score/40)<1){const color=choice(config.colors);objects.push({x:rand(45,width-45),y:height+45,r:rand(23,34),vy:rand(-520,-390),vx:rand(-95,95),rot:0,spin:rand(-2.5,2.5),color,emoji:choice(["🍉","🍊","🥝","🍓","🍍"]),hit:false})}
      objects.forEach(o=>{o.vy+=600*dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.rot+=o.spin*dt;fruit(o)});
      objects.forEach(o=>{if(!o.hit&&o.y>height+38){o.hit=true;misses++;burst(o.x,height-5,"#ff5c83",8);if(misses>=3)stop("Kitchen closed")}});
      objects=objects.filter(o=>!o.hit&&o.y<height+70);drawParticles(dt);
      ctx.fillStyle="rgba(255,255,255,.68)";ctx.font="700 13px Arial";ctx.fillText(`MISSES ${misses}/3`,20,height-22);
      if(trail.length>1){ctx.lineCap="round";for(let i=1;i<trail.length;i++){ctx.strokeStyle=`rgba(92,232,255,${i/trail.length})`;ctx.lineWidth=2+i/2;ctx.beginPath();ctx.moveTo(trail[i-1].x,trail[i-1].y);ctx.lineTo(trail[i].x,trail[i].y);ctx.stroke()}trail=trail.slice(-10)}
    }
    function flyer(dt){
      city(height*.78);const sky=ctx.createLinearGradient(0,0,0,height*.75);sky.addColorStop(0,"rgba(87,220,255,.2)");sky.addColorStop(1,"transparent");ctx.fillStyle=sky;ctx.fillRect(0,0,width,height*.75);
      player.vy+=720*dt;player.y+=player.vy*dt;player.tilt=clamp(player.vy/500,-.45,.8);
      if(frame%92<1)objects.push({x:width+80,gap:rand(150,height-185),w:58,passed:false});
      objects.forEach(o=>{o.x-=210*dt;const grad=ctx.createLinearGradient(o.x,0,o.x+o.w,0);grad.addColorStop(0,"#172c52");grad.addColorStop(.5,"#39568a");grad.addColorStop(1,"#132545");ctx.fillStyle=grad;ctx.fillRect(o.x,0,o.w,o.gap-72);ctx.fillRect(o.x,o.gap+72,o.w,height);glow(config.accent,12);ctx.strokeStyle=config.accent;ctx.strokeRect(o.x,0,o.w,o.gap-72);ctx.strokeRect(o.x,o.gap+72,o.w,height);noGlow();if(!o.passed&&o.x<player.x){o.passed=true;score++;report(score)}if(player.x+31>o.x&&player.x-8<o.x+o.w&&(player.y-18<o.gap-72||player.y+18>o.gap+72))stop("Skyline run complete")});
      objects=objects.filter(o=>o.x>-100);ctx.save();ctx.translate(player.x,player.y);ctx.rotate(player.tilt);glow("#ffd84d",18);circle(0,0,19,"#ffd84d");noGlow();ctx.fillStyle="#ff9d36";ctx.beginPath();ctx.moveTo(16,-2);ctx.lineTo(31,4);ctx.lineTo(16,9);ctx.fill();ctx.fillStyle="#fff";circle(7,-7,5,"#fff");circle(9,-7,2,"#14203b");ctx.strokeStyle="#ffed91";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-8,2);ctx.lineTo(-25,10+Math.sin(frame*.3)*6);ctx.stroke();ctx.restore();
      if(player.y<15||player.y>height-18)stop("Skyline run complete");
    }
    function runner(dt){
      city(height*.7);const ground=height*.78;ctx.fillStyle="rgba(6,12,24,.9)";ctx.fillRect(0,ground,width,height-ground);glow(config.accent,10);ctx.strokeStyle=config.accent;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,ground);ctx.lineTo(width,ground);ctx.stroke();noGlow();for(let x=(frame*5)%80-80;x<width;x+=80){ctx.fillStyle="rgba(113,246,210,.32)";ctx.fillRect(x,ground+25,46,3)}
      player.vy+=1150*dt;player.y+=player.vy*dt;if(player.y>ground-player.h){player.y=ground-player.h;player.vy=0}
      if(frame%72<1)objects.push({x:width+50,y:ground-48,w:38,h:48});objects.forEach(o=>{o.x-=330*dt;glow("#ff5f9e",15);roundRect(o.x,o.y,o.w,o.h,5,"#ff5f9e");noGlow();if(player.x+player.w>o.x&&player.x<o.x+o.w&&player.y+player.h>o.y+4)stop("Rooftop run complete")});objects=objects.filter(o=>o.x>-80);
      ctx.save();ctx.translate(player.x+15,player.y+15);glow(config.accent,16);ctx.strokeStyle=config.accent;ctx.lineWidth=7;ctx.lineCap="round";circle(0,-8,8,"#eafcff");ctx.beginPath();ctx.moveTo(0,1);ctx.lineTo(-2,24);ctx.moveTo(-2,11);ctx.lineTo(14,2);ctx.moveTo(-2,23);ctx.lineTo(-15,38);ctx.moveTo(-2,23);ctx.lineTo(13,39);ctx.stroke();noGlow();ctx.restore();score+=dt*12;report(Math.floor(score));
    }
    function road(){
      const top=height*.14,bottom=height;ctx.fillStyle="rgba(7,12,22,.84)";ctx.beginPath();ctx.moveTo(width*.37,top);ctx.lineTo(width*.63,top);ctx.lineTo(width*.96,bottom);ctx.lineTo(width*.04,bottom);ctx.closePath();ctx.fill();
      glow(config.accent,12);ctx.strokeStyle=config.accent;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(width*.37,top);ctx.lineTo(width*.04,bottom);ctx.moveTo(width*.63,top);ctx.lineTo(width*.96,bottom);ctx.stroke();noGlow();
      for(let lane=1;lane<4;lane++){const tx=width*(.37+lane*.065),bx=width*(.04+lane*.23);ctx.strokeStyle="rgba(255,255,255,.25)";ctx.setLineDash([24,24]);ctx.lineDashOffset=frame*5;ctx.beginPath();ctx.moveTo(tx,top);ctx.lineTo(bx,bottom);ctx.stroke();ctx.setLineDash([])}
    }
    function vehicle(x,y,w,h,color,bike=false){ctx.save();ctx.translate(x,y);glow(color,18);if(bike){roundRect(-w*.2,-h*.45,w*.4,h*.65,8,color);circle(0,-h*.32,w*.2,"#c8f8ff");circle(0,h*.33,w*.22,"#0a0d18",color)}else{const g=ctx.createLinearGradient(-w/2,0,w/2,0);g.addColorStop(0,"#18253b");g.addColorStop(.5,color);g.addColorStop(1,"#172036");roundRect(-w/2,-h/2,w,h,10,g,color);roundRect(-w*.3,-h*.26,w*.6,h*.28,5,"#a8eeff");ctx.fillStyle="#ff638f";ctx.fillRect(-w*.33,h*.31,w*.18,4);ctx.fillRect(w*.15,h*.31,w*.18,4)}noGlow();ctx.restore()}
    function racing(dt){
      city(height*.38);road();const laneBottom=[.155,.385,.615,.845].map(v=>v*width);player.x=laneBottom[player.lane];player.y=height-88;
      if(frame%50<1)objects.push({lane:Math.floor(rand(0,4)),progress:0,speed:rand(.33,.48),color:choice(["#ff5c9e","#ffbd5c","#7b74ff","#64edca"])});
      objects.forEach(o=>{o.progress+=o.speed*dt;const ease=o.progress*o.progress;const x=width*(.402+o.lane*.065)+(laneBottom[o.lane]-width*(.402+o.lane*.065))*ease;const y=height*.14+(height*.92-height*.14)*ease;const scale=.25+ease*.78;vehicle(x,y,54*scale,82*scale,o.color,config.id==="bike-racing");if(o.lane===player.lane&&o.progress>.82&&o.progress<1.08)stop("Circuit run complete")});objects=objects.filter(o=>o.progress<1.18);vehicle(player.x,player.y,config.id==="bike-racing"?42:62,config.id==="bike-racing"?78:94,config.accent,config.id==="bike-racing");score+=dt*18;report(Math.floor(score));
    }
    function targets(dt){
      ctx.strokeStyle="rgba(92,232,255,.25)";ctx.lineWidth=2;for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(width*.5,height*.55,120+i*75,Math.PI,Math.PI*2);ctx.stroke()}
      if(!objects.length)objects=[{x:width*.72,y:height*.45,r:64,v:105}];const o=objects[0];o.y+=o.v*dt;if(o.y<100||o.y>height-100)o.v*=-1;[1,.76,.5,.24].forEach((n,i)=>{glow(i===3?"#ffbd5c":config.accent,12);circle(o.x,o.y,o.r*n,["#102d38","#e9faff",config.accent,"#ffbd5c"][i])});noGlow();ctx.strokeStyle="rgba(255,255,255,.38)";ctx.beginPath();ctx.moveTo(width*.16,height*.5);ctx.lineTo(width*.38,height*.5);ctx.stroke();ctx.fillStyle="#fff";ctx.font="700 13px Arial";ctx.fillText(`${Math.max(0,45-Math.floor(elapsed))} SEC`,20,height-22);if(elapsed>=45)stop("Range session complete")
    }
    function gridMetrics(sudoku=false){const maxH=sudoku?height*.68:height*.72;const size=Math.min(width*.78,maxH);return{size,left:(width-size)/2,top:sudoku?height*.08:(height-size)/2,cell:size/(sudoku?9:3)}}
    function drawGrid(sudoku=false){
      const g=gridMetrics(sudoku), count=sudoku?9:3;glow(config.accent,16);roundRect(g.left-6,g.top-6,g.size+12,g.size+12,12,"rgba(7,12,25,.72)","rgba(92,232,255,.36)");noGlow();
      if(selected>=0){ctx.fillStyle="rgba(255,189,92,.13)";ctx.fillRect(g.left+(selected%count)*g.cell,g.top+Math.floor(selected/count)*g.cell,g.cell,g.cell)}
      for(let i=0;i<=count;i++){ctx.strokeStyle=i%(sudoku?3:1)===0?config.accent:"rgba(255,255,255,.16)";ctx.lineWidth=i%(sudoku?3:1)===0?2:1;ctx.beginPath();ctx.moveTo(g.left+i*g.cell,g.top);ctx.lineTo(g.left+i*g.cell,g.top+g.size);ctx.moveTo(g.left,g.top+i*g.cell);ctx.lineTo(g.left+g.size,g.top+i*g.cell);ctx.stroke()}
      board.forEach((value,i)=>{if(!value)return;ctx.fillStyle=fixed.has(i)?"#eaf7ff":"#ffbd5c";ctx.font=`${fixed.has(i)?700:800} ${g.cell*(sudoku?.43:.54)}px Arial`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(value,g.left+(i%count+.5)*g.cell,g.top+(Math.floor(i/count)+.52)*g.cell)});
      if(sudoku){const y=g.top+g.size+24,bw=Math.min(48,(width-38)/9);for(let n=1;n<=9;n++){const x=(width-bw*9)/2+(n-1)*bw;roundRect(x+3,y,bw-6,42,7,"rgba(255,255,255,.06)","rgba(255,255,255,.14)");ctx.fillStyle="#fff";ctx.font="700 16px Arial";ctx.textAlign="center";ctx.fillText(n,x+bw/2,y+22)}}return g;
    }
    function hasConflict(index,value){const row=Math.floor(index/9),col=index%9;for(let i=0;i<9;i++){if(i!==col&&board[row*9+i]===value)return true;if(i!==row&&board[i*9+col]===value)return true}const br=Math.floor(row/3)*3,bc=Math.floor(col/3)*3;for(let r=br;r<br+3;r++)for(let c=bc;c<bc+3;c++){const i=r*9+c;if(i!==index&&board[i]===value)return true}return false}
    function loop(now){
      if(!running)return;const dt=Math.min((now-last)/1000,.033);last=now;elapsed+=dt;frame++;background();
      if(config.type==="arcade")arcade(dt);if(config.type==="flyer")flyer(dt);if(config.type==="runner")runner(dt);if(config.type==="racing")racing(dt);if(config.type==="target")targets(dt);if(config.type==="grid")drawGrid();if(config.type==="sudoku")drawGrid(true);
      requestAnimationFrame(loop);
    }
    const point=event=>{const r=canvas.getBoundingClientRect(),t=event.touches?.[0]||event;return{x:(t.clientX-r.left)*width/r.width,y:(t.clientY-r.top)*height/r.height}};
    function sliceAt(p){trail.push(p);objects.forEach(o=>{if(config.type==="arcade"&&!o.hit&&Math.hypot(p.x-o.x,p.y-o.y)<o.r+13){o.hit=true;score+=10;burst(o.x,o.y,o.color,20);report(score)}});objects=objects.filter(o=>!o.hit)}
    function act(event){
      if(!running)return;event.preventDefault();const p=point(event);
      if(config.type==="arcade")sliceAt(p);
      if(config.type==="flyer")player.vy=-330;
      if(config.type==="runner"&&player.vy===0)player.vy=-535;
      if(config.type==="racing")player.lane=clamp(Math.floor(p.x/(width/4)),0,3);
      if(config.type==="target"){const o=objects[0],d=Math.hypot(p.x-o.x,p.y-o.y);if(d<o.r){const hit=Math.max(1,Math.ceil((o.r-d)/10));score+=hit;report(score);burst(o.x,o.y,hit>4?"#ffbd5c":config.accent,16);o.y=rand(110,height-110)}}
      if(config.type==="grid"){const g=gridMetrics(),col=Math.floor((p.x-g.left)/g.cell),row=Math.floor((p.y-g.top)/g.cell),i=row*3+col;if(col>=0&&col<3&&row>=0&&row<3&&!board[i]){board[i]="X";score++;report(score);const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]],win=b=>lines.some(a=>b[a[0]]&&a.every(j=>b[j]===b[a[0]]));if(win(board))return stop("You win");const open=board.map((v,j)=>v?null:j).filter(v=>v!==null);if(open.length){let cpu=open.find(j=>{const b=[...board];b[j]="O";return win(b)})??open.find(j=>{const b=[...board];b[j]="X";return win(b)})??choice(open);board[cpu]="O";if(win(board))stop("CPU wins")}else stop("Draw")}}
      if(config.type==="sudoku"){const g=gridMetrics(true),col=Math.floor((p.x-g.left)/g.cell),row=Math.floor((p.y-g.top)/g.cell);if(col>=0&&col<9&&row>=0&&row<9&&!fixed.has(row*9+col))selected=row*9+col;const y=g.top+g.size+24;if(p.y>=y&&p.y<=y+42&&selected>=0){const bw=Math.min(48,(width-38)/9),n=Math.floor((p.x-(width-bw*9)/2)/bw)+1;if(n>=1&&n<=9)setSudoku(n)}}
    }
    function setSudoku(n){if(selected<0||fixed.has(selected))return;if(hasConflict(selected,n)){burst((selected%9+.5)*gridMetrics(true).cell+gridMetrics(true).left,(Math.floor(selected/9)+.5)*gridMetrics(true).cell+gridMetrics(true).top,"#ff5c83",10);return}board[selected]=n;score=board.filter(Boolean).length-fixed.size;report(score);if(board.every(Boolean))stop("Puzzle complete")}
    const key=event=>{if(!running)return;if(config.type==="racing"){if(event.key==="ArrowLeft")player.lane=clamp(player.lane-1,0,3);if(event.key==="ArrowRight")player.lane=clamp(player.lane+1,0,3)}else if(config.type==="sudoku"&&/^[1-9]$/.test(event.key))setSudoku(Number(event.key));else if(event.code==="Space"){event.preventDefault();if(config.type==="flyer")player.vy=-330;if(config.type==="runner"&&player.vy===0)player.vy=-535}};
    canvas.addEventListener("pointerdown",e=>{pointerDown=true;canvas.setPointerCapture?.(e.pointerId);act(e)});canvas.addEventListener("pointermove",e=>{if(pointerDown&&config.type==="arcade")sliceAt(point(e))});canvas.addEventListener("pointerup",()=>pointerDown=false);canvas.addEventListener("pointercancel",()=>pointerDown=false);window.addEventListener("keydown",key);window.addEventListener("resize",resize);resize();
    return {start,stop};
  }
  return {register,create};
})();
