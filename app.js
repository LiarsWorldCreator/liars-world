(function(){
var SUPABASE_URL='https://jhxvmwdrqwfakeaptbdt.supabase.co';
var SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoeHZtd2RycXdmYWtlYXB0YmR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzk0MzYsImV4cCI6MjA5NDc1NTQzNn0.NJ0zwaGze_YoKCG9etfsVk8ERZiVMkO-M0sMQpWhnRE';
var ADMIN_PASSWORD='19701974Wo.';
var db=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

var TEMPLATES=[{id:'scholar',name:'🧙 Wandering Scholar',identity:'Wandering Scholar',job:'Researcher of Forgotten Knowledge',age:42,reason:'To find a library that contains every book ever burned.',vocab:'Academic vocabulary, abstract concepts, literary references',icon:'scholar'},{id:'sailor',name:'⚓ Retired Sailor',identity:'Retired Sailor',job:'Former Navigator',age:55,reason:'The sea stopped speaking to me. I came to find a new voice.',vocab:'Nautical terms, weather descriptions, geographic names',icon:'sailor'},{id:'artist',name:'🎨 Traveling Artist',identity:'Traveling Artist',job:'Portrait Painter & Dream Collector',age:30,reason:'To paint the face of the Chief, who no one has seen.',vocab:'Colors, emotions, art techniques, aesthetic descriptions',icon:'artist'},{id:'merchant',name:'💼 Fallen Merchant',identity:'Fallen Merchant',job:'Former Silk Road Trader',age:38,reason:'I lost everything in a deal. I need to learn to speak honestly about my failure.',vocab:'Numbers, business terms, negotiation phrases, trade goods',icon:'merchant'},{id:'herbalist',name:'🌿 Village Herbalist',identity:'Village Herbalist',job:'Healer & Poison Expert',age:61,reason:'To find a cure for a disease that has no name.',vocab:'Plant names, symptoms, remedies, body parts',icon:'herbalist'},{id:'knight',name:'⚔️ Disgraced Knight',identity:'Disgraced Knight',job:'Former Royal Guard',age:34,reason:'To regain my honor — or create a new one.',vocab:'Weapons, honor concepts, battle terms, past tense narration',icon:'knight'},{id:'gambler',name:'🃏 Mysterious Gambler',identity:'Mysterious Gambler',job:'Professional Risk-Taker',age:28,reason:'I bet the Devil I could out-lie him. He won. This is my penance.',vocab:'Probability, conditional phrases, bluffing terms',icon:'gambler'},{id:'poet',name:'✍️ Wandering Poet',identity:'Wandering Poet',job:'Collector of Untold Stories',age:25,reason:'Every poem I write brings me closer to the truth — or further from it.',vocab:'Rhyme, metaphor, emotional vocabulary, rhythm',icon:'poet'}];
var LOCATIONS=[{id:'square',name:'Village Square',icon:'🏛️',capacity:99,price:0,npc:null,rules:'Free social hub. Transfer coins, find companions.'},{id:'teahouse',name:'Tea House',icon:'🍵',capacity:8,price:5,npc:'Master Wei',npcVoice:{rate:0.8,pitch:0.9,lang:'en-GB'},rules:'5🪙 entry. Sip tea. Tell stories.'},{id:'tavern',name:'Tavern',icon:'🍺',capacity:8,price:8,npc:'Old Maggie',npcVoice:{rate:1.1,pitch:1.2,lang:'en-IE'},rules:'8🪙 entry. Drink. Exaggerate.'},{id:'restaurant',name:'Restaurant',icon:'🍽️',capacity:6,price:10,npc:'Chef Paulo',npcVoice:{rate:1,pitch:1,lang:'en-US'},rules:'10🪙 entry. Order food. Describe flavors.'},{id:'casino',name:'Casino',icon:'🎲',capacity:6,price:15,npc:'The Dealer',npcVoice:{rate:1.3,pitch:0.7,lang:'en-US'},rules:'15🪙 entry. Gamble with dice.'},{id:'farm',name:'Farm',icon:'🌾',capacity:2,price:0,npc:'Farmer Greta',npcVoice:{rate:0.75,pitch:0.8,lang:'en-US'},rules:'Free. Work for coins.'},{id:'dirtroad',name:'Dirt Road',icon:'🛤️',capacity:1,price:0,npc:'The Wanderer',npcVoice:{rate:0.9,pitch:1,lang:'en-US'},rules:'Free. Random encounters.'},{id:'chiefhouse',name:"Chief's House",icon:'🏛️',capacity:3,price:0,npc:'The Chief',npcVoice:{rate:0.6,pitch:0.5,lang:'en-GB'},rules:'Answer philosophical questions. Borrow coins.'}];

var cl=null,cid=null,chars=[],isAdmin=false,possessedNpc=null;
var mr=null,chunks=[],rec=false,recStart=0,recTimer=null;
var cAudio=null,cAudioMsg=null,selectedTemplate=null;

function $(id){return document.getElementById(id);}
function esc(s){var d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}
function fd(s){s=s||0;return Math.floor(s/60)+':'+(Math.floor(s%60)+'').padStart(2,'0');}
function av(s){return 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed='+encodeURIComponent(s)+'&backgroundColor=333333,555555,777777';}
function ban(msg,t){var b=document.createElement('div');b.className='feedback-banner';if(t==='gold')b.style.borderColor='var(--gold)';b.textContent=msg;document.body.appendChild(b);setTimeout(function(){b.remove();},3000);}
function tts(text,settings){if(!settings)settings={};var u=new SpeechSynthesisUtterance(text);u.rate=settings.rate||1;u.pitch=settings.pitch||1;u.lang=settings.lang||'en-US';speechSynthesis.speak(u);}

async function lc(){var r=await db.from('characters').select('*').eq('alive',true);if(r.data)chars=r.data;}
async function lt(){var r=await db.from('daily_tasks').select('*').eq('active',true).order('created_at',{ascending:false}).limit(1);if(r.data&&r.data.length){var d=r.data[0];var n=d.location_id==='all'?'All':(LOCATIONS.find(function(l){return l.id===d.location_id;})||{}).name||d.location_id;$('daily-task-text').textContent='['+n+'] '+d.task_text;}else{$('daily-task-text').textContent='No task today. Explore freely.';}}
async function ou(){if(!cid)return;var c=chars.find(function(x){return x.id===cid;});if(!c)return;var ex=await db.from('online_players').select('*').eq('char_id',cid);if(ex.data&&ex.data.length)await db.from('online_players').update({location_id:cl,last_seen:new Date()}).eq('char_id',cid);else await db.from('online_players').insert({char_id:cid,char_name:c.name,avatar_url:c.avatar_url,location_id:cl,last_seen:new Date()});lo();}
async function lo(){var r=await db.from('online_players').select('*').order('last_seen',{ascending:false});var p=r.data||[];$('online-count').textContent=p.length;$('online-list').innerHTML=p.map(function(x){var l=LOCATIONS.find(function(y){return y.id===x.location_id;});return '<div class="online-player"><img src="'+(x.avatar_url||av(x.char_name))+'" onerror="this.src=\''+av('fb')+'\'"><span>'+esc(x.char_name)+'</span><span class="loc">@ '+(l?l.icon:'?')+' '+(l?l.name:'?')+'</span></div>';}).join('');}
async function co(){await db.from('online_players').delete().lt('last_seen',new Date(Date.now()-120000).toISOString());}
setInterval(co,60000);setInterval(function(){if(cid)ou();},30000);

function rl(){$('location-list').innerHTML=LOCATIONS.map(function(l){var cnt=(cl===l.id&&cid)?1:0;return '<div class="location-card'+(cl===l.id?' active':'')+(l.price===0?' free':'')+'" data-loc="'+l.id+'"><div>'+l.icon+' <strong>'+l.name+'</strong></div><div class="price">'+(l.price>0?'🪙 '+l.price:'Free')+'</div><div class="capacity'+(cnt>=l.capacity?' full':'')+'">'+cnt+'/'+l.capacity+'</div><div class="capacity">'+(l.npc?'👤 '+l.npc:'')+'</div></div>';}).join('');}
async function el(id){
    if(id===cl)return;
    var l=LOCATIONS.find(function(x){return x.id===id;});if(!l)return;
    var c=chars.find(function(x){return x.id===cid;});
    if(l.price>0&&c){
        if(c.coins<l.price){alert('Not enough coins! You need 🪙 '+l.price+'. Go to the Farm or Dirt Road to earn more.');return;}
        await db.from('characters').update({coins:c.coins-l.price}).eq('id',cid);c.coins-=l.price;updateCoins();
    }
    cl=id;$('chat-title').textContent=l.icon+' '+l.name;$('scene-info').textContent=(l.npc?'👤 '+l.npc+' — ':'')+l.rules;rl();lm();uu();ou();
    if(l.npc){greetNpc(l);}
}
async function greetNpc(l){
    var c=chars.find(function(x){return x.id===cid;});if(!c)return;
    var greetings=['Welcome, traveler. Tell me — who are you, really?'];
    if(c.template==='sailor')greetings=['A sailor! Tell me about the sea.','What brings a seafarer to a landlocked village?'];
    else if(c.template==='merchant')greetings=["A merchant, eh? What's the most valuable thing you've ever traded?","Buy low, sell high. But what do you value that has no price?"];
    else if(c.template==='knight')greetings=['A knight without a kingdom. What are you fighting for now?','Honor is heavy armor. What are you carrying?'];
    var msg=greetings[Math.floor(Math.random()*greetings.length)];
    var ttsSet=l.npcVoice||{};
    await db.from('messages').insert({location_id:cl,char_id:null,char_name:l.npc,text:msg,type:'npc',sender_type:'npc',npc_name:l.npc,tts_settings:ttsSet});
    tts(msg,ttsSet);
}
async function lm(){if(!cl)return;var r=await db.from('messages').select('*').eq('location_id',cl).order('created_at',{ascending:true}).limit(50);rm(r.data||[]);}
function rm(ms){
    if(!ms.length){$('messages').innerHTML='<div class="message system">Silence.</div>';return;}
    $('messages').innerHTML=ms.map(function(m){
        if(m.type==='system')return '<div class="message system">'+esc(m.text)+'</div>';
        if(m.type==='event')return '<div class="message event">🌩️ '+esc(m.text)+'</div>';
        if(m.type==='challenge')return '<div class="message event">🎤 <b>Challenge:</b> '+esc(m.text)+' <span style="color:var(--gold);">🪙 '+(m.tts_settings?m.tts_settings.reward:'')+'</span></div>';
        if(m.sender_type==='npc'){
            var badge=(m.char_name&&m.char_name.indexOf('👑')>=0)?'<span class="admin-badge">Tessa</span>':'<span class="npc-badge">NPC</span>';
            return '<div class="message npc"><div class="sender">🤖 '+esc(m.npc_name||m.char_name||'NPC')+badge+'</div><div>'+esc(m.text)+'</div><button class="npc-speak-btn" data-text="'+esc(m.text.replace(/"/g,'&quot;'))+'" data-tts=\''+JSON.stringify(m.tts_settings||{})+'\'>🔊 Listen</button></div>';
        }
        var own=m.char_id===cid;var c=chars.find(function(x){return x.id===m.char_id;});var avt=c?(c.avatar_url||av(c.name)):av(m.char_name||'?');var cnt;
        if(m.audio_url){cnt='<div class="voice-msg" data-audio="'+m.audio_url+'" data-dur="'+(m.duration||0)+'" data-msgid="'+m.id+'"><span class="play-icon">▶</span><span class="duration">'+fd(m.duration)+'</span><div class="progress-bar"><div class="progress-fill"></div></div></div>';}
        else{cnt='<div>'+esc(m.text)+'</div>';}
        return '<div class="message '+(own?'own':'other')+'"><div class="sender"><img src="'+avt+'" onerror="this.src=\''+av('fb')+'\'"> '+esc(m.char_name||'Ghost')+'</div>'+cnt+(own?'':'<button class="report-btn" data-char="'+m.char_id+'" data-msg="'+m.id+'">!</button>')+'</div>';
    }).join('');$('messages').scrollTop=$('messages').scrollHeight;
}
function am(m){
    if(m.type==='system'){$('messages').insertAdjacentHTML('beforeend','<div class="message system">'+esc(m.text)+'</div>');}
    else if(m.type==='event'){$('messages').insertAdjacentHTML('beforeend','<div class="message event">🌩️ '+esc(m.text)+'</div>');}
    else if(m.type==='challenge'){$('messages').insertAdjacentHTML('beforeend','<div class="message event">🎤 <b>Challenge:</b> '+esc(m.text)+'</div>');}
    else if(m.sender_type==='npc'){
        var badge=(m.char_name&&m.char_name.indexOf('👑')>=0)?'<span class="admin-badge">Tessa</span>':'<span class="npc-badge">NPC</span>';
        $('messages').insertAdjacentHTML('beforeend','<div class="message npc"><div class="sender">🤖 '+esc(m.npc_name||m.char_name||'NPC')+badge+'</div><div>'+esc(m.text)+'</div><button class="npc-speak-btn" data-text="'+esc(m.text.replace(/"/g,'&quot;'))+'" data-tts=\''+JSON.stringify(m.tts_settings||{})+'\'>🔊 Listen</button></div>');
    }else{
        var own=m.char_id===cid;var c=chars.find(function(x){return x.id===m.char_id;});var avt=c?(c.avatar_url||av(c.name)):av(m.char_name||'?');var cnt;
        if(m.audio_url){cnt='<div class="voice-msg" data-audio="'+m.audio_url+'" data-dur="'+(m.duration||0)+'" data-msgid="'+m.id+'"><span class="play-icon">▶</span><span class="duration">'+fd(m.duration)+'</span><div class="progress-bar"><div class="progress-fill"></div></div></div>';}
        else{cnt='<div>'+esc(m.text)+'</div>';}
        $('messages').insertAdjacentHTML('beforeend','<div class="message '+(own?'own':'other')+'"><div class="sender"><img src="'+avt+'" onerror="this.src=\''+av('fb')+'\'"> '+esc(m.char_name||'Ghost')+'</div>'+cnt+(own?'':'<button class="report-btn" data-char="'+m.char_id+'" data-msg="'+m.id+'">!</button>')+'</div>');
    }
    $('messages').scrollTop=$('messages').scrollHeight;
}
function sub(){
    db.channel('m').on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},function(p){if(p.new.location_id===cl&&p.new.type!=='system')am(p.new);}).subscribe();
    db.channel('r').on('postgres_changes',{event:'*',schema:'public',table:'reports'},ug).subscribe();
    db.channel('g').on('postgres_changes',{event:'*',schema:'public',table:'graveyard'},uv).subscribe();
    db.channel('o').on('postgres_changes',{event:'*',schema:'public',table:'online_players'},lo).subscribe();
    db.channel('d').on('postgres_changes',{event:'*',schema:'public',table:'daily_tasks'},lt).subscribe();
    db.channel('ev').on('postgres_changes',{event:'INSERT',schema:'public',table:'village_events'},function(p){if(cl&&(p.new.target_location==='all'||p.new.target_location===cl)){ban('🌩️ '+p.new.event_text,'gold');}}).subscribe();
    db.channel('ch').on('postgres_changes',{event:'INSERT',schema:'public',table:'challenges'},function(p){if(cl&&p.new.location_id===cl){am({type:'challenge',text:p.new.challenge_text,tts_settings:{reward:p.new.reward}});}}).subscribe();
}

async function sm(){
    if(!cl||!cid)return;var t=$('chat-input').value.trim();if(!t)return;
    if(/[\u4e00-\u9fff]/.test(t)){alert('English only!');return;}
    var c=chars.find(function(x){return x.id===cid;});
    var l=LOCATIONS.find(function(x){return x.id===cl;});
    var npcReply=checkNpcKeywords(t,l);
    await db.from('messages').insert({location_id:cl,char_id:cid,char_name:c.name,text:t,type:'chat',sender_type:'player'});
    $('chat-input').value='';
    var earned=1;if(t.split(' ').length>5)earned=2;
    await db.from('characters').update({coins:c.coins+earned,total_earned:(c.total_earned||0)+earned}).eq('id',cid);c.coins+=earned;updateCoins();
    if(npcReply){setTimeout(async function(){await sendNpcReply(l,npcReply);},1500);}
}
function checkNpcKeywords(text,location){
    if(!location||!location.npc)return null;var t=text.toLowerCase();
    var keywords={storm:'Tell me more about that... was it frightening?',ocean:'The ocean holds many secrets. What did YOU see out there?',money:'Money comes and goes. What cannot be bought?',secret:'Everyone here has secrets. Is yours heavy to carry?',fear:'Fear is the only honest emotion left. What do YOU fear?',maybe:'No maybes! Speak with conviction!',luck:'Luck is an excuse. What are you really relying on?',truth:'Truth in this village? How refreshing. Or is that also a lie?',love:'Love! Now that is a topic worth a drink. Tell me more.',death:'Death is just another village, they say. Have you been there?'};
    for(var k in keywords){if(t.indexOf(k)>=0)return keywords[k];}return null;
}
async function sendNpcReply(loc,text){
    if(possessedNpc&&possessedNpc===loc.npc)return;
    var ttsSet=loc.npcVoice||{};
    await db.from('messages').insert({location_id:cl,char_id:null,char_name:loc.npc,text:text,type:'npc',sender_type:'npc',npc_name:loc.npc,tts_settings:ttsSet});
    tts(text,ttsSet);
}

function toggleVoice(){if(!cl||!cid){alert('Enter a location first.');return;}if(rec){stopAndSend();}else{startRec();}}
async function startRec(){if(rec)return;try{var stream=await navigator.mediaDevices.getUserMedia({audio:true});mr=new MediaRecorder(stream,{mimeType:'audio/webm;codecs=opus'});chunks=[];recStart=Date.now();mr.ondataavailable=function(e){if(e.data.size>0)chunks.push(e.data);};mr.onstop=async function(){stream.getTracks().forEach(function(t){t.stop();});clearInterval(recTimer);$('recording-status').style.display='none';if(chunks.length===0){rv();return;}var dur=(Date.now()-recStart)/1000;var blob=new Blob(chunks,{type:'audio/webm'});var c=chars.find(function(x){return x.id===cid;});var path='v_'+Date.now()+'.webm';var up=await db.storage.from('voice_messages').upload(path,blob,{contentType:'audio/webm',cacheControl:'3600'});if(up.error){alert('Upload failed.');rv();return;}var url=db.storage.from('voice_messages').getPublicUrl(path);await db.from('messages').insert({location_id:cl,char_id:cid,char_name:c.name,audio_url:url.data.publicUrl,type:'chat',sender_type:'player',duration:Math.round(dur)});var earned=5;await db.from('characters').update({coins:c.coins+earned,total_earned:(c.total_earned||0)+earned}).eq('id',cid);c.coins+=earned;updateCoins();rv();};mr.start(100);rec=true;$('voice-btn').classList.add('recording');$('voice-btn').textContent='⏹';$('recording-status').style.display='inline';recTimer=setInterval(function(){$('recording-status').textContent='🔴 '+Math.floor((Date.now()-recStart)/1000)+'s';},500);}catch(e){alert('Microphone needed.');}}
function stopAndSend(){if(mr&&rec&&mr.state==='recording'){mr.stop();}}
function rv(){$('voice-btn').classList.remove('recording');$('voice-btn').textContent='🎤';$('recording-status').style.display='none';rec=false;}
function pa(url,el){if(cAudio){cAudio.pause();if(cAudioMsg){cAudioMsg.classList.remove('playing');cAudioMsg.querySelector('.play-icon').textContent='▶';cAudioMsg.querySelector('.progress-fill').style.width='0%';}if(cAudioMsg===el){cAudio=null;cAudioMsg=null;return;}}var a=new Audio(url);cAudio=a;cAudioMsg=el;el.classList.add('playing');el.querySelector('.play-icon').textContent='⏸';var pf=el.querySelector('.progress-fill');var td=parseFloat(el.dataset.dur)||0;a.ontimeupdate=function(){if(a.duration&&td>0)pf.style.width=Math.min((a.currentTime/td)*100,100)+'%';};a.onended=function(){el.classList.remove('playing');el.querySelector('.play-icon').textContent='▶';pf.style.width='0%';cAudio=null;cAudioMsg=null;};a.onerror=function(){el.querySelector('.play-icon').textContent='⚠️';};a.play().catch(function(){el.querySelector('.play-icon').textContent='▶';});}

function showTemplates(){$('template-list').innerHTML=TEMPLATES.map(function(t){return '<div class="template-card" data-tid="'+t.id+'"><strong>'+t.name+'</strong><div style="font-size:.65em;color:var(--text-dark);">'+t.identity+' — '+t.job+'</div><div style="font-size:.6em;color:var(--gold);">📚 '+t.vocab+'</div></div>';}).join('');$('modal-template').classList.remove('hidden');}
function selectTemplate(tid){var t=TEMPLATES.find(function(x){return x.id===tid;});if(!t)return;selectedTemplate=t;$('modal-template').classList.add('hidden');$('modal-char-title').textContent='Create: '+t.name;$('char-name').value='';$('char-identity').value=t.identity;$('char-job').value=t.job;$('char-age').value=t.age;$('char-reason').value=t.reason;$('char-avatar-seed').value=t.icon;ua();$('modal-character').classList.remove('hidden');}
function rs(){var s=['cat','dog','fox','owl','bear','wolf','raven','lynx','hawk','deer'];return s[Math.floor(Math.random()*s.length)]+Math.floor(Math.random()*1000);}
function ua(){$('avatar-preview').src=av($('char-avatar-seed').value.trim()||$('char-name').value.trim()||'wanderer');}
async function sc2(){var n=$('char-name').value.trim(),id=$('char-identity').value.trim(),j=$('char-job').value.trim(),a=parseInt($('char-age').value),r=$('char-reason').value.trim();var sd=$('char-avatar-seed').value.trim()||n||rs();var avt=av(sd);if(!n||!id||!j||!a||!r)return alert('All fields required.');if(/[\u4e00-\u9fff]/.test(n+id+j+r))return alert('English only!');var tmpl=selectedTemplate?selectedTemplate.id:null;var res=await db.from('characters').insert({name:n,identity:id,job:j,age:a,reason:r,avatar_url:avt,alive:true,template:tmpl,coins:200,total_earned:0}).select().single();if(res.data){cid=res.data.id;localStorage.setItem('liars_world_current_char',res.data.id);await lc();$('modal-character').classList.add('hidden');selectedTemplate=null;uu();rl();ou();updateCoins();var wlcm='📜 A worn letter appears... "Welcome, '+n+'. You have been granted 200 coins. Speak, learn, and remember — every identity teaches something. The Village awaits."';await db.from('messages').insert({location_id:'square',text:wlcm,type:'system'});}}
function updateCoins(){var c=chars.find(function(x){return x.id===cid;});$('coins-display').textContent='🪙 '+(c?c.coins:0);}

function openDice(){if(!cl||cl!=='casino')return;$('dice-balance').textContent='Your balance: 🪙 '+(chars.find(function(x){return x.id===cid;})||{}).coins;$('dice-result').innerHTML='';$('modal-dice').classList.remove('hidden');}
async function rollDice(){var c=chars.find(function(x){return x.id===cid;});var bet=parseInt($('dice-bet').value);var guess=$('dice-guess').value;if(bet<5||bet>20)return alert('Bet 5-20 coins.');if(c.coins<bet)return alert('Not enough coins.');var d1=Math.floor(Math.random()*6)+1,d2=Math.floor(Math.random()*6)+1,sum=d1+d2;var won=false,mult=0;if(guess==='big'&&sum>=7){won=true;mult=1;}else if(guess==='small'&&sum<=6){won=true;mult=1;}else if(guess==='exact7'&&sum===7){won=true;mult=5;}var change=won?bet*mult:-bet;await db.from('characters').update({coins:c.coins+change}).eq('id',cid);c.coins+=change;updateCoins();$('dice-result').innerHTML='<div class="dice-result">🎲 '+d1+' + '+d2+' = <b>'+sum+'</b></div><p style="font-size:.8em;">'+(won?'🎉 You won 🪙 '+bet*mult+'!':'💀 You lost 🪙 '+bet+'.')+'</p>';}

function openTransfer(targetCharId){var c=chars.find(function(x){return x.id===cid;});if(!c)return;$('transfer-target').innerHTML=chars.filter(function(x){return x.id!==cid;}).map(function(x){return '<option value="'+x.id+'"'+(x.id===targetCharId?' selected':'')+'>'+esc(x.name)+' ('+esc(x.identity)+')</option>';}).join('');$('modal-transfer').classList.remove('hidden');}
async function confirmTransfer(){var toId=$('transfer-target').value;var amount=parseInt($('transfer-amount').value);var c=chars.find(function(x){return x.id===cid;});if(amount<5||amount>100)return alert('Amount: 5-100.');if(c.coins-amount<20)return alert('Must keep at least 20 coins.');if(!toId)return alert('Select a recipient.');var to=chars.find(function(x){return x.id===toId;});await db.from('characters').update({coins:c.coins-amount}).eq('id',cid);c.coins-=amount;await db.from('characters').update({coins:to.coins+amount}).eq('id',toId);to.coins+=amount;await db.from('coin_transfers').insert({from_char_id:cid,to_char_id:toId,amount:amount});$('modal-transfer').classList.add('hidden');updateCoins();ban('Sent 🪙 '+amount+' to '+to.name+'.');}

function al(){if($('admin-password').value===ADMIN_PASSWORD){isAdmin=true;$('admin-login').classList.add('hidden');$('admin-content').classList.remove('hidden');pa2();ban('Welcome, Tessa.','gold');}else{alert('Wrong password.');}}
function pa2(){$('admin-task-location').innerHTML='<option value="all">All</option>'+LOCATIONS.map(function(l){return '<option value="'+l.id+'">'+l.icon+' '+l.name+'</option>';}).join('');$('admin-event-loc').innerHTML='<option value="all">All Locations</option>'+LOCATIONS.map(function(l){return '<option value="'+l.id+'">'+l.icon+' '+l.name+'</option>';}).join('');$('admin-challenge-loc').innerHTML=LOCATIONS.map(function(l){return '<option value="'+l.id+'">'+l.icon+' '+l.name+'</option>';}).join('');$('admin-possess-npc').innerHTML='<option value="">-- Select NPC --</option>'+LOCATIONS.filter(function(l){return l.npc;}).map(function(l){return '<option value="'+l.id+'">'+l.npc+' @ '+l.name+'</option>';}).join('');$('admin-memorialize').innerHTML='<option value="">-- Select --</option>'+chars.map(function(c){return '<option value="'+c.id+'">'+esc(c.name)+' ('+esc(c.identity)+')</option>';}).join('');}
async function possessNpc(){var locId=$('admin-possess-npc').value;if(!locId)return;var l=LOCATIONS.find(function(x){return x.id===locId;});if(!l||!l.npc)return;possessedNpc=l.npc;await db.from('npc_possession').update({possessed:true,possessed_by:'Tessa'}).eq('location_id',locId);await db.from('messages').insert({location_id:locId,text:'👑 Tessa is now speaking as '+l.npc+'.',type:'system'});ban('Possessing '+l.npc+' at '+l.name,'gold');}
async function unpossessNpc(){if(!possessedNpc)return;var loc=LOCATIONS.find(function(x){return x.npc===possessedNpc;});if(loc){await db.from('npc_possession').update({possessed:false}).eq('location_id',loc.id);await db.from('messages').insert({location_id:loc.id,text:possessedNpc+' has returned to their usual self.',type:'system'});}possessedNpc=null;ban('Released NPC.','gold');}
async function sendEvent(){var text=$('admin-event-text').value.trim();var loc=$('admin-event-loc').value;if(!text)return;await db.from('village_events').insert({event_text:text,target_location:loc});$('admin-event-text').value='';ban('Event broadcasted!','gold');}
async function sendChallenge(){var text=$('admin-challenge-text').value.trim();var loc=$('admin-challenge-loc').value;var reward=parseInt($('admin-challenge-reward').value)||30;if(!text||!loc)return;await db.from('challenges').insert({location_id:loc,challenge_text:text,reward:reward});$('admin-challenge-text').value='';ban('Challenge published!','gold');}
async function memorialize(){var charId=$('admin-memorialize').value;var reason=$('admin-death-reason').value.trim();if(!charId||!reason)return;var c=chars.find(function(x){return x.id===charId;});await db.from('characters').update({alive:false}).eq('id',charId);await db.from('graveyard').insert({char_id:charId,char_name:c.name,reason:reason});await lc();uv();pa2();if(cid===charId){cid=null;uu();}ban('🪦 '+c.name+' has been memorialized.','gold');}
async function st2(){if(!isAdmin)return;var l=$('admin-task-location').value,t=$('admin-task-text').value.trim();if(!t)return;await db.from('daily_tasks').update({active:false}).eq('active',true);await db.from('daily_tasks').insert({location_id:l,task_text:t,active:true});ban('Task published!');$('admin-task-text').value='';lt();}
async function dv(){if(!isAdmin)return;var mid=$('admin-delete-voice').value.trim();if(!mid)return;await deleteVoiceById(mid);}
async function deleteVoiceById(mid){var r=await db.from('messages').select('*').eq('id',mid).single();if(r.data&&r.data.audio_url){var p=r.data.audio_url.split('/').pop();await db.storage.from('voice_messages').remove([p]);}await db.from('messages').delete().eq('id',mid);ban('Deleted.');$('admin-delete-voice').value='';if(cl)lm();}
function ao(){isAdmin=false;$('admin-login').classList.remove('hidden');$('admin-content').classList.add('hidden');$('admin-password').value='';possessedNpc=null;ban('Logged out.');}

function uu(){us();var c=chars.find(function(x){return x.id===cid;});var d=$('current-role-display');if(c){d.innerHTML='<img src="'+(c.avatar_url||av(c.name))+'" onerror="this.src=\''+av('fb')+'\'"> '+esc(c.name);d.style.color='#c9a96e';}else{d.innerHTML='👤 Not in character';d.style.color='#8b7d6b';}var act=!!(cid&&cl);$('chat-input').disabled=!act;$('send-btn').disabled=!act;$('voice-btn').disabled=!act;updateCoins();}
function us(){$('speak-as').innerHTML='<option value="">-- Speak as... --</option>'+chars.map(function(c){return '<option value="'+c.id+'"'+(c.id===cid?' selected':'')+'>'+esc(c.name)+'</option>';}).join('');}
async function ug(){var r=await db.from('reports').select('*').eq('status','pending').order('created_at',{ascending:false});$('report-count').textContent=r.data?r.data.length:0;if(!r.data||!r.data.length){$('report-list').innerHTML='<p>No pending reports.</p>';return;}$('report-list').innerHTML=r.data.map(function(x){return '<div style="background:#111;padding:6px;margin-bottom:4px;border-radius:3px;font-size:.7em;"><div><b>Target:</b> '+esc(x.reported_char_id)+'</div><div><b>Flaw:</b> '+esc(x.reason)+'</div><div style="margin-top:4px;"><button data-report="'+x.id+'" data-action="dismiss" class="btn small">✅ Dismiss</button></div></div>';}).join('');}
async function uv(){var r=await db.from('graveyard').select('*').order('death_time',{ascending:false});$('grave-count').textContent=r.data?r.data.length:0;if(!r.data||!r.data.length){$('tombstone-list').innerHTML='<p>The Memorial Garden is empty.</p>';return;}$('tombstone-list').innerHTML=r.data.map(function(g){return '<div style="padding:6px 0;border-bottom:1px solid #3a2a1a;"><div>🪦 <b>'+esc(g.char_name)+'</b></div><div style="font-size:.6em;color:var(--text-dark);">'+esc(g.reason||'Departed')+'</div><div style="font-size:.6em;color:var(--gold);">✦ The Village Remembers ✦</div></div>';}).join('');}
async function cg(){var r=await db.from('graveyard').select('*').eq('revivable',false);if(!r.data)return;for(var i=0;i<r.data.length;i++){var g=r.data[i];if((Date.now()-new Date(g.death_time).getTime())>600000)await db.from('graveyard').update({revivable:true}).eq('id',g.id);}}
function sc(cid2){var c=cid2?chars.find(function(x){return x.id===cid2;}):chars.find(function(x){return x.id===cid;});if(!c)return;$('character-card-content').innerHTML='<div style="text-align:center;margin-bottom:10px;"><img src="'+(c.avatar_url||av(c.name))+'" style="width:50px;height:50px;border-radius:50%;"><h3 style="color:var(--gold);margin-top:4px;">'+esc(c.name)+'</h3></div><p><b>Identity:</b> '+esc(c.identity)+'</p><p><b>Occupation:</b> '+esc(c.job)+'</p><p><b>Age:</b> '+c.age+'</p><p><b>Reason:</b> '+esc(c.reason)+'</p><p>🪙 <b>Coins:</b> '+c.coins+'</p>';$('modal-character-card').dataset.targetId=c.id;$('modal-character-card').classList.remove('hidden');}

document.addEventListener('click',async function(e){
    var card=e.target.closest('.location-card');if(card){el(card.dataset.loc);return;}
    var tmplCard=e.target.closest('.template-card');if(tmplCard){selectTemplate(tmplCard.dataset.tid);return;}
    var vm=e.target.closest('.voice-msg');if(vm&&!e.target.closest('.report-btn')&&!e.target.closest('.npc-speak-btn')){pa(vm.dataset.audio,vm);return;}
    if(e.target.classList.contains('npc-speak-btn')){var t2=e.target.dataset.text;var s=JSON.parse(e.target.dataset.tts||'{}');tts(t2,s);return;}
    if(e.target.classList.contains('report-btn')){ban('Report noted. NPC will follow up.');return;}
    if(e.target.dataset.report&&e.target.dataset.action){await db.from('reports').update({status:'dismissed'}).eq('id',e.target.dataset.report);ug();return;}
    if(e.target.dataset.revive){await db.from('graveyard').delete().eq('id',e.target.dataset.grave);await db.from('characters').delete().eq('id',e.target.dataset.revive);await lc();uv();showTemplates();}
    var sEl=e.target.closest('.sender');if(sEl&&!e.target.closest('.voice-msg')&&!e.target.closest('.report-btn')){var mEl=sEl.closest('.message');if(mEl&&mEl.classList.contains('other')){var rb=mEl.querySelector('.report-btn');if(rb)sc(rb.dataset.char);}}
});

$('btn-create-char').onclick=function(){selectedTemplate=null;showTemplates();};
$('btn-custom-identity').onclick=function(){$('modal-template').classList.add('hidden');$('modal-char-title').textContent='Create Your Identity';$('char-name').value='';$('char-identity').value='';$('char-job').value='';$('char-age').value='';$('char-reason').value='';$('char-avatar-seed').value=rs();ua();$('modal-character').classList.remove('hidden');};
$('btn-random-avatar').onclick=function(){$('char-avatar-seed').value=rs();ua();};
$('char-avatar-seed').oninput=ua;$('char-name').oninput=ua;
$('btn-cancel-char').onclick=function(){$('modal-character').classList.add('hidden');};
$('btn-submit-char').onclick=sc2;
$('btn-close-card').onclick=function(){$('modal-character-card').classList.add('hidden');};
$('btn-send-coins-card').onclick=function(){var tid=$('modal-character-card').dataset.targetId;$('modal-character-card').classList.add('hidden');openTransfer(tid);};
$('btn-online').onclick=function(){$('online-panel').classList.toggle('hidden');lo();};
$('btn-graveyard').onclick=function(){$('graveyard').classList.toggle('hidden');};
$('btn-guide').onclick=function(){$('guide-panel').classList.toggle('hidden');};
$('btn-admin').onclick=function(){$('admin-panel').classList.toggle('hidden');if(!isAdmin){$('admin-login').classList.remove('hidden');$('admin-content').classList.add('hidden');}else{pa2();}};
$('btn-admin-login').onclick=al;$('admin-password').onkeydown=function(e){if(e.key==='Enter')al();};
$('btn-possess').onclick=possessNpc;$('btn-unpossess').onclick=unpossessNpc;
$('btn-send-event').onclick=sendEvent;$('btn-send-challenge').onclick=sendChallenge;
$('btn-memorialize').onclick=memorialize;$('btn-set-task').onclick=st2;
$('btn-delete-voice').onclick=dv;$('btn-admin-logout').onclick=ao;
$('send-btn').onclick=sm;$('chat-input').onkeydown=function(e){if(e.key==='Enter')sm();};
$('voice-btn').onclick=function(e){e.preventDefault();toggleVoice();};
$('btn-roll-dice').onclick=rollDice;$('btn-close-dice').onclick=function(){$('modal-dice').classList.add('hidden');};
$('btn-cancel-transfer').onclick=function(){$('modal-transfer').classList.add('hidden');};
$('btn-confirm-transfer').onclick=confirmTransfer;
$('speak-as').onchange=function(){cid=this.value||null;if(cid)localStorage.setItem('liars_world_current_char',cid);else localStorage.removeItem('liars_world_current_char');uu();ou();};
window.addEventListener('beforeunload',function(){if(cid)db.from('online_players').delete().eq('char_id',cid);});

(async function init(){await lc();await lt();rl();us();uv();ug();lo();sub();setInterval(cg,5000);var sv=localStorage.getItem('liars_world_current_char');if(sv&&chars.find(function(c){return c.id===sv&&c.alive;})){cid=sv;uu();ou();}console.log('✅ Ready');})();
})();