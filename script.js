const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const captions = [
  ["প্রথম Surprise 🌸","তোমার হাসিটা যেন আজকের দিনের সবচেয়ে সুন্দর decoration হয়ে থাকে। শুভ জন্মদিন, কুসুম! 💗"],
  ["দ্বিতীয় Surprise ✨","নতুন বছর, নতুন স্বপ্ন, নতুন গল্প। তোমার প্রতিটা আগামীকাল হোক আজকের চেয়েও সুন্দর।"],
  ["তৃতীয় Surprise 🦋","যে মানুষটা হাসতে জানে, সে অনেক কঠিন দিনও সুন্দর করে পার করে দিতে পারে। সবসময় হাসিখুশি থেকো।"],
  ["চতুর্থ Surprise 🌙","তোমার জীবনের আকাশে যত স্বপ্ন আছে, একদিন সবগুলোতেই যেন পূর্ণিমার আলো নামে।"],
  ["শেষ Candle Surprise 🎂","আজ শুধু birthday নয়, তোমার জীবনের নতুন একটা সুন্দর chapter-এর শুরু। Stay happy, stay amazing! 🌸"]
];

let candlesOut = 0;
let soundOn = true;
let audioCtx = null;
let unlocked = 0;
let gameBusy = false;

function beep(freq=600,duration=.12,type="sine",gain=.045){
  if(!soundOn) return;
  try{
    audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.type=type;o.frequency.value=freq;g.gain.value=gain;
    o.connect(g);g.connect(audioCtx.destination);
    const now=audioCtx.currentTime;
    g.gain.setValueAtTime(gain,now);g.gain.exponentialRampToValueAtTime(.001,now+duration);
    o.start(now);o.stop(now+duration);
  }catch(e){}
}
function melody(){
  [523,659,784,1047].forEach((n,i)=>setTimeout(()=>beep(n,.18,"triangle",.05),i*110));
}
function showToast(t){
  const el=$("#toast");el.textContent=t;el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"),2200);
}

function stars(){
  const wrap=$("#stars");
  for(let i=0;i<85;i++){
    const s=document.createElement("i");s.className="star";
    s.style.left=Math.random()*100+"%";s.style.top=Math.random()*100+"%";
    s.style.animationDelay=Math.random()*2+"s";wrap.appendChild(s);
  }
}
stars();

function showScreen(id){
  $$(".screen").forEach(s=>s.classList.remove("active"));
  $("#"+id).classList.add("active");
  window.scrollTo({top:0,behavior:"smooth"});
}

$("#startBtn").addEventListener("click",()=>{
  audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
  melody();showScreen("mainWish");launchConfetti(80);
});

$("#soundBtn").addEventListener("click",()=>{
  soundOn=!soundOn;$("#soundBtn").textContent=soundOn?"🔊":"🔇";
  if(soundOn) beep(700,.12);
});

const candleWrap=$("#candles");
for(let i=0;i<5;i++){
  const b=document.createElement("button");b.className="candle";b.innerHTML='<span class="flame"></span><span class="candle-body"></span>';
  b.title="মোমবাতি নিভাতে ট্যাপ করো";
  b.addEventListener("click",()=>blowCandle(b,i));
  candleWrap.appendChild(b);
}
$("#candleBtn").addEventListener("click",()=>{
  const next=$$(".candle:not(.off)")[0];
  if(next) blowCandle(next,$$(".candle").indexOf(next));
});

function blowCandle(el,index){
  if(el.classList.contains("off")) return;
  el.classList.add("off");candlesOut++;
  beep(220,.16,"sine",.06);setTimeout(()=>beep(120,.22,"sine",.04),60);
  launchConfetti(35);
  const [title,text]=captions[candlesOut-1];
  $("#surpriseTitle").textContent=title;$("#surpriseText").textContent=text;
  $("#surpriseBox").classList.remove("hidden");
  $("#progressText").textContent=`${candlesOut} / 5`;
  $("#progressBar").style.width=(candlesOut/5*100)+"%";
  showToast(`✨ ${title} unlocked!`);
  if(candlesOut===5){
    setTimeout(()=>showToast("🎉 সব candle complete! এখন game-ও খেলো!"),500);
  }
}

$("#nextTaskBtn").addEventListener("click",()=>{
  const tasks=$$(".task-card");tasks[(candlesOut||1)%tasks.length].click();
});

$$(".task-card").forEach(btn=>btn.addEventListener("click",()=>openGame(btn.dataset.task)));

function openGame(type){
  $("#gameModal").classList.add("open");
  if(type==="memory") memoryGame();
  if(type==="heart") heartGame();
  if(type==="lucky") luckyGame();
}
$("#closeGame").addEventListener("click",()=>$("#gameModal").classList.remove("open"));
$("#gameModal").addEventListener("click",e=>{if(e.target.id==="gameModal") $("#gameModal").classList.remove("open")});

function reward(title,text){
  unlocked++;
  launchConfetti(90);melody();
  $("#surpriseTitle").textContent=title;$("#surpriseText").textContent=text;
  $("#surpriseBox").classList.remove("hidden");
  $("#gameModal").classList.remove("open");
  showToast("🎁 নতুন surprise unlocked!");
  if(unlocked>=3 && candlesOut>=5){
    setTimeout(()=>showScreen("ending"),1800);
  }
}

function memoryGame(){
  const symbols=["🌸","🎂","💖","🎁","🌸","🎂","💖","🎁"];
  symbols.sort(()=>Math.random()-.5);
  $("#gameContent").innerHTML=`
    <p class="eyebrow">MISSION 01</p><h3>🧠 Memory Match</h3>
    <p>একই emoji-র জোড়া খুঁজে সবগুলো match করো।</p>
    <div class="memory-grid" id="memGrid"></div><div class="game-status" id="memStatus">0 / 4 matched</div>`;
  const grid=$("#memGrid");let first=null,lock=false,matched=0;
  symbols.forEach((x,i)=>{
    const b=document.createElement("button");b.className="mem";b.textContent="❔";
    b.addEventListener("click",()=>{
      if(lock||b.classList.contains("revealed"))return;
      b.textContent=x;b.classList.add("revealed");beep(500,.08);
      if(!first){first={b,x};return}
      if(first.x===x){
        matched++;beep(800,.12,"triangle");first=null;
        $("#memStatus").textContent=`${matched} / 4 matched`;
        if(matched===4)setTimeout(()=>reward("🧠 Memory Master!","তোমার জন্য bonus wish: তোমার স্মৃতিগুলো সবসময় সুন্দর মুহূর্তে ভরে থাকুক। 💖"),500);
      }else{
        lock=true;const old=first;first=null;
        setTimeout(()=>{old.b.textContent="❔";old.b.classList.remove("revealed");b.textContent="❔";b.classList.remove("revealed");lock=false},650);
      }
    });
    grid.appendChild(b);
  });
}

function heartGame(){
  $("#gameContent").innerHTML=`
    <p class="eyebrow">MISSION 02</p><h3>💗 Catch Hearts</h3>
    <p>১০ সেকেন্ডে অন্তত ৭টা heart ধরতে পারলে surprise unlock হবে!</p>
    <div class="game-status" id="heartStatus">Score: 0 • Time: 10</div>
    <div class="catch-area" id="catchArea"></div>`;
  const area=$("#catchArea");let score=0,time=10,done=false;
  const timer=setInterval(()=>{
    time--;$("#heartStatus").textContent=`Score: ${score} • Time: ${time}`;
    if(time<=0){clearInterval(timer);done=true;area.innerHTML="";if(score>=7)reward("💗 Heart Catcher!","তুমি surprise জিতে গেছো! তোমার প্রতিটা দিন যেন ভালোবাসা আর আনন্দে ভরে থাকে। 🌸");else showToast("আরেকবার চেষ্টা করো! ৭টা heart দরকার 💗");}
  },1000);
  const spawn=setInterval(()=>{
    if(done){clearInterval(spawn);return}
    const h=document.createElement("button");h.className="falling-heart";h.textContent=["💗","💖","💕"][Math.floor(Math.random()*3)];
    h.style.left=Math.random()*88+"%";h.addEventListener("click",()=>{if(done)return;score++;beep(750,.07,"sine",.04);h.remove();$("#heartStatus").textContent=`Score: ${score} • Time: ${time}`});
    area.appendChild(h);setTimeout(()=>h.remove(),3200);
  },520);
}

function luckyGame(){
  const prizes=[
    ["🌸","Soft Surprise","তোমার প্রতিটা সকাল হোক শান্ত আর সুন্দর।"],
    ["✨","Star Surprise","তোমার সব ভালো স্বপ্ন একদিন সত্যি হোক।"],
    ["💖","Heart Surprise","তোমার হাসি যেন কোনোদিন হারিয়ে না যায়।"]
  ];
  $("#gameContent").innerHTML=`
    <p class="eyebrow">MISSION 03</p><h3>🎁 Lucky Box</h3>
    <p>একটা box বেছে নাও। ভাগ্য কোন surprise রেখেছে?</p>
    <div class="lucky-grid">${prizes.map((p,i)=>`<button class="box-btn" data-i="${i}">🎁</button>`).join("")}</div>`;
  $$(".box-btn").forEach(b=>b.addEventListener("click",()=>{
    const p=prizes[+b.dataset.i];b.textContent=p[0];beep(900,.15,"triangle");
    reward(`🎁 ${p[1]}`,p[2]+" আজকের জন্য তোমার bonus wish: Happy Birthday, Kusum! 🎂");
  }));
}

function launchConfetti(count=70){
  const canvas=$("#confetti"),ctx=canvas.getContext("2d");
  canvas.width=innerWidth;canvas.height=innerHeight;
  const pieces=Array.from({length:count},()=>({
    x:innerWidth/2,y:innerHeight*.35+Math.random()*80,
    vx:(Math.random()-.5)*10,vy:Math.random()*-8-3,
    g:.22+Math.random()*.12,size:5+Math.random()*7,
    rot:Math.random()*6.28,vr:(Math.random()-.5)*.25,
    life:70+Math.random()*50
  }));
  let frame=0;
  (function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pieces.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.rot+=p.vr;p.life--;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);
      ctx.fillStyle=["#ff6fae","#8f7cff","#ffd66b","#6fe7ff","#fff"][Math.floor(Math.random()*5)];
      ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*.6);ctx.restore();
    });
    if(frame++<130)requestAnimationFrame(draw);else ctx.clearRect(0,0,canvas.width,canvas.height);
  })();
}

$("#replayBtn").addEventListener("click",()=>{
  candlesOut=0;unlocked=0;
  $$(".candle").forEach(c=>c.classList.remove("off"));
  $("#surpriseBox").classList.add("hidden");$("#progressText").textContent="0 / 5";$("#progressBar").style.width="0%";
  showScreen("opening");beep(500,.1);
});
