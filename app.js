const $ = s => document.querySelector(s);
const today = () => new Date().toLocaleDateString('en-CA');
const dateFR = d => new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
const STAT_NAMES = {force:'Force',intelligence:'Intelligence',discipline:'Discipline',vitalite:'Vitalité',richesse:'Richesse',maitrise:'Maîtrise'};
const DAILY = [
 {id:'learn',title:'Nourrir son esprit',desc:'Apprendre 10 à 15 minutes',xp:10,stat:'intelligence'},
 {id:'body',title:'Entretenir son corps',desc:'Sport, marche ou mobilité selon le jour',xp:10,stat:'force'},
 {id:'control',title:'Garder le contrôle',desc:'10 minutes d’organisation ou de rangement',xp:10,stat:'discipline'}
];
const WEEKLY = [
 {id:'gym3',title:'Bouger régulièrement',desc:'Faire 3 séances de musculation ou activités adaptées',xp:60,stat:'force'},
 {id:'learn3',title:'Cultiver sa curiosité',desc:'Faire 3 sessions d’apprentissage',xp:30,stat:'intelligence'},
 {id:'finance',title:'Piloter ses finances',desc:'Faire un point sur ses dépenses et son épargne',xp:20,stat:'richesse'}
];
const fresh = () => ({version:1,totalXp:0,level:1,statXp:{force:0,intelligence:0,discipline:0,vitalite:0,richesse:0,maitrise:0},days:{},weekly:{},bonus:[],history:[],mood:5,energy:'Bonne énergie',notes:''});
let data = load();
let selectedMood = 5;
function load(){try{return JSON.parse(localStorage.getItem('lifeResetSave'))||fresh()}catch{return fresh()}}
function save(){localStorage.setItem('lifeResetSave',JSON.stringify(data));render()}
function dayData(){const k=today();if(!data.days[k])data.days[k]={done:[],bonusDone:[],notes:'',mood:5,energy:'Bonne énergie'};return data.days[k]}
function weekKey(){const d=new Date();const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return d.toLocaleDateString('en-CA')}
function levelInfo(xp){let level=1,remaining=xp,cost=100;while(remaining>=cost){remaining-=cost;level++;cost=100+(level-1)*25}return {level,remaining,cost}}
function rank(l){return l>=50?'S':l>=30?'A':l>=20?'B':l>=10?'C':l>=5?'D':'F'}
function quests(){return [...DAILY,...data.bonus.map(q=>({...q,bonus:true}))]}
function toggleQuest(id){const d=dayData(),q=quests().find(x=>x.id===id);if(!q)return;const arr=q.bonus?d.bonusDone:d.done;const idx=arr.indexOf(id);if(idx>=0){arr.splice(idx,1);data.totalXp=Math.max(0,data.totalXp-q.xp);data.statXp[q.stat]=Math.max(0,(data.statXp[q.stat]||0)-q.xp)}else{arr.push(id);data.totalXp+=q.xp;data.statXp[q.stat]=(data.statXp[q.stat]||0)+q.xp}save()}
function toggleWeekly(id){const k=weekKey();if(!data.weekly[k])data.weekly[k]=[];const q=WEEKLY.find(x=>x.id===id);const a=data.weekly[k],i=a.indexOf(id);if(i>=0){a.splice(i,1);data.totalXp=Math.max(0,data.totalXp-q.xp);data.statXp[q.stat]=Math.max(0,(data.statXp[q.stat]||0)-q.xp)}else{a.push(id);data.totalXp+=q.xp;data.statXp[q.stat]=(data.statXp[q.stat]||0)+q.xp}save()}
function questHTML(q,done){return `<div class="quest ${done?'done':''}"><button class="quest-check" data-toggle="${q.id}" aria-label="${done?'Décocher':'Valider'}">${done?'✓':''}</button><div class="quest-main"><div class="quest-title">${esc(q.title)}</div><div class="quest-meta">${esc(q.desc)} · ${STAT_NAMES[q.stat]}</div></div><div class="quest-xp">+${q.xp} XP</div></div>`}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function render(){
 const info=levelInfo(data.totalXp),d=dayData(),doneCount=d.done.length,mainCount=DAILY.length;
 $('#todayLabel').textContent=dateFR(today()).toUpperCase();$('#datePill').textContent=new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
 $('#level').textContent=info.level;$('#rank').textContent=rank(info.level);$('#levelText').textContent=`Niveau ${info.level} · ${rank(info.level)==='F'?'Novice polyvalent':'Aventurier en progression'}`;
 $('#xpText').textContent=`${info.remaining} / ${info.cost} XP`;$('#xpBar').style.width=(info.remaining/info.cost*100)+'%';$('#totalXp').textContent=data.totalXp;
 $('#daysActive').textContent=Object.values(data.days).filter(x=>x.done.length||x.bonusDone.length).length;$('#completedCount').textContent=Object.values(data.days).reduce((n,x)=>n+x.done.length+x.bonusDone.length,0)+Object.values(data.weekly).reduce((n,x)=>n+x.length,0);
 $('#dailyCount').textContent=`${doneCount} / ${mainCount}`;$('#dailyBar').style.width=(doneCount/mainCount*100)+'%';
 $('#dailyQuests').innerHTML=DAILY.map(q=>questHTML(q,d.done.includes(q.id))).join('');
 $('#weeklyQuests').innerHTML=WEEKLY.map(q=>questHTML(q,(data.weekly[weekKey()]||[]).includes(q.id))).join('');
 $('#bonusQuests').innerHTML=data.bonus.length?data.bonus.map(q=>questHTML(q,d.bonusDone.includes(q.id))).join(''):'<p class="muted">Aucune quête bonus. Ajoute un défi personnel si tu le souhaites.</p>';
 $('#attributes').innerHTML=Object.entries(STAT_NAMES).map(([k,n])=>{const xp=data.statXp[k]||0,v=1+Math.floor(xp/100),p=xp%100;return `<div class="attribute"><span>${n}</span><div><div class="progress"><span style="width:${p}%"></span></div><small class="muted">${p}/100 XP vers le prochain rang</small></div><strong>${v}</strong></div>`}).join('');
 const hist=[...data.history].slice(-7).reverse();$('#history').innerHTML=hist.length?hist.map(h=>`<div class="history-row"><span>${esc(h.date)} · ${h.done}/${h.total} quêtes</span><strong>${h.xp} XP</strong></div>`).join(''):'<p class="muted" style="padding:14px">Ton historique apparaîtra ici après tes premiers rapports.</p>';
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-toggle]');if(b){const id=b.dataset.toggle;if(WEEKLY.some(q=>q.id===id))toggleWeekly(id);else toggleQuest(id)}});
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));$('#'+b.dataset.tab+'View').classList.add('active')}));
$('#addQuestBtn').onclick=()=>$('#questDialog').showModal();
$('#questForm').addEventListener('submit',e=>{if(e.submitter?.value==='cancel')return;e.preventDefault();const title=$('#questTitle').value.trim();if(!title)return;data.bonus.push({id:'b'+Date.now(),title,desc:'Quête bonus personnelle',xp:Number($('#questReward').value),stat:$('#questStat').value});save();$('#questDialog').close();$('#questForm').reset()});
$('#moodOptions').addEventListener('click',e=>{const b=e.target.closest('button[data-mood]');if(!b)return;selectedMood=Number(b.dataset.mood);$('#moodOptions').querySelectorAll('button').forEach(x=>x.classList.toggle('selected',x===b))});
$('#generateReport').onclick=()=>{
 const d=dayData(),done=quests().filter(q=>(q.bonus?d.bonusDone:d.done).includes(q.id)),missed=quests().filter(q=>!(q.bonus?d.bonusDone:d.done).includes(q.id));
 const xp=done.reduce((s,q)=>s+q.xp,0),info=levelInfo(data.totalXp);
 d.mood=selectedMood;d.energy=$('#energy').value;d.notes=$('#notes').value.trim();save();
 const weeklyDone=(data.weekly[weekKey()]||[]).map(id=>WEEKLY.find(q=>q.id===id)?.title).filter(Boolean);
 const report=`LIFE RESET — RAPPORT DU ${new Date().toLocaleDateString('fr-FR')}
Niveau actuel : ${info.level} (${rank(info.level)})
XP total : ${data.totalXp}
XP gagné aujourd'hui : ${xp}

QUÊTES ACCOMPLIES (${done.length}/${quests().length})
${done.length?done.map(q=>`- ${q.title} (+${q.xp} XP)`).join('\n'):'- Aucune quête validée'}

QUÊTES NON TERMINÉES
${missed.length?missed.map(q=>`- ${q.title}`).join('\n'):'- Toutes les quêtes du jour sont terminées'}

OBJECTIFS HEBDOMADAIRES VALIDÉS
${weeklyDone.length?weeklyDone.map(x=>'- '+x).join('\n'):'- Aucun pour le moment'}

Humeur : ${selectedMood}/5
Énergie : ${$('#energy').value}
Commentaire : ${d.notes||'Aucun'}

Merci de mettre à jour mon profil, mes statistiques et de me proposer mes prochaines quêtes Life Reset.`;
 $('#reportText').value=report;$('#reportResult').classList.remove('hidden');
 data.history=data.history.filter(h=>h.date!==today());data.history.push({date:new Date().toLocaleDateString('fr-FR'),done:done.length,total:quests().length,xp});localStorage.setItem('lifeResetSave',JSON.stringify(data));
};
$('#copyReport').onclick=async()=>{try{await navigator.clipboard.writeText($('#reportText').value);$('#copyStatus').textContent='Rapport copié. Tu peux le coller dans ChatGPT.'}catch{$('#reportText').select();$('#copyStatus').textContent='Sélectionne le texte puis copie-le.'}};
$('#energy').addEventListener('change',()=>{dayData().energy=$('#energy').value;localStorage.setItem('lifeResetSave',JSON.stringify(data))});
$('#notes').addEventListener('input',()=>{dayData().notes=$('#notes').value;localStorage.setItem('lifeResetSave',JSON.stringify(data))});
$('#resetDay').onclick=()=>{if(!confirm('Réinitialiser les validations du jour ? Les XP correspondants seront retirés.'))return;const d=dayData();for(const q of quests()){const a=q.bonus?d.bonusDone:d.done;if(a.includes(q.id)){data.totalXp=Math.max(0,data.totalXp-q.xp);data.statXp[q.stat]=Math.max(0,(data.statXp[q.stat]||0)-q.xp)}}d.done=[];d.bonusDone=[];save()};
$('#backupBtn').onclick=()=>$('#backupDialog').showModal();
$('#exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='life-reset-sauvegarde.json';a.click();URL.revokeObjectURL(url)};
$('#importFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const obj=JSON.parse(await f.text());if(!obj.version||!obj.days||typeof obj.totalXp!=='number')throw Error();if(confirm('Remplacer les données actuelles par cette sauvegarde ?')){data=obj;save();$('#backupDialog').close()}}catch{alert('Fichier de sauvegarde invalide.')}e.target.value=''};
if('serviceWorker'in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
render();
