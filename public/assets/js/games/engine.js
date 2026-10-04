window.GameVerseGames = {};
window.GameVerseEngine = (() => {
  const register = config => window.GameVerseGames[config.id] = config;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const rand = (min, max) => Math.random() * (max - min) + min;

  function create(config, canvas, report) {
    const ctx = canvas.getContext("2d");
    let width, height, running = false, last = 0, score = 0, frame = 0;
    let objects = [], player = {}, board = [], selected = -1;
    const resize = () => {
      const ratio = Math.min(devicePixelRatio || 1, 2);
      width = canvas.clientWidth; height = canvas.clientHeight;
      canvas.width = width * ratio; canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const reset = () => {
      score = 0; frame = 0; objects = []; selected = -1;
      player = {x:width*.18,y:height*.65,w:38,h:48,vy:0,lane:1};
      if(config.type === "grid") board = Array(9).fill("");
      if(config.type === "sudoku") board = [5,3,0,0,7,0,0,0,0,6,0,0,1,9,5,0,0,0,0,9,8,0,0,0,0,6,0,8,0,0,0,6,0,0,0,3,4,0,0,8,0,3,0,0,1,7,0,0,0,2,0,0,0,6,0,6,0,0,0,0,2,8,0,0,0,0,4,1,9,0,0,5,0,0,0,0,8,0,0,7,9];
      report(score);
    };
    const start = () => { resize(); reset(); running = true; last = performance.now(); requestAnimationFrame(loop); };
    const stop = message => { running = false; report(score, message || "Run complete"); };
    const background = () => {
      const gradient = ctx.createLinearGradient(0,0,width,height);
      gradient.addColorStop(0,"#081326"); gradient.addColorStop(1,"#130c27");
      ctx.fillStyle=gradient; ctx.fillRect(0,0,width,height);
      ctx.strokeStyle="rgba(92,232,255,.08)"; ctx.lineWidth=1;
      for(let x=-height;x<width;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+height,height);ctx.stroke()}
    };
    const circle = (x,y,r,color) => {ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()};
    function arcade(dt) {
      if(frame % Math.max(28, 58-score/6) < 1) objects.push({x:rand(30,width-30),y:height+30,r:rand(18,32),vy:rand(-420,-300),vx:rand(-50,50),color:config.colors[Math.floor(rand(0,config.colors.length))]});
      objects.forEach(item=>{item.vy+=420*dt;item.x+=item.vx*dt;item.y+=item.vy*dt;circle(item.x,item.y,item.r,item.color);circle(item.x-6,item.y-7,item.r*.25,"rgba(255,255,255,.32)")});
      objects=objects.filter(item=>item.y<height+60&&!item.hit);
    }
    function flyer(dt) {
      player.vy+=640*dt;player.y+=player.vy*dt;player.y=clamp(player.y,0,height-34);
      if(frame%95<1) objects.push({x:width+80,gap:rand(130,height-170),w:52,passed:false});
      objects.forEach(o=>{o.x-=190*dt;ctx.fillStyle="#243454";ctx.fillRect(o.x,0,o.w,o.gap-65);ctx.fillRect(o.x,o.gap+65,o.w,height);ctx.strokeStyle=config.accent;ctx.strokeRect(o.x,0,o.w,o.gap-65);ctx.strokeRect(o.x,o.gap+65,o.w,height);if(!o.passed&&o.x<player.x){o.passed=true;score++;report(score)}if(player.x+30>o.x&&player.x<o.x+o.w&&(player.y<o.gap-65||player.y+30>o.gap+65))stop("Flight complete")});
      objects=objects.filter(o=>o.x>-100);circle(player.x+15,player.y+15,18,"#ffd84d");ctx.fillStyle="#fff";circle(player.x+21,player.y+10,4,"#fff");circle(player.x+22,player.y+10,2,"#10182c");
    }
    function runner(dt, racing=false) {
      const ground=height*.78;
      if(racing){const laneW=width/4;for(let i=1;i<4;i++){ctx.strokeStyle="rgba(255,255,255,.16)";ctx.setLineDash([24,20]);ctx.beginPath();ctx.moveTo(i*laneW,0);ctx.lineTo(i*laneW,height);ctx.stroke();ctx.setLineDash([])}player.x=(player.lane+.5)*laneW;player.y=height-86}
      else{ctx.strokeStyle=config.accent;ctx.beginPath();ctx.moveTo(0,ground);ctx.lineTo(width,ground);ctx.stroke();player.vy+=1100*dt;player.y+=player.vy*dt;if(player.y>ground-player.h){player.y=ground-player.h;player.vy=0}}
      if(frame%(racing?48:75)<1)objects.push(racing?{lane:Math.floor(rand(0,4)),y:-100}:{x:width+50,y:ground-50,w:38,h:50});
      objects.forEach(o=>{if(racing){o.y+=280*dt;const lw=width/4;ctx.fillStyle="#ff5b87";ctx.fillRect(o.lane*lw+lw*.28,o.y,lw*.44,62);if(o.lane===player.lane&&o.y+62>player.y&&o.y<player.y+58)stop("Race complete")}else{o.x-=300*dt;ctx.fillStyle="#ff5f9e";ctx.fillRect(o.x,o.y,o.w,o.h);if(player.x+player.w>o.x&&player.x<o.x+o.w&&player.y+player.h>o.y)stop("Run complete")}});
      objects=objects.filter(o=>racing?o.y<height+100:o.x>-80);ctx.fillStyle=config.accent;ctx.fillRect(player.x-(racing?22:0),player.y,racing?44:player.w,racing?58:player.h);score+=dt*10;report(Math.floor(score));
    }
    function targets(dt){
      if(!objects.length)objects=[{x:width*.72,y:height*.45,r:58,v:85}];const o=objects[0];o.y+=o.v*dt;if(o.y<90||o.y>height-90)o.v*=-1;[1,.72,.42,.17].forEach((n,i)=>circle(o.x,o.y,o.r*n,[config.accent,"#f3f6ff","#ffbf57","#17213a"][i]));
    }
    function drawGrid(sudoku=false){
      const size=Math.min(width,height)*.72, left=(width-size)/2, top=(height-size)/2, cell=size/(sudoku?9:3);
      ctx.fillStyle="rgba(255,255,255,.035)";ctx.fillRect(left,top,size,size);
      for(let i=0;i<=(sudoku?9:3);i++){ctx.strokeStyle=i%(sudoku?3:1)===0?config.accent:"rgba(255,255,255,.14)";ctx.lineWidth=i%(sudoku?3:1)===0?2:1;ctx.beginPath();ctx.moveTo(left+i*cell,top);ctx.lineTo(left+i*cell,top+size);ctx.moveTo(left,top+i*cell);ctx.lineTo(left+size,top+i*cell);ctx.stroke()}
      board.forEach((value,i)=>{if(!value)return;ctx.fillStyle="#f7f9ff";ctx.font=`700 ${cell*(sudoku?.42:.52)}px Arial`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(value,left+(i%(sudoku?9:3)+.5)*cell,top+(Math.floor(i/(sudoku?9:3))+.5)*cell)});
      if(selected>=0){ctx.strokeStyle="#ffbf57";ctx.lineWidth=3;ctx.strokeRect(left+(selected%(sudoku?9:3))*cell,top+Math.floor(selected/(sudoku?9:3))*cell,cell,cell)}
      return{size,left,top,cell};
    }
    function loop(now){
      if(!running)return;const dt=Math.min((now-last)/1000,.035);last=now;frame++;background();
      if(config.type==="arcade")arcade(dt);if(config.type==="flyer")flyer(dt);if(config.type==="runner")runner(dt);if(config.type==="racing")runner(dt,true);if(config.type==="target")targets(dt);if(config.type==="grid")drawGrid();if(config.type==="sudoku")drawGrid(true);
      requestAnimationFrame(loop);
    }
    const point = event => {const r=canvas.getBoundingClientRect();const t=event.touches?.[0]||event;return{x:(t.clientX-r.left)*width/r.width,y:(t.clientY-r.top)*height/r.height}};
    const act = event => {
      if(!running)return;event.preventDefault();const p=point(event);
      if(config.type==="arcade"){objects.forEach(o=>{if(Math.hypot(p.x-o.x,p.y-o.y)<o.r+16&&!o.hit){o.hit=true;score+=10;report(score)}})}
      if(config.type==="flyer")player.vy=-310;
      if(config.type==="runner"&&player.vy===0)player.vy=-510;
      if(config.type==="racing")player.lane=clamp(Math.floor(p.x/(width/4)),0,3);
      if(config.type==="target"){const o=objects[0],d=Math.hypot(p.x-o.x,p.y-o.y);if(d<o.r){score+=Math.max(1,Math.ceil((o.r-d)/12));report(score);o.y=rand(100,height-100)}}
      if(config.type==="grid"){const g=drawGrid(),col=Math.floor((p.x-g.left)/g.cell),row=Math.floor((p.y-g.top)/g.cell),i=row*3+col;if(col>=0&&col<3&&row>=0&&row<3&&!board[i]){board[i]="X";score++;report(score);const win=b=>[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]].some(a=>b[a[0]]&&a.every(j=>b[j]===b[a[0]]));if(win(board))return stop("You win");const open=board.map((v,j)=>v?"":j).filter(v=>v!=="");if(open.length){board[open[Math.floor(rand(0,open.length))]]="O";if(win(board))stop("CPU wins")}else stop("Draw")}}
      if(config.type==="sudoku"){const g=drawGrid(true),col=Math.floor((p.x-g.left)/g.cell),row=Math.floor((p.y-g.top)/g.cell);if(col>=0&&col<9&&row>=0&&row<9)selected=row*9+col}
    };
    const key = event => {if(!running)return;if(config.type==="racing"){if(event.key==="ArrowLeft")player.lane=clamp(player.lane-1,0,3);if(event.key==="ArrowRight")player.lane=clamp(player.lane+1,0,3)}else if(config.type==="sudoku"&&selected>=0&&/^[1-9]$/.test(event.key)){board[selected]=Number(event.key);score++;report(score)}else if(event.code==="Space"){event.preventDefault();if(config.type==="flyer")player.vy=-310;if(config.type==="runner"&&player.vy===0)player.vy=-510}};
    canvas.addEventListener("pointerdown",act);window.addEventListener("keydown",key);window.addEventListener("resize",resize);resize();
    return {start,stop};
  }
  return {register,create};
})();
