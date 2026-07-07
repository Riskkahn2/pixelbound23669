'use strict';
/* ================= UTILS ================= */
function rnd(a,b){return a+Math.random()*(b-a)}
function ri(a,b){return Math.floor(rnd(a,b+1))}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function clamp(v,a,b){return v<a?a:v>b?b:v}
let _uid=1;
function uid(){return 'i'+(_uid++)+'x'+(Date.now()%100000)}
function hash(n){const s=Math.sin(n*127.1)*43758.5453;return s-Math.floor(s)}

/* ================= AUDIO ================= */
let actx=null;
function actxGet(){
  if(!actx)actx=new (window.AudioContext||window.webkitAudioContext)();
  if(actx.state==='suspended')actx.resume();
  return actx;
}
function beep(freq,dur,type,vol,slideTo){
  if(state&&state.muted)return;
  const ac=actxGet(), t0=ac.currentTime;
  const osc=ac.createOscillator(), gain=ac.createGain();
  osc.type=type||'square';
  osc.frequency.setValueAtTime(freq,t0);
  if(slideTo)osc.frequency.exponentialRampToValueAtTime(Math.max(1,slideTo),t0+dur);
  gain.gain.setValueAtTime(0,t0);
  gain.gain.linearRampToValueAtTime(vol||0.15,t0+0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  osc.connect(gain); gain.connect(ac.destination);
  osc.start(t0); osc.stop(t0+dur+0.02);
}
function beepSeq(notes,type,vol,dur){
  notes.forEach((f,i)=>setTimeout(()=>beep(f,dur||0.09,type||'square',vol||0.14),i*80));
}
const sfx={
  click(){beep(520,0.045,'square',0.10)},
  tab(){beep(380,0.05,'square',0.08)},
  hit(){beep(140,0.06,'square',0.14,90)},
  crit(){beep(90,0.11,'square',0.18,50); setTimeout(()=>beep(200,0.08,'square',0.14),40)},
  hurt(){beep(110,0.09,'sawtooth',0.14,60)},
  down(){beep(220,0.28,'sawtooth',0.17,55)},
  heal(){beep(520,0.08,'triangle',0.13,780)},
  gold(){beep(900,0.05,'square',0.09,1300)},
  chest(){beep(400,0.05,'square',0.1,700)},
  item(){beepSeq([660,880],'triangle',0.12)},
  levelup(){beepSeq([660,880,1046,1318],'square',0.14)},
  win(){beepSeq([660,880,1046,1318,1568],'square',0.15,0.12)},
  wipe(){beepSeq([300,240,180,120],'sawtooth',0.15,0.16)},
  retreat(){beep(300,0.12,'square',0.12,180)},
  trance(){
    beep(70,1.1,'sawtooth',0.16,18);
    setTimeout(()=>beep(90,0.8,'sawtooth',0.13,140),150);
    setTimeout(()=>beep(50,0.9,'sawtooth',0.14,10),300);
  },
  cheer(){beepSeq([440,550,660,880],'triangle',0.12,0.08)},
  power(){beepSeq([220,330,440],'square',0.15,0.1); setTimeout(()=>beep(660,0.15,'square',0.16),140)},
  resurrect(){beepSeq([260,390,520,780,1040],'triangle',0.16,0.14)},
};

/* ================= DATA ================= */
const CLASSES={
  fighter:{label:'Fighter',hp:44,atk:6,def:3,spd:0.8,crit:5, color:'#b0413e',order:0,
    pal:{cloth:'#6e2b27',skin:'#c9a07a'},hat:'helm',weapon:'sword',
    desc:'Front line. Steady blows, heavy armor.'},
  thief:{label:'Thief',hp:30,atk:5,def:1,spd:1.3,crit:25, color:'#5a9152',order:1,
    pal:{cloth:'#3f6b3a',skin:'#c9a07a'},hat:'hood',weapon:'dagger',
    desc:'Fast strikes at the weakest foe. High crit.'},
  healer:{label:'Healer',hp:28,atk:3,def:1,spd:0.7,crit:5, color:'#d8cfb0',order:2,
    pal:{cloth:'#cfc2a0',skin:'#c9a07a'},hat:'cowl',weapon:'holy',
    desc:'Mends the wounded. Earns XP by healing.'},
  mage:{label:'Mage',hp:24,atk:8,def:0,spd:0.5,crit:10, color:'#5a8fd8',order:3,
    pal:{cloth:'#3e4d85',skin:'#c9a07a'},hat:'cone',weapon:'staff',
    desc:'Slow, but scorches up to 3 enemies at once.'},
};
const NAMES=['Bram','Wilhelm','Isolde','Greta','Corvin','Maura','Aldric','Sable','Odo','Ren',
  'Petra','Lazlo','Vesna','Roderic','Ines','Talbot','Yara','Osric','Nell','Dagny',
  'Erlan','Sigrid','Fenwick','Ludo','Marda','Quill','Havel','Tamsin','Ulric','Zora'];
const MAX_HEROES=7;
const ALE_QUOTES=['Does nothing. Tastes great.','The bartender nods approvingly.',
  'Someone starts singing badly.','A hero in the corner cheers for no reason.',
  'The barkeep remembers your name now.','Nobody asked, but here it is anyway.'];

const BIOMES=[
 {name:'Gloomwood Forest',danger:'I',
  sky:['#0a0d10','#141d16'],far:'#101c14',mid:'#182619',ground:'#1e2b1f',gtop:'#2e4029',speck:'#141f15',
  farStyle:'pines',seedId:0,
  props:['pine','bush','stump'],
  enemies:[
   {name:'Wolf',kind:'beast',hp:16,atk:4,def:0,spd:0.9,xp:12,gold:[2,6],c:{a:'#6d5a43',b:'#4a3c2c',eye:'#d84a3a'}},
   {name:'Bandit',kind:'hum',hp:20,atk:5,def:1,spd:0.7,xp:15,gold:[5,11],c:{cloth:'#4c3d2c',skin:'#c9a07a',eye:'#d84a3a'},hat:'hood',weapon:'dagger'},
  ],
  boss:{name:'Elder Treant',kind:'big',hp:78,atk:8,def:2,spd:0.45,xp:70,gold:[28,48],size:1.25,boss:true,
   c:{a:'#4a3b24',b:'#2c4a26',eye:'#ffd23f'}}},
 {name:'Cragfall Peaks',danger:'II',
  sky:['#0a0b10','#191a20'],far:'#14151c',mid:'#1f2027',ground:'#25262c',gtop:'#3a3b42',speck:'#191a1f',
  farStyle:'peaks',seedId:1,
  props:['rock','boulder','bones'],
  enemies:[
   {name:'Goblin',kind:'hum',hp:19,atk:5,def:1,spd:0.9,xp:16,gold:[5,12],c:{cloth:'#4a4436',skin:'#6e8a4a',eye:'#ffd23f'},hat:null,weapon:'dagger'},
   {name:'Stone Golem',kind:'big',hp:36,atk:6,def:3,spd:0.4,xp:24,gold:[8,16],size:0.8,c:{a:'#5c5c64',b:'#3e3e46',eye:'#7fb2ff'}},
  ],
  boss:{name:'Ogre Warlord',kind:'big',hp:110,atk:11,def:2,spd:0.5,xp:95,gold:[40,70],size:1.3,boss:true,
   c:{a:'#5e6e3e',b:'#40492b',eye:'#d84a3a'}}},
 {name:'Palewind Tundra',danger:'III',
  sky:['#0a0d14','#1a2230'],far:'#161e2c',mid:'#232d3e',ground:'#2b3546',gtop:'#5a6a80',speck:'#20293a',
  farStyle:'peaks',seedId:2,
  props:['pinesnow','icerock','bones'],
  enemies:[
   {name:'Frost Wolf',kind:'beast',hp:26,atk:7,def:1,spd:1.0,xp:22,gold:[8,15],c:{a:'#aebdc9',b:'#7d8c9a',eye:'#7fd2ff'}},
   {name:'Ice Acolyte',kind:'hum',hp:30,atk:8,def:1,spd:0.65,xp:26,gold:[10,18],c:{cloth:'#3e5a85',skin:'#b8c4d0',eye:'#7fd2ff'},hat:'cowl',weapon:'staff'},
  ],
  boss:{name:'Ravenous Yeti',kind:'big',hp:150,atk:14,def:3,spd:0.55,xp:130,gold:[55,90],size:1.3,boss:true,
   c:{a:'#d8e2ea',b:'#9aa8b5',eye:'#7fd2ff'}}},
 {name:'Sunscar Wastes',danger:'IV',
  sky:['#120c0a','#2c1c12'],far:'#241811',mid:'#332217',ground:'#3c2a1a',gtop:'#5e452a',speck:'#2c1f13',
  farStyle:'dunes',seedId:3,
  props:['cactus','dune','bones'],
  enemies:[
   {name:'Scorpion',kind:'beast',hp:34,atk:9,def:2,spd:0.95,xp:30,gold:[12,22],c:{a:'#7a3c28',b:'#54281a',eye:'#ffd23f'}},
   {name:'Mummy',kind:'hum',hp:42,atk:10,def:2,spd:0.55,xp:34,gold:[14,26],c:{cloth:'#b3a68a',skin:'#8a7d64',eye:'#d84a3a'},hat:'cowl',weapon:null},
  ],
  boss:{name:'Sand Colossus',kind:'big',hp:210,atk:18,def:4,spd:0.5,xp:180,gold:[80,130],size:1.45,boss:true,
   c:{a:'#c2a05e',b:'#8a6e3c',eye:'#ffd23f'}}},
];
const NIGHTMARE={name:'The Nightmare',danger:'∞',endless:true,
 sky:['#050002','#170007'],far:'#0d0004',mid:'#220009',ground:'#26000b',gtop:'#4a0016',speck:'#1a0006',
 farStyle:'spikes',seedId:9,
 props:['bones','stump','rock'],
 enemies:[
  {name:'Night Stalker',kind:'hum',hp:22,atk:9,def:2,spd:1.0,xp:40,gold:[10,18],c:{cloth:'#150a18',skin:'#4a2d55',eye:'#ff2a4a'},hat:'hood',weapon:'dagger'},
  {name:'Abyss Hound',kind:'beast',hp:26,atk:10,def:1,spd:1.15,xp:42,gold:[10,20],c:{a:'#100812',b:'#1e0e22',eye:'#ff2a4a'}},
  {name:'Wraith',kind:'hum',hp:20,atk:11,def:1,spd:0.9,xp:44,gold:[11,19],c:{cloth:'#241030',skin:'#8a7aa0',eye:'#7fd2ff'},hat:'cowl',weapon:'staff'},
  {name:'Voidling',kind:'big',hp:46,atk:13,def:3,spd:0.55,xp:60,gold:[16,28],size:1.05,c:{a:'#170a1c',b:'#2a1330',eye:'#ff2a4a'}},
 ],
 boss:null};
const NIGHTMARE_BASE_DIFF=4.2;
const MIRROR={name:'The Mirror',danger:'§',mirror:true,
 sky:['#04060a','#0e1420'],far:'#0a0f18',mid:'#141c2a',ground:'#182233',gtop:'#3a4a66',speck:'#101722',
 farStyle:'peaks',seedId:11,
 props:['icerock','rock','bones'],
 enemies:[
  {name:'Broken Reflection',kind:'hum',hp:30,atk:11,def:2,spd:1.05,xp:55,gold:[15,26],c:{cloth:'#28344a',skin:'#c9d6e8',eye:'#8fe0ff'},hat:'hood',weapon:'dagger'},
  {name:'Warped Echo',kind:'beast',hp:34,atk:12,def:1,spd:1.2,xp:58,gold:[15,28],c:{a:'#1c2436',b:'#2e3c56',eye:'#8fe0ff'}},
  {name:'Twisted Shade',kind:'hum',hp:28,atk:13,def:1,spd:0.9,xp:60,gold:[16,29],c:{cloth:'#3a2848',skin:'#c9d6e8',eye:'#ff8fd8'},hat:'cowl',weapon:'staff'},
 ],
 boss:{name:'Your Reflection',kind:'hum',hp:260,atk:20,def:5,spd:0.65,xp:260,gold:[120,190],boss:true,
  c:{cloth:'#4a5a80',skin:'#e8eef8',eye:'#ffffff'},hat:'helm',weapon:'sword'}};
const MIRROR_DIFF=7.5;
const MIRROR_TIER=5;
function mirrorUnlocked(){
  return state.completions.every(c=>c>=5)&&(state.nightmareBestDistance||0)>=50000;
}
const RARITY=[
 {pre:['Worn ','Plain ',''],mult:1,label:'Common',cls:'r0',col:'#b3a894'},
 {pre:['Fine ','Tempered ','Keen '],mult:1.6,label:'Rare',cls:'r1',col:'#5a8fd8'},
 {pre:['Runed ','Dread ','Ancient '],mult:2.4,label:'Epic',cls:'r2',col:'#b06ad8'},
];
const WNAMES=['Sword','Axe','Mace','Dagger','Spear','Blade'];
const ANAMES=['Leather Vest','Chainmail','Brigandine','Warcloak','Plate'];
const TNAMES=['Ring','Amulet','Charm','Talisman','Idol'];

/* ================= STATE ================= */
let state=null, mission=null, gameMode='hub', currentTab='party';

function newHero(cls,lvl){
  lvl=lvl||1;
  return {id:uid(),name:pick(NAMES),cls,lvl,xp:0,pts:(lvl-1)*3,
    bonus:{hp:0,atk:0,def:0,spd:0},
    equip:{weapon:null,armor:null,trinket:null},ko:false};
}
const HERO_TIERS=[
  {min:30,title:'Legendary',cls:'tier-legend',hex:'#b06ad8'},
  {min:20,title:'Elite',cls:'tier-elite',hex:'#d8a24a'},
  {min:10,title:'Veteran',cls:'tier-vet',hex:'#5a8fd8'},
  {min:0,title:null,cls:'',hex:null},
];
function heroTier(lvl){return HERO_TIERS.find(t=>lvl>=t.min)}
function partyAvgLevel(){
  if(!state.heroes.length)return 1;
  return Math.round(state.heroes.reduce((a,h)=>a+h.lvl,0)/state.heroes.length);
}
function reviveCost(h){return 60+h.lvl*25}
function stats(h){
  const c=CLASSES[h.cls];
  let hp=c.hp+h.bonus.hp+(h.lvl-1)*4,
      atk=c.atk+h.bonus.atk+Math.floor((h.lvl-1)/2),
      def=c.def+h.bonus.def, crit=c.crit, spdP=h.bonus.spd;
  for(const s of ['weapon','armor','trinket']){
    const it=h.equip[s]; if(!it)continue; const t=it.stats;
    hp+=t.hp||0; atk+=t.atk||0; def+=t.def||0; crit+=t.crit||0; spdP+=t.spd||0;
  }
  return {hp,atk,def,crit,spd:c.spd*(1+spdP/100)};
}
function xpNeed(l){return 60+l*60}
function giveXp(h,amt,r){
  h.xp+=Math.round(amt);
  while(h.xp>=xpNeed(h.lvl)){
    h.xp-=xpNeed(h.lvl); h.lvl++; h.pts+=3;
    if(mission&&r){flo('LEVEL UP!',r.x,GROUND_Y-58,'#ffd23f');sfx.levelup();}
  }
}
function makeItem(tier,slot){
  slot=slot||pick(['weapon','armor','trinket']);
  const roll=Math.random(), rar=roll<0.6?0:roll<0.88?1:2, R=RARITY[rar];
  const st={}; let base='';
  if(slot==='weapon'){
    st.atk=Math.max(1,Math.round((1+tier*1.4+ri(0,2))*R.mult));
    if(rar>0)st.crit=ri(3,7)*rar; base=pick(WNAMES);
  }else if(slot==='armor'){
    st.hp=Math.round((4+tier*4)*R.mult);
    st.def=Math.round((tier*0.7+ri(0,1))*R.mult); base=pick(ANAMES);
  }else{
    const opts=[['crit',ri(4,9)],['spd',ri(6,13)],['atk',ri(1,2)+Math.floor(tier/2)],['hp',ri(4,10)]];
    const a=opts.splice(ri(0,opts.length-1),1)[0], b=pick(opts);
    st[a[0]]=Math.round(a[1]*R.mult);
    st[b[0]]=(st[b[0]]||0)+Math.round(b[1]*R.mult); base=pick(TNAMES);
  }
  const sum=(st.atk||0)*4+(st.def||0)*4+(st.hp||0)+(st.crit||0)+(st.spd||0);
  return {id:uid(),slot,name:pick(R.pre)+base,rar,stats:st,
    value:Math.max(4,Math.round((tier*6+sum)*(0.6+0.4*R.mult)))};
}
function recruitCost(h){
  const lvl=h?h.lvl:partyAvgLevel();
  return 40+(state.unlocked-1)*35+state.heroes.length*12+(lvl-1)*20;
}
function refreshOffers(){
  const baseLvl=partyAvgLevel();
  state.recruits=[0,1,2].map(()=>newHero(pick(Object.keys(CLASSES)),Math.max(1,baseLvl+ri(-2,2))));
  state.shop=[0,1,2].map(()=>makeItem(state.unlocked));
}
function newGame(){
  state={gold:150,potions:2,superPotions:0,powerPotions:0,resPotions:0,recruiterFavors:0,alesBought:0,
    heroes:[newHero('fighter'),newHero('healer')],
    stash:[makeItem(1,'weapon')],unlocked:1,completions:[0,0,0,0],nightmareBestDistance:0,
    recruits:[],shop:[],speed:1,paused:false};
  refreshOffers();
}
function effectiveRecruitCost(h){
  const base=recruitCost(h);
  return state.recruiterFavors>0?Math.round(base*0.5):base;
}
async function save(){
  try{ if(window.storage) await window.storage.set('pixelbound_save',JSON.stringify(state)); }
  catch(e){}
}
async function loadSave(){
  try{ if(window.storage){
    const r=await window.storage.get('pixelbound_save');
    if(r&&r.value){state=JSON.parse(r.value);return true}
  }}catch(e){}
  return false;
}

/* ================= MISSION ================= */
const STAGE_W=960,STAGE_H=420,GROUND_Y=352;

function genProps(len,seed){
  const arr=[]; let x=200;
  while(x<len+STAGE_W){
    const h1=hash(x*0.13+seed);
    if(h1<0.75)arr.push({x,t:h1<0.28?0:h1<0.55?1:2});
    x+=90+Math.floor(hash(x+seed)*110);
  }
  return arr;
}
function spawnEnemy(tp,diff,x){
  return {tp,x,hp:Math.round(tp.hp*diff),maxHp:Math.round(tp.hp*diff),
    atk:tp.atk*diff,def:tp.def+Math.floor(Math.max(0,diff-1)),
    cd:rnd(0.6,1.6),atkT:0,dead:false,bob:Math.random()*6};
}
function nightmareDiff(px){return NIGHTMARE_BASE_DIFF+px/2500}
function nightmareTier(px){return BIOMES.length-1+px/3000}
function extendNightmare(){
  const m=mission;
  m.diff=nightmareDiff(m.px)*(m.trance?1.5:1);
  m.tier=nightmareTier(m.px);
  const aheadX=m.px+STAGE_W*2.5;
  while(m.nextSpawnX<aheadX){
    const gx=m.nextSpawnX;
    const cnt=ri(2,5);
    const es=[]; for(let j=0;j<cnt;j++)es.push(spawnEnemy(pick(m.B.enemies),m.diff,gx+j*28));
    m.groups.push({x:gx,active:false,enemies:es});
    m.nextSpawnX+=220+ri(-30,70);
  }
  while(m.nextChestX<aheadX){
    m.chests.push({x:m.nextChestX,open:false});
    m.nextChestX+=850+ri(-100,250);
  }
  while(m.nextShardX<aheadX){
    m.shards.push({x:m.nextShardX,taken:false});
    m.nextShardX+=2200+ri(-400,900);
  }
  while(m.nextPropX<aheadX){
    const h1=hash(m.nextPropX*0.13+m.propSeed);
    if(h1<0.75)m.props.push({x:m.nextPropX,t:h1<0.28?0:h1<0.55?1:2});
    m.nextPropX+=90+Math.floor(hash(m.nextPropX+m.propSeed)*110);
  }
  const cutoff=m.px-500;
  if(m.groups.length>40)m.groups=m.groups.filter(g=>g.x>cutoff);
  if(m.chests.length>20)m.chests=m.chests.filter(c=>c.x>cutoff);
  if(m.shards.length>10)m.shards=m.shards.filter(s=>s.x>cutoff);
  if(m.props.length>200)m.props=m.props.filter(p=>p.x>cutoff);
}
function tranceParticles(){
  const arr=[];
  for(let i=0;i<80;i++){
    arr.push({x:Math.random()*STAGE_W,y:Math.random()*STAGE_H,
      vx:rnd(-60,60),vy:rnd(140,300),len:ri(8,20),hue:ri(0,360)});
  }
  return arr;
}
function triggerTrance(shard){
  shard.taken=true;
  mission.trance={t:0,dur:13,particles:tranceParticles()};
  flo('NIGHTMARE TRANCE',shard.x,GROUND_Y-90,'#ff2a4a');
  sfx.trance();
  byId('stage').classList.add('trance');
}
function lootMult(){return mission.trance?2.5:1}
function enemyDmgMult(){return mission.trance?1.5:1}
function heroDmgMult(){
  let m=mission.trance?1.5:1;
  if(mission.buff)m*=mission.buff.mult;
  return m;
}
function startMission(bi){
  const eligible=state.heroes.filter(h=>!h.ko);
  if(!eligible.length)return;
  const endless=bi==='nightmare';
  const mirror=bi==='mirror';
  const B=endless?NIGHTMARE:mirror?MIRROR:BIOMES[bi];
  const tierNum=endless?BIOMES.length-1:mirror?MIRROR_TIER:bi;
  const diff=endless?NIGHTMARE_BASE_DIFF:mirror?MIRROR_DIFF:1+bi*0.65+Math.min(state.completions[bi],12)*0.06;
  const len=endless?Infinity:mirror?4200:3000+bi*400;
  const seed=endless||mirror?B.seedId*777:bi*777;
  const party=eligible.map(h=>{const st=stats(h);
    return {h,st,hp:st.hp,cd:rnd(0.3,1.2),atkT:0,x:0,bob:Math.random()*6,healFx:0}});
  party.sort((a,b)=>CLASSES[a.h.cls].order-CLASSES[b.h.cls].order);
  mission={bi,B,diff,tier:tierNum,len,groups:[],chests:[],shards:[],party,px:150,cam:0,state:'walk',
    loot:{gold:0,items:[]},fx:[],flo:[],t:0,winT:0,over:null,endless,mirror,props:[],trance:null,buff:null,
    nextSpawnX:560,nextChestX:900,nextShardX:1800,nextPropX:200,propSeed:seed};
  if(endless){
    extendNightmare();
  }else{
    const n=5+ri(0,2);
    for(let i=0;i<n;i++){
      const gx=560+((len-1100)/n)*i+ri(-50,50);
      const cnt=ri(1,Math.min(4,2+Math.floor(tierNum/2)));
      const es=[]; for(let j=0;j<cnt;j++)es.push(spawnEnemy(pick(B.enemies),diff,gx+j*28));
      mission.groups.push({x:gx,active:false,enemies:es});
    }
    const bx=len-240;
    const bes=[spawnEnemy(B.boss,diff,bx)];
    if(tierNum>=2)bes.push(spawnEnemy(pick(B.enemies),diff,bx+50));
    mission.groups.push({x:bx,active:false,enemies:bes,boss:true});
    mission.chests=[0,1].map(()=>({x:800+ri(0,len-1700),open:false}));
    mission.props=genProps(len,seed);
  }
  gameMode='mission'; state.paused=false; updateUIVis();
}
function flo(txt,x,y,c){ if(mission)mission.flo.push({txt,x,y,c,t:1.3}); }
function aliveParty(){return mission.party.filter(r=>!r.h.ko)}

function heroAct(r,act){
  const cls=r.h.cls;
  if(cls==='healer'){
    const inj=aliveParty().filter(o=>o.hp<o.st.hp*0.82)
      .sort((a,b)=>a.hp/a.st.hp-b.hp/b.st.hp)[0];
    if(inj){
      const amt=Math.round(5+r.h.lvl*1.5+r.st.atk);
      inj.hp=Math.min(inj.st.hp,inj.hp+amt);
      inj.healFx=0.5;
      flo('+'+amt,inj.x,GROUND_Y-52,'#7fd87f');
      sfx.heal();
      giveXp(r.h,2,r); r.atkT=0.18; return;
    }
  }
  if(!act.length)return;
  let targets;
  if(cls==='mage')targets=act.slice(0,3);
  else if(cls==='thief')targets=[act.reduce((m,e)=>e.hp<m.hp?e:m,act[0])];
  else targets=[act[0]];
  r.atkT=0.18;
  for(const e of targets){
    let d=r.st.atk*(cls==='mage'&&targets.length>1?0.75:1)*rnd(0.85,1.15)*heroDmgMult();
    const crit=Math.random()*100<r.st.crit;
    if(crit)d*=2;
    d=Math.max(1,Math.round(d-e.def*0.5));
    e.hp-=d;
    flo(crit?d+'!':''+d,e.x,GROUND_Y-48,crit?'#ffd23f':'#f0e6d2');
    crit?sfx.crit():sfx.hit();
    if(cls==='mage')mission.fx.push({x1:r.x+8,y1:GROUND_Y-26,x2:e.x,y2:GROUND_Y-20,t:0.16,c:'#7fb2ff'});
    if(e.hp<=0)killEnemy(e,r);
  }
}
function useHealPotion(amount){
  const tgt=aliveParty().sort((a,b)=>a.hp/a.st.hp-b.hp/b.st.hp)[0];
  if(!tgt)return false;
  tgt.hp=Math.min(tgt.st.hp,tgt.hp+amount);
  tgt.healFx=0.5;
  flo('+'+amount,tgt.x,GROUND_Y-52,'#7fd87f');
  return true;
}
function awardGold(amount,x,y){
  amount=Math.round(amount*lootMult());
  mission.loot.gold+=amount;
  flo('+'+amount+'g',x,y,'#d8a24a');
  sfx.gold();
}
function maybeDropLoot(chance,x,y,xpEach){
  if(Math.random()>=chance*(mission.trance?2:1))return;
  const it=makeItem(mission.tier+1);
  mission.loot.items.push(it);
  flo(it.name+'!',x,y,RARITY[it.rar].col);
  sfx.item();
  aliveParty().forEach(a=>giveXp(a.h,Math.round(xpEach*lootMult()),a));
}
function killEnemy(e,by){
  e.dead=true;
  const tp=e.tp;
  awardGold(Math.round(ri(tp.gold[0],tp.gold[1])*(1+mission.tier*0.4)),e.x,GROUND_Y-64);
  const al=aliveParty();
  const each=Math.max(2,Math.round(tp.xp*mission.diff/Math.max(1,al.length)*lootMult()));
  al.forEach(a=>giveXp(a.h,each,a));
  maybeDropLoot(tp.boss?1:0.16,e.x,GROUND_Y-80,4);
}
function hurtHero(r,rawAtk){
  const d=Math.max(1,Math.round(rawAtk*rnd(0.85,1.15)-r.st.def*0.6));
  r.hp-=d;
  flo(''+d,r.x,GROUND_Y-52,'#e06a5a');
  if(r.hp<=0){r.hp=0;r.h.ko=true;flo('DOWN!',r.x,GROUND_Y-66,'#8c2f2f');sfx.down();updateRes();}
  else sfx.hurt();
}
function openChest(c){
  c.open=true;
  sfx.chest();
  awardGold(ri(15,35)*(mission.tier+1),c.x,GROUND_Y-40);
  maybeDropLoot(0.65,c.x,GROUND_Y-56,5);
}
function updateMission(dt){
  mission.t+=dt;
  mission.flo.forEach(f=>{f.t-=dt;f.y-=22*dt});
  mission.flo=mission.flo.filter(f=>f.t>0);
  mission.fx.forEach(f=>f.t-=dt); mission.fx=mission.fx.filter(f=>f.t>0);
  mission.party.forEach(r=>{r.atkT=Math.max(0,r.atkT-dt);r.healFx=Math.max(0,(r.healFx||0)-dt)});
  if(mission.buff){
    mission.buff.t+=dt;
    if(mission.buff.t>=mission.buff.dur)mission.buff=null;
  }
  if(mission.trance){
    mission.trance.t+=dt;
    for(const p of mission.trance.particles){
      p.vx+=rnd(-140,140)*dt; p.vx=clamp(p.vx,-140,140);
      p.x+=p.vx*dt; p.y+=p.vy*dt;
      p.hue=(p.hue+dt*260)%360;
      if(p.y>STAGE_H+20||p.x<-20||p.x>STAGE_W+20){
        p.x=Math.random()*STAGE_W; p.y=-10; p.vx=rnd(-60,60); p.vy=rnd(140,300);
      }
    }
    if(mission.trance.t>=mission.trance.dur){
      mission.trance=null;
      byId('stage').classList.remove('trance');
    }
  }
  if(mission.over)return;
  const al=aliveParty();
  if(!al.length){finishMission('wipe');return}
  al.forEach((r,i)=>{r.x=mission.px-i*34});
  if(mission.endless)extendNightmare();
  if(mission.shards)for(const s of mission.shards)if(!s.taken&&mission.px>s.x-16)triggerTrance(s);
  for(const g of mission.groups)if(!g.active&&g.x-mission.px<340)g.active=true;
  const act=[];
  for(const g of mission.groups)if(g.active)for(const e of g.enemies)if(!e.dead)act.push(e);
  act.sort((a,b)=>a.x-b.x);
  act.forEach((e,i)=>{
    e.atkT=Math.max(0,e.atkT-dt);
    const slot=mission.px+58+i*30;
    if(e.x>slot)e.x=Math.max(slot,e.x-62*dt);
    else if(e.x<slot)e.x=Math.min(slot,e.x+40*dt);
  });
  const engaged=act.length>0&&act[0].x-mission.px<74;
  // win check: boss group cleared (never applies to the endless Nightmare)
  let bossDead=true;
  if(!mission.endless){
    const bg=mission.groups[mission.groups.length-1];
    bossDead=bg.enemies.every(e=>e.dead);
    if(bossDead&&!act.length){
      mission.winT+=dt;
      if(mission.winT>1.1){finishMission('win');return}
    }
  }
  if(engaged){
    mission.state='fight';
    for(const r of al){
      r.cd-=dt;
      if(r.cd<=0){heroAct(r,act);r.cd=1/r.st.spd;}
    }
    act.forEach((e,i)=>{
      const slot=mission.px+58+i*30;
      if(Math.abs(e.x-slot)<9&&i<5){
        e.cd-=dt;
        if(e.cd<=0){
          const tgt=(e.tp.kind==='hum'&&Math.random()<0.3)?pick(aliveParty()):aliveParty()[0];
          if(tgt)hurtHero(tgt,e.atk*enemyDmgMult());
          e.cd=1/e.tp.spd; e.atkT=0.2;
          if(!aliveParty().length){finishMission('wipe');return}
        }
      }
    });
  }else{
    mission.state='walk';
    if(!bossDead)mission.px=Math.min(mission.px+62*dt,mission.len-180);
    else mission.px+=62*dt;
    // healer can mend while marching
    for(const r of al){
      if(r.h.cls!=='healer')continue;
      r.cd-=dt;
      if(r.cd<=0){heroAct(r,[]);r.cd=1/r.st.spd;}
    }
  }
  for(const c of mission.chests)if(!c.open&&mission.px>c.x-16)openChest(c);
}
function finishMission(res){
  if(mission.over)return;
  mission.trance=null;
  byId('stage').classList.remove('trance');
  if(mission.endless)state.nightmareBestDistance=Math.max(state.nightmareBestDistance||0,mission.px);
  ({win:sfx.win,wipe:sfx.wipe,retreat:sfx.retreat})[res]();
  let g=mission.loot.gold, items=mission.loot.items.slice();
  if(res==='win'){
    g+=Math.round(60*(mission.tier+1));
    items.push(makeItem(mission.tier+1));
    mission.party.forEach(r=>{if(!r.h.ko)giveXp(r.h,30+mission.tier*12)});
    if(!mission.endless&&!mission.mirror){
      state.completions[mission.bi]++;
      if(mission.bi+1===state.unlocked&&state.unlocked<BIOMES.length)state.unlocked++;
    }
  }
  if(res==='wipe'){
    g=Math.round(g*0.5);
    items=items.filter((_,i)=>i%2===0);
  }
  state.gold+=g; state.stash.push(...items);
  mission.over={res,g,items};
  showSummary();
}

/* ================= RENDERING ================= */
const canvasEl=document.getElementById('cv'), ctx=canvasEl.getContext('2d');
ctx.imageSmoothingEnabled=false;

function drawRect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}

// cached vignette
const vig=document.createElement('canvas');vig.width=STAGE_W;vig.height=STAGE_H;
(function(){
  const g=vig.getContext('2d');
  const rg=g.createRadialGradient(STAGE_W/2,STAGE_H/2-30,150,STAGE_W/2,STAGE_H/2,620);
  rg.addColorStop(0,'rgba(0,0,0,0)');
  rg.addColorStop(0.6,'rgba(5,3,6,0.28)');
  rg.addColorStop(1,'rgba(5,3,6,0.85)');
  g.fillStyle=rg;g.fillRect(0,0,STAGE_W,STAGE_H);
})();

function glow(x,y,rad,col,a){
  const g=ctx.createRadialGradient(x,y,2,x,y,rad);
  g.addColorStop(0,col.replace('A',a));
  g.addColorStop(1,col.replace('A','0'));
  ctx.fillStyle=g;ctx.fillRect(x-rad,y-rad,rad*2,rad*2);
}
const AMBER='rgba(216,150,60,A)', BLUEG='rgba(120,170,255,A)';

/* ---- sprites ---- */
function drawHumanoid(x,gy,dir,pal,o){
  o=o||{};
  const cloth=pal.cloth, skin=pal.skin||'#c9a07a';
  const dark='rgba(0,0,0,0.25)';
  if(o.ko){ // lying down
    drawRect(x-12,gy-9,24,6,cloth); drawRect(x+(dir>0?9:-18),gy-9,9,6,skin);
    drawRect(x-12,gy-3,24,3,'rgba(0,0,0,0.3)');
    return;
  }
  const ph=o.phase!=null?Math.sin(o.phase):0;
  const lunge=o.atkT>0?dir*4:0;
  const bx=x+lunge;
  // legs
  drawRect(bx-5+ph*2,gy-9,4,9,'#2a2320');
  drawRect(bx+1-ph*2,gy-9,4,9,'#2a2320');
  // torso
  drawRect(bx-6,gy-21,13,12,cloth);
  drawRect(bx-6,gy-12,13,3,'rgba(0,0,0,0.3)'); // belt
  if(o.armor)drawRect(bx-6,gy-21,13,5,'#8f8f96');
  // back arm
  drawRect(bx-dir*7,gy-20,4,9,cloth);
  // head
  drawRect(bx-4,gy-30,10,9,skin);
  drawRect(bx+dir*2,gy-28,2,2,'#1a1412'); // eye
  // hats
  if(o.hat==='helm'){drawRect(bx-5,gy-31,12,5,'#8f8f96');drawRect(bx+dir*4,gy-27,2,4,'#8f8f96');drawRect(bx-1,gy-35,3,5,'#a23a30');}
  else if(o.hat==='hood'){drawRect(bx-5,gy-31,12,4,cloth);drawRect(bx-5,gy-28,3,6,cloth);drawRect(bx+2,gy-28,3,6,cloth);}
  else if(o.hat==='cone'){drawRect(bx-7,gy-31,15,3,cloth);drawRect(bx-3,gy-36,8,5,cloth);drawRect(bx-1,gy-40,4,4,cloth);}
  else if(o.hat==='cowl'){drawRect(bx-5,gy-31,12,4,'#e8e0cc');drawRect(bx-5,gy-27,2,5,'#e8e0cc');drawRect(bx+3,gy-27,2,5,'#e8e0cc');drawRect(bx-4,gy-32,10,2,'#d8a24a');}
  // front arm + weapon
  const hx=bx+dir*7, hy=gy-19;
  drawRect(hx-2,hy,4,8,skin);
  const thrust=o.atkT>0;
  if(o.weapon==='sword'){
    if(thrust){drawRect(hx,hy+2,dir*16,3,'#c8c8d0');drawRect(hx+dir*2,hy,3,7,'#6e5a3a');}
    else{drawRect(hx,hy-13,3,15,'#c8c8d0');drawRect(hx-2,hy+1,8,3,'#6e5a3a');}
  }else if(o.weapon==='dagger'){
    if(thrust)drawRect(hx,hy+2,dir*11,3,'#c8c8d0');
    else drawRect(hx,hy-6,3,9,'#c8c8d0');
  }else if(o.weapon==='staff'){
    drawRect(hx,hy-16,3,26,'#6e5a3a');drawRect(hx-2,hy-21,7,6,'#7fb2ff');
    if(thrust)glow(hx+1,hy-18,14,BLUEG,'0.5');
  }else if(o.weapon==='holy'){
    drawRect(hx,hy-14,3,24,'#6e5a3a');drawRect(hx-1,hy-19,5,2,'#d8a24a');drawRect(hx,hy-21,3,6,'#d8a24a');
    if(thrust)glow(hx+1,hy-18,14,AMBER,'0.5');
  }
  if(o.healFx>0)glow(bx,gy-18,20,'rgba(127,216,127,A)','0.4');
}
function drawBeast(x,gy,dir,c,o){
  o=o||{};
  if(o.ko)return;
  const ph=o.phase!=null?Math.sin(o.phase):0;
  const lunge=o.atkT>0?dir*5:0, bx=x+lunge;
  drawRect(bx-13+ph*2,gy-6,4,6,c.b);
  drawRect(bx+8-ph*2,gy-6,4,6,c.b);
  drawRect(bx-14,gy-16,28,11,c.a); // body
  drawRect(bx+dir*13,gy-20,10,9,c.a); // head
  drawRect(bx+dir*17,gy-18,2,2,c.eye);
  drawRect(bx+dir*12,gy-24,3,4,c.b); // ear
  drawRect(bx-dir*17,gy-15,5,3,c.b); // tail
  drawRect(bx-14,gy-8,28,3,'rgba(0,0,0,0.25)');
}
function drawBig(x,gy,dir,c,size,o){
  o=o||{};
  const s=size||1, ph=o.phase!=null?Math.sin(o.phase)*2:0;
  const bw=Math.round(34*s), bh=Math.round(34*s);
  const bx=x+(o.atkT>0?dir*5:0), top=gy-bh-8+ph;
  drawRect(bx-bw/2,top+6,bw,bh,c.a); // body
  drawRect(bx-bw/2,top+6,bw,6,c.b); // brow
  drawRect(bx-bw/2+3,top+6+bh-6,bw-6,4,'rgba(0,0,0,0.3)');
  // arms
  const ax=o.atkT>0?dir*6:0;
  drawRect(bx-bw/2-6,top+12,7,Math.round(bh*0.7),c.b);
  drawRect(bx+bw/2-1+ax,top+12,7,Math.round(bh*0.7),c.b);
  // legs
  drawRect(bx-bw/2+4,gy-9,8,9,c.b);
  drawRect(bx+bw/2-12,gy-9,8,9,c.b);
  // eyes
  drawRect(bx+dir*6-3,top+13,4,4,c.eye);
  drawRect(bx+dir*13-3,top+13,4,4,c.eye);
  drawRect(bx-5,top+22,10+ (o.atkT>0?3:0),3,'#1a1010'); // maw
}
function drawEnemy(e,sx,t){
  const o={phase:e.dead?null:(t*7+e.bob),atkT:e.atkT};
  const tp=e.tp;
  if(tp.kind==='beast')drawBeast(sx,GROUND_Y,-1,tp.c,o);
  else if(tp.kind==='big')drawBig(sx,GROUND_Y,-1,tp.c,tp.size||1,o);
  else drawHumanoid(sx,GROUND_Y,-1,tp.c,{...o,hat:tp.hat,weapon:tp.weapon});
  // hp bar
  if(!e.dead&&e.hp<e.maxHp){
    const w=tp.kind==='big'?34:22, hx=sx-w/2, hy=GROUND_Y-(tp.kind==='big'?52*(tp.size||1):38);
    drawRect(hx,hy,w,3,'#0a080a');
    drawRect(hx,hy,Math.max(1,w*e.hp/e.maxHp),3,'#a23a30');
  }
}
function drawHeroSprite(r,sx,t,walking){
  const c=CLASSES[r.h.cls];
  drawHumanoid(sx,GROUND_Y,1,c.pal,{
    hat:c.hat,weapon:c.weapon,armor:r.h.cls==='fighter',
    phase:walking?(t*8+r.bob):null,atkT:r.atkT,ko:r.h.ko,healFx:r.healFx});
  if(!r.h.ko&&r.hp<r.st.hp){
    const w=22,hx=sx-w/2,hy=GROUND_Y-45,pct=clamp(r.hp/r.st.hp,0,1);
    drawRect(hx,hy,w,3,'#0a080a');
    drawRect(hx,hy,Math.max(1,w*pct),3,pct>0.5?'#4e8f4a':pct>0.25?'#d8a24a':'#a23a30');
  }
}
function drawChest(c,sx){
  if(c.open){
    drawRect(sx-10,GROUND_Y-8,20,8,'#5e452a');
    drawRect(sx-11,GROUND_Y-16,22,4,'#5e452a');
    glow(sx,GROUND_Y-10,16,AMBER,'0.35');
  }else{
    drawRect(sx-10,GROUND_Y-14,20,14,'#5e452a');
    drawRect(sx-10,GROUND_Y-9,20,3,'#d8a24a');
    drawRect(sx-2,GROUND_Y-11,4,4,'#d8a24a');
  }
}
function drawShard(sx,t){
  const gy=GROUND_Y-30+Math.sin(t*3)*4;
  const spin=Math.sin(t*6);
  drawRect(sx-1,gy-16,2,32,'#3a0a18');
  drawRect(sx-1-Math.abs(spin*5),gy-4,2+Math.abs(spin*10),8,'#7a1030');
  drawRect(sx-2,gy-3,4,4,'#ff2a4a');
  glow(sx,gy,30+spin*6,'rgba(255,42,74,A)',''+(0.3+Math.abs(spin)*0.15));
}
/* ---- backgrounds ---- */
function farShape(B,x,base){
  // silhouette layer per biome
  if(B.farStyle==='pines'){
    for(let i=0;i<4;i++)drawRect(x-10+i*3,base-36+i*10,23-i*6,10,B.far);
  }else if(B.farStyle==='peaks'){
    for(let i=0;i<6;i++)drawRect(x-30+i*5,base-60+i*10,62-i*10,10,B.far);
  }else if(B.farStyle==='dunes'){
    for(let i=0;i<3;i++)drawRect(x-40+i*10,base-16+i*6,84-i*20,6,B.far);
  }else if(B.farStyle==='spikes'){
    for(let i=0;i<5;i++){
      const hgt=26+Math.abs(i-2)*16;
      drawRect(x-17+i*8,base-hgt+40,6,hgt,B.far);
    }
  }
}
function drawProp(B,type,sx,t){
  const name=B.props[type];
  if(name==='pine'||name==='pinesnow'){
    drawRect(sx-2,GROUND_Y-14,5,14,'#3a2c1c');
    for(let i=0;i<4;i++)drawRect(sx-13+i*3,GROUND_Y-22-i*9,27-i*6,9,'#22381f');
    if(name==='pinesnow')for(let i=0;i<4;i++)drawRect(sx-13+i*3,GROUND_Y-22-i*9,27-i*6,3,'#8fa0b3');
  }else if(name==='bush'){drawRect(sx-9,GROUND_Y-9,19,9,'#22381f');drawRect(sx-5,GROUND_Y-13,11,5,'#2c4527');}
  else if(name==='stump'){drawRect(sx-6,GROUND_Y-9,13,9,'#3a2c1c');drawRect(sx-6,GROUND_Y-9,13,3,'#54432c');}
  else if(name==='rock'){drawRect(sx-8,GROUND_Y-10,17,10,'#3e3e46');drawRect(sx-4,GROUND_Y-14,9,4,'#4c4c54');}
  else if(name==='boulder'){drawRect(sx-13,GROUND_Y-16,27,16,'#3e3e46');drawRect(sx-9,GROUND_Y-21,18,5,'#4c4c54');}
  else if(name==='icerock'){drawRect(sx-8,GROUND_Y-12,17,12,'#3e5570');drawRect(sx-3,GROUND_Y-19,7,7,'#5a7a9a');}
  else if(name==='cactus'){drawRect(sx-2,GROUND_Y-22,5,22,'#3e5a2c');drawRect(sx-8,GROUND_Y-17,6,3,'#3e5a2c');drawRect(sx-8,GROUND_Y-17,3,7,'#3e5a2c');}
  else if(name==='dune'){drawRect(sx-16,GROUND_Y-8,33,8,'#54401f');}
  else if(name==='bones'){drawRect(sx-7,GROUND_Y-4,15,3,'#9a9186');drawRect(sx-2,GROUND_Y-8,4,5,'#9a9186');}
}
function drawBG(B,cam,t){
  const g=ctx.createLinearGradient(0,0,0,GROUND_Y);
  g.addColorStop(0,B.sky[0]);g.addColorStop(1,B.sky[1]);
  ctx.fillStyle=g;ctx.fillRect(0,0,STAGE_W,GROUND_Y);
  // far layer
  const sp1=140, off1=cam*0.25;
  for(let i=Math.floor(off1/sp1)-1;i<(off1+STAGE_W)/sp1+1;i++){
    const sx=i*sp1-off1;
    if(hash(i*3.7+B.seedId)<0.8)farShape(B,sx,GROUND_Y-40-hash(i*9.1)*50);
  }
  // mid layer
  const sp2=220, off2=cam*0.55;
  ctx.globalAlpha=0.9;
  for(let i=Math.floor(off2/sp2)-1;i<(off2+STAGE_W)/sp2+1;i++){
    const sx=i*sp2-off2;
    if(hash(i*5.3+B.seedId*2)<0.7){
      drawRect(sx-20,GROUND_Y-30,40,30,B.mid);
      drawRect(sx-12,GROUND_Y-44,24,14,B.mid);
    }
  }
  ctx.globalAlpha=1;
  // ground
  drawRect(0,GROUND_Y,STAGE_W,STAGE_H-GROUND_Y,B.ground);
  drawRect(0,GROUND_Y,STAGE_W,4,B.gtop);
  const sp3=42, off3=cam;
  for(let i=Math.floor(off3/sp3)-1;i<(off3+STAGE_W)/sp3+1;i++){
    if(hash(i*1.7)<0.5)drawRect(i*sp3-off3+hash(i)*20,GROUND_Y+12+hash(i*2.3)*44,7,3,B.speck);
  }
  // torches every 300 world px
  const sp4=300;
  for(let i=Math.floor(cam/sp4);i<(cam+STAGE_W)/sp4+1;i++){
    const wx=i*sp4+80, sx=wx-cam;
    drawRect(sx-1,GROUND_Y-30,4,30,'#3a2c1c');
    const fl=1+Math.sin(t*11+i*3)*0.5;
    drawRect(sx-2,GROUND_Y-36,6,6,'#e08a2e');
    drawRect(sx-1,GROUND_Y-38-fl,4,4,'#ffd23f');
    glow(sx+1,GROUND_Y-34,44+fl*6,AMBER,'0.22');
  }
}
/* ---- HUD ---- */
function drawPartyHUD(){
  ctx.font='10px monospace';
  mission.party.forEach((r,i)=>{
    const y=10+i*24, c=CLASSES[r.h.cls], tier=heroTier(r.h.lvl);
    drawRect(8,y,9,9,c.color);
    ctx.fillStyle=r.h.ko?'#8c2f2f':(tier.hex||'#cfc2ab');
    ctx.fillText(r.h.name+' L'+r.h.lvl+(r.h.ko?' DOWN':''),22,y+8);
    drawRect(8,y+12,120,5,'#0a080a');
    const pct=r.hp/r.st.hp;
    drawRect(8,y+12,Math.max(0,120*pct),5,pct>0.5?'#4e8f4a':pct>0.25?'#d8a24a':'#a23a30');
    drawRect(8,y+18,120,2,'#0a080a');
    drawRect(8,y+18,120*clamp(r.h.xp/xpNeed(r.h.lvl),0,1),2,'#5a8fd8');
  });
  // progress
  drawRect(STAGE_W/2-120,10,240,6,'#0a080a');
  if(mission.endless)drawRect(STAGE_W/2-120,10,240,6,'#8c2f2f');
  else drawRect(STAGE_W/2-120,10,240*clamp(mission.px/(mission.len-180),0,1),6,'#d8a24a');
  ctx.fillStyle='#8a7d6b';
  ctx.fillText(mission.B.name.toUpperCase()+(mission.endless?'  ·  '+Math.floor(mission.px)+'m':''),STAGE_W/2-120,28);
  // boss bar (regular biomes only — the Nightmare has no boss)
  if(!mission.endless){
    const bg=mission.groups[mission.groups.length-1];
    if(bg.active&&!bg.enemies[0].dead){
      const b=bg.enemies[0];
      drawRect(STAGE_W/2-150,STAGE_H-26,300,9,'#0a080a');
      drawRect(STAGE_W/2-150,STAGE_H-26,300*b.hp/b.maxHp,9,'#8c2f2f');
      ctx.fillStyle='#e06a5a';
      ctx.fillText(b.tp.name.toUpperCase(),STAGE_W/2-150,STAGE_H-31);
    }
  }
  if(state.paused){ctx.fillStyle='#d8a24a';ctx.font='16px monospace';ctx.fillText('PAUSED',STAGE_W/2-28,STAGE_H/2);}
}
function drawMission(t){
  mission.cam=clamp(mission.px-STAGE_W*0.34,0,Math.max(0,mission.len-STAGE_W));
  const mir=mission.mirror;
  ctx.save();
  if(mir){ ctx.translate(STAGE_W,0); ctx.scale(-1,1); }
  drawBG(mission.B,mission.cam,t);
  for(const p of mission.props){const sx=p.x-mission.cam;if(sx>-40&&sx<STAGE_W+40)drawProp(mission.B,p.t,sx,t)}
  for(const c of mission.chests){const sx=c.x-mission.cam;if(sx>-30&&sx<STAGE_W+30)drawChest(c,sx)}
  if(mission.shards)for(const s of mission.shards){if(s.taken)continue;const sx=s.x-mission.cam;if(sx>-30&&sx<STAGE_W+30)drawShard(sx,t)}
  for(const g of mission.groups)for(const e of g.enemies){
    if(e.dead)continue;
    const sx=e.x-mission.cam;
    if(sx>-60&&sx<STAGE_W+60)drawEnemy(e,sx,t);
  }
  const walking=mission.state==='walk';
  mission.party.forEach(r=>{
    const sx=(r.h.ko?r.x:r.x)-mission.cam;
    if(sx>-40)drawHeroSprite(r,sx,t,walking&&!r.h.ko);
  });
  for(const f of mission.fx){
    ctx.strokeStyle=f.c;ctx.lineWidth=2;ctx.globalAlpha=f.t/0.16;
    ctx.beginPath();ctx.moveTo(f.x1-mission.cam,f.y1);ctx.lineTo(f.x2-mission.cam,f.y2);ctx.stroke();
    ctx.globalAlpha=1;
  }
  if(mir){
    // ceiling reflection — the mirror world hangs its own fight upside-down overhead
    ctx.save();
    ctx.globalAlpha=0.4;
    ctx.translate(0,44+GROUND_Y);
    ctx.scale(1,-1);
    for(const g of mission.groups)for(const e of g.enemies){
      if(e.dead)continue;
      const sx=e.x-mission.cam;
      if(sx>-60&&sx<STAGE_W+60)drawEnemy(e,sx,t);
    }
    mission.party.forEach(r=>{
      const sx=r.x-mission.cam;
      if(sx>-40)drawHeroSprite(r,sx,t,walking&&!r.h.ko);
    });
    ctx.restore();
  }
  ctx.restore();
  ctx.font='11px monospace';
  for(const f of mission.flo){
    ctx.globalAlpha=clamp(f.t,0,1);
    ctx.fillStyle=f.c;
    const fx=f.x-mission.cam-10;
    ctx.fillText(f.txt,mir?STAGE_W-fx:fx,f.y);
    ctx.globalAlpha=1;
  }
  ctx.drawImage(vig,0,0);
  if(mission.trance){
    ctx.lineWidth=2;
    for(const p of mission.trance.particles){
      ctx.strokeStyle='hsl('+Math.round(p.hue)+',100%,60%)';
      ctx.beginPath();
      ctx.moveTo(p.x,p.y);
      ctx.lineTo(p.x-p.vx*0.05,p.y-p.len);
      ctx.stroke();
    }
  }
  drawPartyHUD();
  if(mission.trance){
    ctx.font='14px monospace';
    ctx.fillStyle='#ff2a4a';
    ctx.globalAlpha=0.55+Math.sin(t*10)*0.35;
    ctx.fillText('N I G H T M A R E   T R A N C E',STAGE_W/2-150,64);
    ctx.globalAlpha=1;
  }
}
/* ---- hub ---- */
function drawHub(t){
  // walls
  const g=ctx.createLinearGradient(0,0,0,GROUND_Y);
  g.addColorStop(0,'#171009');g.addColorStop(1,'#241a10');
  ctx.fillStyle=g;ctx.fillRect(0,0,STAGE_W,GROUND_Y);
  for(let y=40;y<GROUND_Y;y+=46)drawRect(0,y,STAGE_W,3,'rgba(0,0,0,0.3)');
  // floor
  drawRect(0,GROUND_Y,STAGE_W,STAGE_H-GROUND_Y,'#1a1410');
  drawRect(0,GROUND_Y,STAGE_W,4,'#2c2115');
  for(let x=0;x<STAGE_W;x+=64)drawRect(x,GROUND_Y,2,STAGE_H-GROUND_Y,'rgba(0,0,0,0.35)');
  // sign
  ctx.font='13px monospace';
  const signText='T H E   G I L D E D   F L A G O N';
  const signW=ctx.measureText(signText).width;
  drawRect(STAGE_W/2-signW/2-17,26,signW+34,34,'#3a2c1c');
  drawRect(STAGE_W/2-signW/2-13,30,signW+26,26,'#241a10');
  ctx.fillStyle='#d8a24a';
  ctx.fillText(signText,STAGE_W/2-signW/2,48);
  // bar counter (left)
  drawRect(50,GROUND_Y-52,220,12,'#54432c');
  drawRect(58,GROUND_Y-40,204,40,'#3a2c1c');
  // kegs
  for(let i=0;i<2;i++){drawRect(292+i*44,GROUND_Y-34,34,34,'#4a3820');drawRect(292+i*44,GROUND_Y-22,34,4,'#2c2113');}
  // bottles on counter
  for(let i=0;i<5;i++){drawRect(70+i*36,GROUND_Y-66,6,14,['#4e8f4a','#8c2f2f','#5a8fd8','#d8a24a','#7a5c94'][i]);}
  // candles
  drawRect(120,GROUND_Y-72,3,6,'#cfc2ab');drawRect(119,GROUND_Y-76,5,4,'#ffd23f');glow(121,GROUND_Y-74,30,AMBER,'0.3');
  drawRect(220,GROUND_Y-72,3,6,'#cfc2ab');drawRect(219,GROUND_Y-76,5,4,'#ffd23f');glow(221,GROUND_Y-74,30,AMBER,'0.3');
  // fireplace (right)
  drawRect(760,GROUND_Y-110,150,110,'#3e3e46');
  drawRect(776,GROUND_Y-86,118,86,'#12090a');
  drawRect(760,GROUND_Y-116,150,8,'#54432c');
  for(let i=0;i<7;i++){
    const fh=10+hash(Math.floor(t*9)+i*7)*26;
    drawRect(788+i*15,GROUND_Y-8-fh,10,fh,i%2?'#e08a2e':'#c85a20');
    drawRect(791+i*15,GROUND_Y-6-fh*0.6,5,fh*0.6,'#ffd23f');
  }
  glow(838,GROUND_Y-40,140,AMBER,'0.30');
  // heroes idle
  const hx0=360;
  state.heroes.forEach((h,i)=>{
    const c=CLASSES[h.cls];
    const bob=Math.sin(t*2+i)*1.5;
    drawHumanoid(hx0+i*62,GROUND_Y+bob*0,1,c.pal,{
      hat:c.hat,weapon:c.weapon,armor:h.cls==='fighter',
      phase:null,atkT:0,ko:h.ko});
    ctx.font='9px monospace';
    ctx.fillStyle=h.ko?'#8c2f2f':(heroTier(h.lvl).hex||'#8a7d6b');
    ctx.fillText(h.name,hx0+i*62-14,GROUND_Y+14+(h.ko?0:bob));
  });
  if(!state.heroes.length){
    ctx.font='11px monospace';ctx.fillStyle='#8a7d6b';
    ctx.fillText('The tavern stands empty. Recruit a soul brave enough.',330,GROUND_Y-30);
  }
  ctx.drawImage(vig,0,0);
}

/* ================= UI ================= */
const byId=id=>document.getElementById(id);
function esc(s){return String(s).replace(/[<>&]/g,m=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[m]))}
function itemStats(it){
  const t=it.stats, p=[];
  if(t.atk)p.push('+'+t.atk+' ATK'); if(t.hp)p.push('+'+t.hp+' HP');
  if(t.def)p.push('+'+t.def+' DEF'); if(t.crit)p.push('+'+t.crit+'% CRIT');
  if(t.spd)p.push('+'+t.spd+'% SPD');
  return p.join(', ');
}
function itemLabel(it){return '<span class="'+RARITY[it.rar].cls+'">'+esc(it.name)+'</span> <span class="muted">['+it.slot+']</span>'}
const STASH_SORTS=[['newest','Newest'],['oldest','Oldest'],['rarity','Rarity'],['value','Value']];
function sortStash(arr,mode){
  const a=arr.slice();
  if(mode==='newest')return a.reverse();
  if(mode==='rarity')return a.sort((x,y)=>y.rar-x.rar);
  if(mode==='value')return a.sort((x,y)=>y.value-x.value);
  return a; // 'oldest' — items accumulate via push, so array order is already oldest-first
}
function itemCardHeader(it){return '<h3>'+itemLabel(it)+'</h3><div class="muted">'+itemStats(it)+'</div>'}
function cardsGrid(cardsHtml){return '<div class="cards">'+cardsHtml.join('')+'</div>'}
function btn(label,onclick,opts){
  opts=opts||{};
  const cls='act'+(opts.warn?' warn':'');
  const style=opts.style?' style="'+opts.style+'"':'';
  const dis=opts.disabled?' disabled':'';
  const title=opts.title?' title="'+opts.title+'"':'';
  return '<button class="'+cls+'"'+style+title+' onclick="'+onclick+'"'+dis+'>'+label+'</button>';
}
function updateRes(){
  byId('res').innerHTML='Gold <b>'+state.gold+'</b> &nbsp;·&nbsp; Potions <b>'+state.potions+'</b> &nbsp;·&nbsp; Heroes <b>'+state.heroes.length+'/'+MAX_HEROES+'</b>';
  byId('btnMute').textContent=state.muted?'Sound: Off':'Sound: On';
  if(gameMode==='mission'){
    byId('btnPotion').textContent='Potion ×'+state.potions;
    byId('btnPotion').disabled=state.potions<=0;
    byId('btnSuper').textContent='Super ×'+state.superPotions;
    byId('btnSuper').disabled=state.superPotions<=0;
    byId('btnPower').textContent='Power ×'+state.powerPotions;
    byId('btnPower').disabled=state.powerPotions<=0;
    byId('btnRes').textContent='Res ×'+state.resPotions;
    byId('btnRes').disabled=state.resPotions<=0||!mission||!mission.party.some(r=>r.h.ko);
    byId('btnSpeed').textContent=state.speed+'×';
    byId('btnPause').textContent=state.paused?'Resume':'Pause';
  }
}
function updateUIVis(){
  byId('panel').classList.toggle('hidden',gameMode==='mission');
  byId('mctl').classList.toggle('hidden',gameMode!=='mission');
  updateRes();
  if(gameMode==='hub')renderTab();
}
function renderTab(){
  document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===currentTab));
  const el=byId('content');
  if(currentTab==='party')el.innerHTML=uiParty();
  else if(currentTab==='recruit')el.innerHTML=uiRecruit();
  else if(currentTab==='shop')el.innerHTML=uiShop();
  else if(currentTab==='stash')el.innerHTML=uiStash();
  else el.innerHTML=uiMap();
}
function equipItemAt(h,i){
  const it=state.stash[i];
  const old=h.equip[it.slot];
  h.equip[it.slot]=it; state.stash.splice(i,1);
  if(old)state.stash.push(old);
}
function heroCard(h,ctx2){
  const st=stats(h), c=CLASSES[h.cls], tier=heroTier(h.lvl);
  let s='<div class="card"><h3><span class="chip" style="background:'+c.color+'"></span>'
    +(tier.title?'<span class="'+tier.cls+'">'+tier.title+'</span> ':'')
    +'<span class="'+tier.cls+'">'+esc(h.name)+'</span>'
    +' <span class="muted">· '+c.label+' · Lv '+h.lvl+'</span>'
    +(h.ko?' <span class="hurt">DOWN</span>':'')+'</h3>';
  s+='<div class="statline"><span>HP <b>'+st.hp+'</b></span><span>ATK <b>'+st.atk+'</b></span>'
    +'<span>DEF <b>'+st.def+'</b></span><span>SPD <b>'+st.spd.toFixed(2)+'/s</b></span>'
    +'<span>CRIT <b>'+st.crit+'%</b></span></div>';
  s+='<div class="bar"><i style="width:'+Math.round(100*clamp(h.xp/xpNeed(h.lvl),0,1))+'%;background:#5a8fd8"></i></div>'
    +'<div class="muted">XP '+h.xp+' / '+xpNeed(h.lvl)+'</div>';
  if(ctx2==='recruit'){
    s+='<div class="muted" style="margin-top:5px">'+c.desc+'</div>';
    const cost=effectiveRecruitCost(h), discounted=state.recruiterFavors>0;
    s+='<div class="row">'+btn('Hire — '+cost+'g'+(discounted?' (Favor)':''),'Actions.recruit(\''+h.id+'\')',
      {disabled:state.gold<cost||state.heroes.length>=MAX_HEROES})+'</div>';
  }else{
    // equipment
    s+='<div style="margin-top:6px">';
    for(const slot of ['weapon','armor','trinket']){
      const it=h.equip[slot];
      s+='<div class="row" style="margin-top:3px"><span class="muted">'+slot+': '+(it?itemLabel(it)+' <span class="muted">'+itemStats(it)+'</span> '
        +btn('×','Actions.unequip(\''+h.id+'\',\''+slot+'\')',{style:'padding:1px 5px'}):'—')+'</span>';
      const options=state.stash.filter(x=>x.slot===slot);
      if(options.length){
        s+='<select id="eq_'+h.id+'_'+slot+'">'
          +options.map(x=>'<option value="'+x.id+'" style="color:'+RARITY[x.rar].col+'">'+esc(x.name)+' ('+RARITY[x.rar].label+')</option>').join('')
          +'</select>'+btn('Equip','Actions.equipSlot(\''+h.id+'\',\''+slot+'\')',{style:'padding:1px 5px'});
      }
      s+='</div>';
    }
    s+='</div>';
    if(h.pts>0){
      s+='<div class="row"><span class="gold">'+h.pts+' pts:</span>'
        +btn('+7 HP','Actions.spend(\''+h.id+'\',\'hp\',event)',{title:'Click +1 · Shift +5 · Ctrl all'})
        +btn('+1 ATK','Actions.spend(\''+h.id+'\',\'atk\',event)',{title:'Click +1 · Shift +5 · Ctrl all'})
        +btn('+1 DEF','Actions.spend(\''+h.id+'\',\'def\',event)',{title:'Click +1 · Shift +5 · Ctrl all'})
        +btn('+6% SPD','Actions.spend(\''+h.id+'\',\'spd\',event)',{title:'Click +1 · Shift +5 · Ctrl all'})+'</div>';
    }
    s+='<div class="row">';
    if(h.ko){
      const cost=reviveCost(h);
      s+=btn('Revive — '+cost+'g','Actions.revive(\''+h.id+'\')',{disabled:state.gold<cost});
    }
    s+=btn('Dismiss','Actions.dismiss(\''+h.id+'\')',{warn:true})+'</div>';
  }
  return s+'</div>';
}
function uiParty(){
  if(!state.heroes.length)return '<p class="locknote">No adventurers. Visit the Recruit tab.</p>';
  return cardsGrid(state.heroes.map(h=>heroCard(h)));
}
function uiRecruit(){
  return '<p class="muted" style="margin-bottom:8px">Sellswords at the bar. New faces arrive after each expedition. Roster max '+MAX_HEROES+'.</p>'
    +cardsGrid(state.recruits.map(h=>heroCard(h,'recruit')));
}
function uiShop(){
  let s='<div class="card" style="margin-bottom:10px"><h3>Provisions</h3>'
    +'<div class="row"><span>Healing Potion <span class="muted">(restores 40 HP mid-run)</span></span>'
    +btn('Buy — 25g','Actions.buyPotion()',{disabled:state.gold<25})
    +'<span class="muted">You carry '+state.potions+'</span></div>'
    +'<div class="row"><span>Super Health Potion <span class="muted">(restores 120 HP mid-run)</span></span>'
    +btn('Buy — 60g','Actions.buySuperPotion()',{disabled:state.gold<60})
    +'<span class="muted">You carry '+state.superPotions+'</span></div>'
    +'<div class="row"><span>Power Potion <span class="muted">(+35% party ATK for 20s, mid-run)</span></span>'
    +btn('Buy — 70g','Actions.buyPowerPotion()',{disabled:state.gold<70})
    +'<span class="muted">You carry '+state.powerPotions+'</span></div>'
    +'<div class="row"><span>Resurrection Potion <span class="muted">(revives a fallen hero mid-run at 50% HP)</span></span>'
    +btn('Buy — 250g','Actions.buyResPotion()',{disabled:state.gold<250})
    +'<span class="muted">You carry '+state.resPotions+'</span></div></div>';
  s+='<div class="card" style="margin-bottom:10px"><h3>Tavern Fare</h3>'
    +'<div class="row"><span>Round of Ale <span class="muted">('+pick(ALE_QUOTES)+')</span></span>'
    +btn('Buy — 15g','Actions.buyAle()',{disabled:state.gold<15})
    +'<span class="muted">'+state.alesBought+' bought</span></div>'
    +'<div class="row"><span>Recruiter\'s Favor <span class="muted">(halves your next hire\'s cost)</span></span>'
    +btn('Buy — 90g','Actions.buyRecruiterFavor()',{disabled:state.gold<90})
    +'<span class="muted">You carry '+state.recruiterFavors+'</span></div></div>';
  s+='<p class="muted" style="margin:8px 0">Today\'s wares — restocked after each expedition. Sell loot from the Stash tab.</p>';
  s+=cardsGrid(state.shop.map((it,i)=>{
    const price=it.value*2;
    return '<div class="card">'+itemCardHeader(it)
      +'<div class="row">'+btn('Buy — '+price+'g','Actions.buyGear('+i+')',{disabled:state.gold<price})+'</div></div>';
  }));
  return s;
}
function uiStash(){
  if(!state.stash.length)return '<p class="locknote">The stash is empty. Loot awaits in the dark.</p>';
  const opts=state.heroes.map(h=>'<option value="'+h.id+'">'+esc(h.name)+' ('+CLASSES[h.cls].label+')</option>').join('');
  const sortOpts=STASH_SORTS.map(([v,l])=>'<option value="'+v+'"'+(state.stashSort===v?' selected':'')+'>'+l+'</option>').join('');
  return '<div class="row" style="margin-bottom:8px"><span class="muted">Gear found on expeditions. Equip it here, or sell it.</span>'
    +'<span class="muted" style="margin-left:auto">Sort: <select onchange="Actions.setStashSort(this.value)">'+sortOpts+'</select></span></div>'
    +cardsGrid(sortStash(state.stash,state.stashSort).map(it=>'<div class="card">'+itemCardHeader(it)
      +'<div class="row">'
      +(state.heroes.length?'<select id="sel_'+it.id+'">'+opts+'</select>'+btn('Equip','Actions.equip(\''+it.id+'\')'):'')
      +btn('Sell — '+it.value+'g','Actions.sell(\''+it.id+'\')',{warn:true})
      +'</div></div>'));
}
function uiMap(){
  const ready=state.heroes.some(h=>!h.ko);
  const cards=BIOMES.map((B,i)=>{
    const locked=i>=state.unlocked;
    let s='<div class="card"><h3>'+B.name+' <span class="muted">· Danger '+B.danger+'</span></h3>';
    if(locked){
      s+='<p class="locknote">Locked — clear '+BIOMES[i-1].name+' first.</p>';
    }else{
      s+='<div class="muted">Foes: '+B.enemies.map(e=>e.name).join(', ')+' · Boss: '+B.boss.name+'</div>'
        +'<div class="muted">Cleared '+state.completions[i]+' time'+(state.completions[i]===1?'':'s')
        +(state.completions[i]>0?' <span class="hurt">(foes grow stronger)</span>':'')+'</div>'
        +'<div class="row">'+btn('Embark','Actions.embark('+i+')',{disabled:!ready})
        +(ready?'':'<span class="locknote">need a standing hero</span>')+'</div>';
    }
    return s+'</div>';
  });
  const nmLocked=state.unlocked<BIOMES.length;
  let nm='<div class="card"><h3>'+NIGHTMARE.name+' <span class="hurt">· Danger '+NIGHTMARE.danger+'</span></h3>';
  if(nmLocked){
    nm+='<p class="locknote">Locked — clear '+BIOMES[BIOMES.length-1].name+' first.</p>';
  }else{
    nm+='<div class="muted">Foes: '+NIGHTMARE.enemies.map(e=>e.name).join(', ')+'</div>'
      +'<div class="hurt">Endless. Grows harder the longer you stay. Only retreat brings you home — but you keep everything you earned.</div>'
      +'<div class="row">'+btn('Embark','Actions.embarkNightmare()',{disabled:!ready,warn:true})
      +(ready?'':'<span class="locknote">need a standing hero</span>')+'</div>';
  }
  cards.push(nm+'</div>');
  if(mirrorUnlocked()){
    cards.push('<div class="card"><h3>'+MIRROR.name+' <span class="hurt">· Danger '+MIRROR.danger+'</span></h3>'
      +'<div class="muted">Foes: '+MIRROR.enemies.map(e=>e.name).join(', ')+' · Boss: '+MIRROR.boss.name+'</div>'
      +'<div class="hurt">Nothing here is where it should be.</div>'
      +'<div class="row">'+btn('Embark','Actions.embarkMirror()',{disabled:!ready,warn:true})
      +(ready?'':'<span class="locknote">need a standing hero</span>')+'</div></div>');
  }
  return '<p class="muted" style="margin-bottom:8px">Choose an expedition. The party marches on its own — you may use potions or sound the retreat.</p>'
    +cardsGrid(cards)
    +'<div id="resetrow">'+btn('Abandon save & start anew','Actions.reset()',{warn:true})+'</div>';
}
function showSummary(){
  const o=mission.over;
  const title=o.res==='win'?'<h2 class="win">MISSION COMPLETE</h2>'
    :o.res==='retreat'?'<h2 class="ret">RETREAT SOUNDED</h2>'
    :'<h2 class="lose">THE PARTY HAS FALLEN</h2>';
  const koN=mission.party.filter(r=>r.h.ko).length;
  let s=title+'<div>Gold recovered: <span class="gold">'+o.g+'g</span></div>';
  if(o.items.length)s+='<ul>'+o.items.map(it=>'<li>'+itemLabel(it)+' <span class="muted">'+itemStats(it)+'</span></li>').join('')+'</ul>';
  else s+='<p class="muted" style="margin:8px 0">No gear recovered.</p>';
  if(o.res==='wipe')s+='<p class="muted">Half the spoils were lost in the rout.</p>';
  if(koN)s+='<p class="hurt">'+koN+' hero'+(koN>1?'es':'')+' must be revived at the tavern.</p>';
  s+='<div class="row" style="justify-content:center">'+btn('Return to the tavern','Actions.closeSummary()')+'</div>';
  byId('sumbox').innerHTML=s;
  byId('summary').classList.remove('hidden');
}

/* ================= ACTIONS ================= */
const Actions={
  tab(t){currentTab=t;renderTab()},
  spend(id,stat,e){
    const h=state.heroes.find(x=>x.id===id); if(!h||h.pts<=0)return;
    const amt=e&&e.ctrlKey?h.pts:e&&e.shiftKey?Math.min(5,h.pts):1;
    h.pts-=amt; h.bonus[stat]+=amt*{hp:7,atk:1,def:1,spd:6}[stat];
    save();renderTab();
  },
  revive(id){
    const h=state.heroes.find(x=>x.id===id); if(!h)return;
    const cost=reviveCost(h); if(state.gold<cost)return;
    state.gold-=cost; h.ko=false; save();updateRes();renderTab();
  },
  dismiss(id){
    const h=state.heroes.find(x=>x.id===id); if(!h)return;
    if(!confirm('Dismiss '+h.name+'? Their gear returns to the stash.'))return;
    for(const s2 of ['weapon','armor','trinket'])if(h.equip[s2])state.stash.push(h.equip[s2]);
    state.heroes=state.heroes.filter(x=>x.id!==id);
    save();updateRes();renderTab();
  },
  recruit(id){
    const h=state.recruits.find(x=>x.id===id); if(!h)return;
    const cost=effectiveRecruitCost(h);
    if(state.gold<cost||state.heroes.length>=MAX_HEROES)return;
    state.gold-=cost;
    if(state.recruiterFavors>0)state.recruiterFavors--;
    state.heroes.push(h);
    state.recruits=state.recruits.filter(x=>x.id!==id);
    save();updateRes();renderTab();
  },
  buyPotion(){ if(state.gold<25)return; state.gold-=25;state.potions++;save();updateRes();renderTab(); },
  buySuperPotion(){ if(state.gold<60)return; state.gold-=60;state.superPotions++;save();updateRes();renderTab(); },
  buyPowerPotion(){ if(state.gold<70)return; state.gold-=70;state.powerPotions++;save();updateRes();renderTab(); },
  buyResPotion(){ if(state.gold<250)return; state.gold-=250;state.resPotions++;save();updateRes();renderTab(); },
  buyAle(){ if(state.gold<15)return; state.gold-=15;state.alesBought++;sfx.cheer();save();updateRes();renderTab(); },
  buyRecruiterFavor(){ if(state.gold<90)return; state.gold-=90;state.recruiterFavors++;save();updateRes();renderTab(); },
  buyGear(i){
    const it=state.shop[i]; if(!it||state.gold<it.value*2)return;
    state.gold-=it.value*2; state.stash.push(it); state.shop.splice(i,1);
    save();updateRes();renderTab();
  },
  sell(id){
    const i=state.stash.findIndex(x=>x.id===id); if(i<0)return;
    state.gold+=state.stash[i].value; state.stash.splice(i,1);
    save();updateRes();renderTab();
  },
  equip(itemId){
    const i=state.stash.findIndex(x=>x.id===itemId); if(i<0)return;
    const sel=byId('sel_'+itemId); if(!sel)return;
    const h=state.heroes.find(x=>x.id===sel.value); if(!h)return;
    equipItemAt(h,i);
    save();renderTab();
  },
  equipSlot(heroId,slot){
    const h=state.heroes.find(x=>x.id===heroId); if(!h)return;
    const sel=byId('eq_'+heroId+'_'+slot); if(!sel||!sel.value)return;
    const i=state.stash.findIndex(x=>x.id===sel.value); if(i<0)return;
    equipItemAt(h,i);
    save();renderTab();
  },
  unequip(heroId,slot){
    const h=state.heroes.find(x=>x.id===heroId); if(!h||!h.equip[slot])return;
    state.stash.push(h.equip[slot]); h.equip[slot]=null;
    save();renderTab();
  },
  setStashSort(mode){ state.stashSort=mode; save(); renderTab(); },
  embark(bi){ if(bi<state.unlocked)startMission(bi); },
  embarkNightmare(){ if(state.unlocked>=BIOMES.length)startMission('nightmare'); },
  embarkMirror(){ if(mirrorUnlocked())startMission('mirror'); },
  potion(){
    if(!mission||mission.over||state.potions<=0)return;
    if(useHealPotion(40))state.potions--;
    updateRes();
  },
  superPotion(){
    if(!mission||mission.over||state.superPotions<=0)return;
    if(useHealPotion(120))state.superPotions--;
    updateRes();
  },
  powerPotion(){
    if(!mission||mission.over||state.powerPotions<=0)return;
    state.powerPotions--;
    mission.buff={mult:1.35,t:0,dur:20};
    flo('POWER UP!',mission.px,GROUND_Y-70,'#ffd23f');
    sfx.power();
    updateRes();
  },
  resPotion(){
    if(!mission||mission.over||state.resPotions<=0)return;
    const fallen=mission.party.find(r=>r.h.ko);
    if(!fallen)return;
    state.resPotions--;
    fallen.h.ko=false;
    fallen.hp=Math.round(fallen.st.hp*0.5);
    fallen.healFx=0.5;
    flo('REVIVED!',fallen.x,GROUND_Y-70,'#ffd23f');
    sfx.resurrect();
    updateRes();
  },
  retreat(){ if(mission&&!mission.over)finishMission('retreat'); },
  speed(){ state.speed=state.speed===1?2:1; updateRes(); },
  pause(){ state.paused=!state.paused; updateRes(); },
  closeSummary(){
    byId('summary').classList.add('hidden');
    mission=null; gameMode='hub'; state.paused=false;
    refreshOffers(); save(); updateUIVis();
  },
  reset(){
    if(!confirm('Abandon this save and start a new campaign?'))return;
    newGame(); save(); updateUIVis();
  },
  toggleMute(){ state.muted=!state.muted; save(); updateRes(); },
};
window.Actions=Actions;
document.addEventListener('click',e=>{
  const b=e.target.closest('button');
  if(!b)return;
  b.closest('#tabs')?sfx.tab():sfx.click();
});

/* ================= LOOP ================= */
let last=performance.now();
function loop(now){
  let dt=Math.min(0.05,(now-last)/1000); last=now;
  const t=now/1000;
  if(gameMode==='mission'&&mission){
    if(!state.paused)updateMission(dt*state.speed);
    drawMission(t);
  }else{
    drawHub(t);
  }
  requestAnimationFrame(loop);
}
(async function init(){
  const ok=await loadSave();
  if(!ok)newGame();
  if(!state.recruits||!state.recruits.length)refreshOffers();
  if(state.speed==null)state.speed=1;
  if(state.muted==null)state.muted=false;
  if(!state.stashSort)state.stashSort='newest';
  if(state.superPotions==null)state.superPotions=0;
  if(state.powerPotions==null)state.powerPotions=0;
  if(state.recruiterFavors==null)state.recruiterFavors=0;
  if(state.alesBought==null)state.alesBought=0;
  if(state.resPotions==null)state.resPotions=0;
  if(state.nightmareBestDistance==null)state.nightmareBestDistance=0;
  state.paused=false;
  gameMode='hub'; mission=null;
  updateUIVis();
  requestAnimationFrame(loop);
})();
