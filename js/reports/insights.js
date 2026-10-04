/* Result explanations use observed task data, not diagnoses or population claims. */
(function (global, document) {
'use strict';
const A = global.AurorIQ = global.AurorIQ || {};
const titles = {iq:'Reasoning profile',memory:'Memory span',reaction:'Reaction time',processingspeed:'Processing speed',focus:'Focus task',spatial:'Spatial reasoning',logical:'Logical reasoning',verbal:'Verbal reasoning',numerical:'Numerical reasoning',reading:'Reading and comprehension',creativity:'Idea generation',career:'Career interests',workvalues:'Work values',workstyle:'Work preferences',studyhabits:'Study habits',interviewreadiness:'Interview preparation',habitanalyzer:'Habit design',chronotype:'Daily energy preferences',timeaudit:'Weekly time audit',studyplanner:'Study plan'};
const domain = {
 pattern:['Pattern reasoning','Finding relationships in sequences and rules.','Write a proposed rule, then check it against every step in a new sequence.','Try five unfamiliar sequences. Explain why one plausible alternative rule fails.'],
 numeric:['Numerical reasoning','Interpreting quantities and numerical relationships.','Write the units and estimate the answer before calculating.','Solve five ratio or percentage problems, recording whether an error came from setup or arithmetic.'],
 verbal:['Verbal reasoning','Comparing meanings and relationships expressed in words.','State the relationship in an analogy as a short sentence before choosing an answer.','Compare two plausible answers and explain why one fits the precise wording better.'],
 spatial:['Spatial reasoning','Comparing forms across changes in position or orientation.','Choose a distinctive corner and track it through a rotation before comparing the whole shape.','Draw a simple shape in three orientations, then check each against the original.'],
 memory:['Working-memory tasks','Holding information while following the task instructions.','Break a real instruction into smaller steps and repeat the steps back before starting.','Try a short recall task once without aids, then use notes for the real task. Record which support helped.']
};
const studyActions={RET:'Close your notes and answer five questions from memory. Check each answer afterward.',SPA:'Put two short reviews of one topic on different days instead of one long review.',INT:'After learning one worked example, mix three problem types and explain which method each needs.',ELA:'Explain one concept in your own words and give a concrete example and a counterexample.',REG:'Choose a small study target, predict your quiz score, then compare the prediction with the result.'};
const habitActions={CUE:'Attach the action to one existing event: after breakfast, open the practice page.',EASE:'Reduce the habit to a two-minute version and put the materials within reach.',FREQ:'Choose three realistic opportunities this week and record whether you started.',REWARD:'After finishing, mark a visible check and write one sentence about what felt useful.',FIT:'Write why this habit matters to you; change its timing if it conflicts with a real obligation.'};
const interviewActions={RESEARCH:'Read the role description and write three links between its requirements and your experience.',STORIES:'Prepare one example using situation, task, action and result. Include what you personally did.',QUESTIONS:'Write two questions about the actual work and how success is evaluated.',LOGISTICS:'Check the meeting time, connection or route, documents and a backup contact method.',REHEARSAL:'Record a two-minute answer, listen once, and remove one vague claim or unnecessary detail.'};
const careerExperiments={R:'Build, repair or assemble something small and safe, and note which part held your attention.',I:'Use a small public dataset or a question from your studies to investigate one claim.',A:'Create a short piece of writing, a poster or a design from a clear brief.',S:'Explain a topic to someone who wants help and ask what made the explanation useful.',E:'Write a one-minute proposal for a small project and invite feedback on its value.',C:'Organize a sample budget or set of records and check it for errors.'};
const styleTasks={collab:'Try one task alone and a comparable task with a partner; compare output and effort.',structure:'Try a written checklist on one task and a flexible outline on another.',focus:'Compare one uninterrupted task block with a session containing planned task changes.',decisions:'Write your decision, one reason and one uncertainty before asking for another perspective.',energy:'Compare a task spread over short daily sessions with a similar task done in one planned block, leaving time to check both.',environment:'Compare two available work settings while keeping the task similar.'};
const num=(x)=>Number.isFinite(x)?Math.round(x*10)/10:null;
const val=(x,suffix='')=>num(x)===null?'Not available':num(x)+suffix;
const card=(heading,text)=>({heading,text});
// Plain-language interpretations stay attached to the evidence from this attempt.
const habitsMeaning = {
 RET:['checking what you can remember without notes','You give yourself a chance to discover gaps before an exam.','A page can feel familiar even when you cannot answer a question about it.','After one small section, close the book and write three answers from memory. Then correct them in another colour.'],
 SPA:['returning to material on different days','You make room to revisit learning instead of relying on one sitting.','Leaving all revision until the end makes it harder to see what you have forgotten.','Put one ten-minute review tomorrow and another three days later on your calendar. Use new questions each time.'],
 INT:['choosing between different problem-solving methods','You report practising more than one type of problem together.','A chapter heading can tell you which formula to use; a mixed paper does not give that clue.','Mix two familiar problem types. Before solving each one, write why its method fits.'],
 ELA:['explaining ideas in your own words','You try to connect facts to meaning, rather than only repeat the wording.','Knowing a definition can hide uncertainty about when it applies.','Explain the idea to an imaginary beginner. Add an example and a situation where it would not apply.'],
 REG:['checking and adjusting your study approach','You report monitoring what is working and changing course when needed.','Time spent studying can feel productive even when understanding has not improved.','Predict your score on five fresh questions, answer them, then use the mistakes to choose the next topic.'],
 CUE:['giving a habit a clear starting signal','You report using reminders or an existing routine to help you begin.','A plan such as “I will do it later” leaves the starting moment undecided.','Write: “After I finish breakfast, I will open my notebook at the desk.” Keep that cue visible.'],
 EASE:['making a habit easy to start','You report reducing the effort needed to begin.','A large first step can make you postpone even something you care about.','Set out the materials tonight. Make tomorrow’s minimum just two minutes, with permission to stop after that.'],
 FREQ:['repeating a habit regularly','You report giving the habit repeated opportunities in your routine.','An occasional long effort can leave the routine dependent on motivation.','Choose three specific opportunities this week. Mark each as started or missed; do not try to repay a missed day with a huge session.'],
 REWARD:['noticing progress after a habit','You report giving yourself a reason to recognise a completed effort.','When progress is invisible, repeating a small action can feel pointless.','After the action, mark one check and write what it helped you finish. Keep the record where you start.'],
 FIT:['fitting a habit around your real life','You report choosing a routine that suits your priorities and circumstances.','A routine copied from someone else may conflict with your time, energy or responsibilities.','Write why this habit matters to you. Move it to an available time, or reduce it until it fits your ordinary day.'],
 RESEARCH:['understanding the role before an interview','You report doing preparation about the work and employer.','An answer can sound polished but fail to address what this particular role needs.','Choose three requirements in the job description. For each, write one example from your own experience.'],
 STORIES:['supporting interview answers with examples','You report preparing evidence of what you have done.','Saying “I am hardworking” leaves the interviewer with no example to assess.','Prepare one story: the situation, your responsibility, your action and the outcome. Say what you personally did.'],
 QUESTIONS:['asking useful interview questions','You report preparing questions to understand the opportunity.','You may leave without knowing whether the daily work or support suits you.','Ask: “What would good progress in the first three months look like?” Add one question about training or everyday tasks.'],
 LOGISTICS:['handling interview arrangements','You report checking practical details before the interview.','A preventable delay or connection problem can interrupt otherwise good preparation.','Check the time zone, route or call link, documents and a backup contact. Do a brief equipment check the day before.'],
 REHEARSAL:['practising answers aloud','You report rehearsing instead of relying only on silent preparation.','An answer that sounds clear in your head may become long or vague when spoken.','Record a two-minute answer. Listen for the main point and one concrete example; remove the rest and record it again.']
};
const skillContext = {
 pattern:['recognising a rule and checking whether it holds','spotting a repeated pattern in a sequence or comparing two possible explanations','accepting the first rule that fits only part of a problem','Check your rule against every example, then deliberately look for one exception.'],
 numeric:['working through quantities and numerical relationships','estimating a cost, comparing percentages or setting up a calculation','mixing up the relationship between numbers before doing the arithmetic','Write what is known, what is asked and the units. Estimate first, then calculate and compare.'],
 verbal:['making precise distinctions between words and relationships','comparing two similar claims or explaining why one answer fits the wording better','choosing a familiar word without checking its exact meaning in the sentence','Put the relationship into your own sentence. Substitute each option and reject any that changes the meaning.'],
 spatial:['keeping track of a shape as its orientation changes','following a diagram or checking how parts fit together','confusing a rotation with a mirror image or losing track of one feature','Mark one corner or edge. Follow only that feature through the movement before comparing the whole shape.'],
 memory:['holding information while carrying out instructions','following a short sequence of steps without returning to the instructions','losing an earlier step while you work on a later one','Write the steps down, group related steps and check off each one as you finish.']
};
const questionSkills={
 series:['sequences','finding the rule that connects successive steps','Write the change between each pair. Test whether the same rule fits every step before extending it.'],
 oddoneout:['classification','recognising which feature the other options share','Name the property shared by the group. Check all options against that property rather than choosing the one that merely looks different.'],
 syllogism:['statements and conclusions','separating what must follow from what only seems possible','Draw small sets or invent a counterexample. If the statements can be true while the conclusion is false, the conclusion does not follow.'],
 deduction:['deduction','combining the given facts without adding assumptions','Write each given fact separately. Cross out choices that conflict with a fact; do not assume information the question has not supplied.'],
 analogy:['word relationships','recognising the same relationship in two different pairs','Describe the first pair in a short sentence, then apply that exact relationship to the second pair.'],
 synonym:['word meanings','distinguishing close meanings','Write a short sentence using the target word. Substitute the proposed answer and check that the meaning stays the same. Look up unfamiliar words after the attempt.'],
 antonym:['opposite meanings','identifying a precise opposite rather than a merely different word','Define the target word first, then name its opposite. Check that the option reverses that meaning.'],
 arithmetic:['arithmetic word problems','turning a written situation into a calculation','Underline what is being asked. Write the operation and units before calculating, then estimate whether the answer is plausible.'],
 ratio:['ratios and percentages','keeping the comparison base clear','Write what counts as the whole or one part. For a percentage, identify the base before multiplying or dividing.'],
 data:['interpreting data','reading the right values and comparing like with like','Check the headings and units, select only the values needed, and state the comparison before calculating.']
};

function coaching(kind,r,extra,report) {
 const out={strength:'',barrier:'',meaning:'',action:'',success:'',headline:''};
 const set=(headline,strength,barrier,meaning,action,success)=>Object.assign(out,{headline,strength,barrier,meaning,action,success});
 if(kind==='iq') {
  const rows=Object.entries(r.domains).filter(([k,v])=>skillContext[k]&&v.itemCount>0&&Number.isFinite(v.strengthIndex)).sort((a,b)=>b[1].strengthIndex-a[1].strengthIndex);
  const [hi,h]=rows[0],[lo,l]=rows[rows.length-1],tied=h.strengthIndex===l.strengthIndex;
  const top=rows.filter(([,v])=>v.strengthIndex===h.strengthIndex).map(([k])=>domain[k][0]).join(' and ');
  set(tied?'Your areas are tied; choose a useful skill to practise.':top+' stood out within your own profile.',
   tied?'Your area scores are tied, so this attempt does not identify one clear strength. Look for a question you solved and can explain without seeing its answer.':top+' received your highest score in this attempt. That makes '+skillContext[hi][0]+' a reasonable place to look for a strength. A higher score here is relative to your other areas, not proof that you are above average.',
   tied?'The score differences do not tell us where you struggle. Choose a task you actually find difficult rather than treating the displayed order as a ranking.':domain[lo][0]+' received a lower score than your strongest area. A difficulty to check is '+skillContext[lo][2]+'. The test does not establish that this is why you missed an item.',
   'An everyday example of '+domain[lo][0].toLowerCase()+' is '+skillContext[lo][1]+'. Think of a recent situation like this: did the difficulty happen there too, or only in the test?',
   skillContext[lo][3]+' Try it on three unfamiliar examples. Explain each step aloud so you can spot exactly where the process breaks down.',
   'You can explain the method and solve a fresh example without copying the worked answer. Count errors on new examples, not how familiar a retake feels.');
  report.sections=rows.map(([k,v])=>card(domain[k][0], 'Your score here was '+val(v.strengthIndex)+'/100, based on '+v.itemCount+' questions. This area concerns '+skillContext[k][0]+'. You might use it when '+skillContext[k][1]+'. If this is difficult, try this: '+skillContext[k][3]));
 }else if(habitsMeaning[Object.keys(r.scores||{})[0]]&&['studyhabits','habitanalyzer','interviewreadiness'].includes(kind)) {
  const rows=Object.entries(r.scores).sort((a,b)=>b[1]-a[1]),[hi,h]=rows[0],[lo,l]=rows[rows.length-1],tied=h===l;
  const strong=habitsMeaning[hi],weak=habitsMeaning[lo];
  set(tied?'Your ratings are tied. Start with the habit that matters most this week.':'Build on '+strong[0]+'; give '+weak[0]+' more attention.',
   h>=75?'Your answers suggest you already make a habit of '+strong[0]+'. '+strong[1]+' Keep using it while you work on the less consistent areas.':h>=50?'You report some use of '+strong[0]+', although it may not be consistent yet. '+strong[1]+' Look for one recent example before treating it as an established strength.':'You reported limited use of these practices. There is not enough here to call one an established strength. Start small: completing one repeatable action is more useful than a flattering label.',
   l>=75?'You rated every area highly. The next question is whether the preparation works when you need it. Check an actual outcome instead of inventing a weakness from the lowest number.':(tied?'No area stands out as uniquely weak. One useful starting point is ': 'The area you reported using least is ')+weak[0]+'. '+weak[2],
   kind==='studyhabits'?'For example, you could spend an hour reading and still struggle with a new question. Check what you can produce without help before deciding that more reading is the solution.':kind==='habitanalyzer'?'If you keep planning but do not begin, examine the starting conditions: when, where and how small the first step is. A missed action is information about the routine, not a verdict on your character.':'In an interview, preparation has to turn into a clear spoken answer or a practical arrangement. Use a short rehearsal to find what is actually missing.',
   l>=75?(kind==='interviewreadiness'?'Do one mock interview. Ask the listener to identify your main evidence and one unclear answer.':kind==='studyhabits'?'Try five unfamiliar questions with your notes closed. Use any errors to choose tomorrow’s review.':'Try your routine on an ordinary busy day. Write down what helped you start and what interrupted it.'):weak[3],
   kind==='studyhabits'?'You can answer fresh questions or explain the topic after a delay, without needing the page in front of you.':kind==='habitanalyzer'?'You start at the chosen cue on more of your planned opportunities. Track starts, not an unbroken streak.':'A listener can repeat your main point and the evidence behind it. You can answer a follow-up without memorising a script.');
  report.sections=rows.map(([k,v])=>{const m=habitsMeaning[k];return card(m[0][0].toUpperCase()+m[0].slice(1), 'Your rating: '+val(v)+'/100. '+(v>=75?'You report doing this regularly. '+m[1]:v>=50?'You report doing this sometimes. Make it easier to repeat on an ordinary day.':'You report doing this less often. '+m[2])+' Try: '+m[3]);});
 }else if(['logical','verbal','numerical'].includes(kind)) {
  const k=kind==='logical'?'pattern':kind==='numerical'?'numeric':'verbal',m=skillContext[k];
  const tiers=Object.entries(r.tiers||{}).map(([name,s])=>{const [c,n]=String(s).split('/').map(Number);return {name,c,n,rate:n?c/n:0};}).filter(t=>t.n);
  const missed=tiers.filter(t=>t.c<t.n).sort((a,b)=>a.rate-b.rate),perfect=r.correct===r.total;
  const focus=missed[0];
  set(perfect?'You solved every question shown. Your next step is a new challenge.':r.atChance?'Build a dependable method before chasing a higher score.':'You have correct solutions to build on. Focus on how the missed ones went wrong.',
   r.correct>0?'You solved '+r.correct+' of '+r.total+' questions correctly. '+(perfect?'You handled all the difficulty groups shown in this attempt.':tiers.filter(t=>t.c>0).map(t=>'On '+t.name+' questions you got '+t.c+' of '+t.n+' right').join('; ')+'.')+' Revisit a correct answer and explain why the other choices do not fit.':'This attempt does not yet show a correct solution to build on. That is a starting point for learning the method, not evidence that you cannot learn it.',
   perfect?'No errors appeared in this set. The unanswered question is whether the method transfers to unfamiliar questions; repeating known answers will not test that.':(focus?'Your largest share of errors was in the '+focus.name+' group ('+focus.c+' of '+focus.n+' correct). ':'')+'Check whether you misunderstood the question, did not know the method, or made a checking error. The score alone cannot distinguish these.',
   'This skill is useful when '+m[1]+'. A possible obstacle is '+m[2]+'. Use your missed questions to check whether that description fits you.',
   m[3]+' '+(perfect?'Choose three new, more demanding questions and justify each answer.':'Choose one missed question. Work it through without timing, write where your original reasoning changed, then try a new question of the same type.'),
   'You can solve a new question and explain why the answer follows. If you only recognise the old answer, continue practising the method.');

  if(extra.items?.length&&extra.answers) {
   const groups={};extra.items.forEach((it,i)=>{if(!questionSkills[it.type])return;const g=groups[it.type]||(groups[it.type]={key:it.type,c:0,n:0});g.n++;if(extra.answers[i]===it.answer)g.c++;});
   const rows=Object.values(groups).sort((a,b)=>b.c/b.n-a.c/a.n),best=rows[0],weak=rows.filter(g=>g.c<g.n).sort((a,b)=>a.c/a.n-b.c/b.n)[0];
   if(best&&best.c>0){const leaders=rows.filter(g=>g.c/g.n===best.c/best.n);out.strength='Your best accuracy was in '+leaders.map(g=>questionSkills[g.key][0]+' ('+g.c+' of '+g.n+' correct)').join(' and ')+'. '+(leaders.length===1?'Those questions involved '+questionSkills[best.key][1]+'. ':'These areas were tied. ')+'This is a strength within this small set. To build on it, explain one correct solution without looking at the answer.';}
   if(weak){const lows=rows.filter(g=>g.c/g.n===weak.c/weak.n);out.barrier='Your lowest accuracy was in '+lows.map(g=>questionSkills[g.key][0]+' ('+g.c+' of '+g.n+' correct)').join(' and ')+'. '+(lows.length>1?'Those areas were tied; you can begin with any one of them. ':'')+'Start with '+questionSkills[weak.key][0]+' and check where your reasoning changed from the correct method.';out.action=questionSkills[weak.key][2]+' Rework one missed item slowly, then try a new example without the answer in view.';out.meaning='These questions involve '+questionSkills[weak.key][1]+'. If you meet a similar difficulty outside the test, use the same checking step before deciding you cannot do the task.';}
   report.sections=rows.map(g=>card(questionSkills[g.key][0][0].toUpperCase()+questionSkills[g.key][0].slice(1)+' · '+g.c+' of '+g.n+' correct','This part asks you to practise '+questionSkills[g.key][1]+'. '+questionSkills[g.key][2]));
  }
 }else if(kind==='career'||kind==='workvalues') {
  const engine=A[kind==='career'?'careerEngine':'workValuesEngine'],meta=extra.dimInfo||engine?.DIM_INFO||{},rows=Object.entries(r.scores).sort((a,b)=>b[1]-a[1]),[hi,h]=rows[0],[lo,l]=rows[rows.length-1];
  const label=k=>meta[k]?.name||k,tied=h===l;
  set(tied?'Your priorities are tied. A real experience can help you separate them.':label(hi)+' matters more to you in these answers.',
   'This questionnaire identifies '+(kind==='career'?'interests':'priorities')+', not proven abilities. '+(tied?'Your answers give no clear first choice.':label(hi)+' was among your highest ratings ('+h+'/100). Use that as a direction to explore, then look for evidence of what you can actually do.'),
   kind==='career'?'Enjoying the idea of a career is different from enjoying its daily work. Your lower rating for '+label(lo)+' is not a limitation on your ability to learn it.':'A role may offer '+label(hi)+' while meeting another need less well. A low rating for '+label(lo)+' does not make it safe to ignore pay, safety, training or responsibilities.',
   kind==='career'?'Before committing to a course or career, try a small task from the work. Notice whether you enjoy the process, how you respond to difficulty and whether you want to improve.':'Imagine choosing between two actual roles. Write what each offers, what you would give up and which trade-off you could live with.',
   kind==='career'?(tied?'Choose one activity that interests you. ':careerExperiments[hi]+' ')+'Save the result of that activity and ask someone familiar with the work for one specific improvement.':'Write three must-haves and one preference you could compromise on. For '+label(hi)+', ask an employer for a recent example of how it works in practice.',
   kind==='career'?'You can name a task you enjoyed doing, a skill you need to learn and a realistic next step. A job title alone is not enough.':'You can explain your choice using real working conditions and acceptable trade-offs, rather than only the highest questionnaire score.');
  report.sections=rows.map(([k,v])=>card(label(k)+' · '+v+'/100',kind==='career'?'This is how much interest you reported in this area. A lower score is not a weakness. To explore it: '+careerExperiments[k]:'This is the importance you gave this value. To check whether an opportunity supports it, look for '+(meta[k]?.lookFor||'a concrete example from everyday work.')));
 }else if(kind==='workstyle') {
  const d=r.dimensions.slice().sort((a,b)=>Math.abs(b.pct-50)-Math.abs(a.pct-50))[0],middle=Math.abs(d.pct-50)<15;
  const name=d.pct<50?d.poleA:d.poleB;
  const trade={collab:['Working alone can reduce interruptions, but it can also delay feedback.','Working with others gives you feedback, but too many conversations can leave little time to finish.'],structure:['Flexibility leaves room to adapt, but an unclear finish line can let work drift.','Structure makes the next step clear, but the plan may need to change when new information arrives.'],focus:['Long focus blocks give a task room, but urgent messages still need an agreed checking time.','Variety can keep work interesting, but frequent switches can leave tasks half-finished.'],decisions:['Analysis can make your reasoning explicit, but waiting for complete certainty can delay a reversible decision.','An initial impression can suggest a direction, but it still needs checking against evidence.'],energy:['A steady pace spreads the effort, but an unexpected deadline may require a temporary change.','Bursts can help you start, but leaving everything to the last burst removes room for mistakes.'],environment:['Quiet may suit your preference, but it will not always be available. Plan one practical way to reduce interruptions.','A lively setting may appeal to you, but check whether your accuracy changes with the extra activity.']};
  set(middle?'Your work preferences are fairly balanced.':name+' is your clearest reported preference.',
   middle?'No strong preference stands out. That gives you several approaches to try, but it does not by itself establish adaptability as a skill.':'You report a preference for '+name.toLowerCase()+' work. Try arranging one task around that preference and check whether the output improves.',
   middle?'The useful question is which approach suits this particular task. A midpoint does not mean every environment works equally well for you.':trade[d.key][d.pct<50?0:1],
   'A preference becomes useful when you can connect it to an outcome: a completed task, fewer errors or clearer communication. It becomes limiting if you treat it as a rule you can never change.',
   styleTasks[d.key]+' Keep the time available and task difficulty similar. Write down what you finished, not only how comfortable you felt.',
   'You can choose a way of working for a reason and switch when the task calls for it. You do not need to move every preference toward the middle.');
  report.sections=r.dimensions.map(x=>card(x.poleA+' / '+x.poleB,'Your answers place you at '+val(x.pct)+'/100 toward '+x.poleB+'. '+(Math.abs(x.pct-50)<15?'Neither preference clearly dominates.':trade[x.key][x.pct<50?0:1])+' Try: '+styleTasks[x.key]));
 }else if(kind==='memory') {
  const f=r.forward.span,b=r.backward.span;
  set(f>b?'Keeping the order was easier than reversing it.':b>f?'You held a longer sequence when reversing it this time.':'You reached the same span in both tasks.',
   'You recalled sequences up to '+f+' digits forward and '+b+' backward. That is the level demonstrated here; build from a length you can handle accurately.',
   f>b?'Your span fell by '+(f-b)+' digits when you had to reverse the order. Holding information while changing it is a useful practice target.':'The two tasks did not show the usual simple “forward is higher” pattern in this attempt. Do not force a weakness from that result; start with a real task where you lose track.',
   'If you lose a step while doing a calculation or following instructions, reduce what you must hold at once. Writing an intermediate result can let you continue without restarting.',
   'Take one real multi-step task. Write a short checklist, repeat the first step back, and mark it complete before moving on. For optional recall practice, start below your recorded span and add one digit only after accurate attempts.',
   'You complete the real task with fewer forgotten steps or restarts. Better digit recall alone does not prove every kind of memory has improved.');
 }else if(kind==='reaction') {
  const spread=Math.max(...r.times)-Math.min(...r.times);
  set(r.falseStarts?'Wait for the signal before trying to get faster.':'You avoided early presses in this attempt.',
   'You completed '+r.times.length+' scored responses with a middle response time of '+val(r.median)+' ms. '+(!r.falseStarts?'You also waited for the signal without a recorded false start.':'Your valid responses provide a baseline you can compare under the same conditions.'),
   r.falseStarts?'There were '+r.falseStarts+' early presses. Anticipating the signal can make a fast-looking attempt unreliable.':'Your fastest and slowest recorded responses were '+val(spread)+' ms apart. Examine the whole set instead of treating the single fastest response as your usual speed.',
   'This task measures one simple response on this device. It cannot tell you how well you make complex decisions or perform in a sport.',
   'On your next attempt, keep your hand comfortably ready and wait for the colour change. Aim to finish with no early presses. Use the same device before comparing the middle response time.',
   'Your valid responses become more consistent without more false starts. Do not trade accuracy for one unusually fast press.');
 }else if(['spatial','processingspeed','focus'].includes(kind)) {
  const focus=kind==='focus',spatial=kind==='spatial',accuracy=r.accuracy,perfect=accuracy===100;
  const problem=focus?(r.commissionErrors>r.omissionErrors?'pressing when the rule says to wait':r.omissionErrors>r.commissionErrors?'missing a signal that needs a response':'both missed responses and unwanted presses'):spatial?'keeping track of a shape through rotation':'spotting small differences before responding';
  set(perfect?'Your accuracy was the strongest part of this attempt.':'Put reliable decisions ahead of a faster score.',
   'You responded correctly on '+val(accuracy)+'% of the task. '+(perfect?'You followed the task rule throughout the recorded trials.':accuracy>=80?'Most of your responses matched the rule; use the errors to decide what needs attention.':'Some parts still need practice before speed becomes a useful target.'),
   perfect?'No errors appeared here. Check whether you can keep that accuracy on fresh examples before trying to respond faster.':focus?'The recorded errors were '+r.commissionErrors+' unwanted presses and '+r.omissionErrors+' missed responses. Start by checking '+problem+'.':'The remaining errors make '+problem+' a useful place to practise. The result does not tell us whether the cause was haste, confusion or an interruption.',
   focus?'In ordinary work, distinguish “I acted too quickly” from “I missed something.” They call for different changes: a pause before acting, or a clearer cue to notice.':spatial?'For example, assembling a part from a diagram requires keeping its orientation clear. Track a marked edge instead of trying to hold the entire picture in mind.':'For example, checking two codes or rows of figures needs a consistent scan. Jumping around makes it harder to know which details you have compared.',
   focus?'Say the go/stop rule once before starting. Remove one interruption and practise a short block at a comfortable pace. Review the two error counts separately.':spatial?skillContext.spatial[3]+' Use three untimed examples before adding a timer.':'Compare five short pairs from left to right. Point to the exact difference before deciding. Add time pressure only after accurate practice.',
   'You make fewer errors on fresh trials under similar conditions. Only then compare your response time; a faster result with more errors is not the same improvement.');
 }else if(kind==='reading') {
  set(r.passed&&!r.tooFast?'Build on your comprehension before increasing your pace.':'Understanding the passage is your first priority.',
   'You answered '+val(r.comprehension?.correct)+' of '+val(r.comprehension?.total)+' questions correctly. '+(r.passed?'You met the comprehension threshold for this passage.':'Those answers show what you picked up; the missed questions show what to revisit.'),
   r.tooFast?'The recorded reading time was too short for the tool to interpret reliably. Repeat at a natural pace before drawing a conclusion about speed.':!r.passed?'You did not meet this passage’s comprehension threshold. A high words-per-minute number would not compensate for missing the meaning.':'A short quiz only checks selected details. You may still need to practise explaining the argument or remembering it later.',
   'When reading a textbook, finishing the page is not the same as being ready to answer a question. Stop and check whether you can state the main point without looking.',
   'Read one paragraph. Close it and write the main point and two supporting details. Reopen it, correct omissions, and then answer a new question. Increase the amount you read only while understanding holds.',
   'You can summarise an unfamiliar passage accurately and answer new questions about it. Compare pace only between passages of similar difficulty.');
 }else if(kind==='creativity') {
  set(r.fluency?'You have ideas to develop; now test their usefulness.':'Start by making ideas, before judging them.',
   r.fluency?'You produced '+r.fluency+' distinct accepted ideas. You now have options to select from rather than needing one perfect idea immediately.':'No distinct ideas were recorded. This timed attempt gives too little evidence to identify a creative strength; try a concrete prompt without the clock.',
   'The test counts ideas but cannot judge whether they are original, feasible or valuable. More entries can still repeat the same underlying approach.',
   'For a real project, useful creativity includes improving an idea after feedback. A rough idea that solves a specific problem can be more valuable than a long list.',
   'Pick one everyday problem and list three different approaches. Choose one, name who it helps, and sketch a small version. Ask a willing person what would make it useful, then revise one detail.',
   'You can explain the problem, the intended user and one improvement made after feedback. Judge the developed idea, not only the number of ideas.');
 }else if(kind==='chronotype') {
  set('Try important work around '+r.peak+', then check what actually works.',
   'Your answers point toward '+r.band.toLowerCase()+'. That gives you a possible starting point for arranging demanding work, rather than leaving its timing undecided.',
   'A preferred time is not always an available time. The questionnaire also does not prove you perform better in that window.',
   'If lessons or work happen outside your preferred window, plan an easier first step and prepare your materials beforehand. Do not treat a timing label as a reason you cannot work then.',
   'Try a similar short task at two realistic times on different days. Record completed work, errors and effort. Protect your usual sleep instead of staying up to match a label.',
   'One time repeatedly works better in your actual routine, or you learn that the difference is small enough to choose by convenience.');
 }else if(kind==='timeaudit') {
  set(r.balanced?'Your week is accounted for. Now check what it supports.':'Clarify where the week goes before trying to change it.',
   'You have put '+val(r.total)+' hours into named activities. '+(r.balanced?'The entries fit a 168-hour week, so you can start comparing them with your priorities.':'This creates a starting estimate to check against an ordinary day.'),
   r.balanced?'A balanced total does not tell us whether the hours are accurate or satisfying. The largest category is not automatically the one to cut.':r.remaining>0?'There are '+val(r.remaining)+' hours unassigned. They may be small daily activities you have not counted yet.':'The total exceeds the week by '+val(-r.remaining)+' hours. Check for overlapping activities before setting a new target.',
   'If you say you have no time for a goal, look for one optional block you control. Care, travel, rest and other commitments need realistic space too.',
   (r.balanced?'Choose one optional twenty-minute block and give it a specific purpose.':'Log one day, counting overlapping activities once. Use it to revise your estimate.')+' Decide in advance what “finished” would look like.',
   'Your recorded week becomes more accurate and one chosen priority gets time you can actually keep. A neat chart without a workable change is not the goal.');
 }else if(kind==='studyplanner') {
  set('Make the plan small enough to complete on a real day.',
   'You have turned '+r.summary.topics+' topics into '+r.summary.sessions+' scheduled sessions. That gives each topic a place in the calendar instead of leaving revision vague.',
   'The busiest day has '+r.summary.heaviestDay+' sessions. The planner does not know how many minutes each topic needs, so that day may contain more work than you can finish.',
   'For example, one chapter may require a worked example and practice, while another only needs a short recall check. Treating them as equal sessions can make a plan look manageable when it is not.',
   'For '+(r.topics?.[0]||'your first topic')+', write one small learning target and estimate its minutes. Compare the total on your busiest day with your available time. Split large topics and regenerate the plan if needed.',
   'You complete sessions and can answer questions afterward. If sessions repeatedly overrun, reduce their size rather than simply carrying every missed task into tomorrow.');
 }
 return out;
}

function build(kind,r,extra={}) {
 if(!titles[kind]||!r||r.valid===false)return null;
 const report={kind,title:titles[kind]+' — your personal report',summary:'',evidence:[],sections:[],plan:[],reflection:'What matched your experience, and what did not?',track:'Keep this report and compare the same measures under similar conditions.',limits:'This is an educational snapshot, not a diagnosis, credential or prediction of future success.',links:[{label:'How scoring works and its limits',href:'/about-our-test/'}]};
 let task='',follow='',review='Review your notes at the end of the week. Keep what helped and change what did not.';
 if(kind==='iq') {
  if(!r.overall||!r.domains||!(r.itemsAnswered>0))return null;
  const rows=Object.entries(r.domains).filter(([id,d])=>domain[id]&&d.itemCount>0&&Number.isFinite(d.strengthIndex)).sort((a,b)=>b[1].strengthIndex-a[1].strengthIndex);
  if(!rows.length)return null;
  const top=rows[0],low=rows[rows.length-1],gap=top[1].strengthIndex-low[1].strengthIndex;
  const ties=rows.filter(x=>x[1].strengthIndex===top[1].strengthIndex).map(x=>domain[x[0]][0]);
  report.summary=gap===0?'Your domain indices are tied in this sitting. Choose a practice area based on a real task you want to do, rather than inventing a strongest or weakest ability.':ties.join(' and ')+' had the highest internal index in this sitting. '+domain[low[0]][0]+' is a possible practice focus, not a fixed weakness.';
  report.evidence=[['Questions completed',val(r.itemsAnswered)],['Unadjusted IQ-style model score',val(r.overall.displayIQ)],['Model uncertainty range',r.overall.confidenceInterval?r.overall.confidenceInterval.low+'–'+r.overall.confidenceInterval.high:'Not available']];
  report.sections=rows.map(([id,d])=>card(domain[id][0]+' · '+val(d.strengthIndex)+'/100 internal index',domain[id][1]+' This estimate uses '+d.itemCount+' questions. It describes this task sample, not your standing among other people. Try this: '+domain[id][2]));
  report.sections.push(card('How to use the profile','Use it to choose a small practice experiment. Do not use a score or archetype to rule out a subject, career or ambition. With only a few questions per domain, differences can reflect item familiarity and measurement noise.'));
  task=domain[low[0]][3];follow='On two later days, try fresh examples of the same skill. Write down the method and errors, not just the final answer.';
  report.track='Track explanations you can produce unaided and mistakes on unfamiliar examples. Repeating the same 25 items can improve familiarity without establishing a change in general intelligence.';
  report.limits='The IQ-style score and range come from an uncalibrated model. The interval does not include every real-world source of error. Domain indices are not percentages correct or population percentiles. The score shown in this detailed report is unadjusted; the headline may include an illustrative age adjustment. Neither is validated age norming.';
 } else if(['career','workvalues','studyhabits','habitanalyzer','interviewreadiness'].includes(kind)) {
  const engine=A[{career:'careerEngine',workvalues:'workValuesEngine',studyhabits:'studyHabitsEngine',habitanalyzer:'habitAnalyzerEngine',interviewreadiness:'interviewReadinessEngine'}[kind]];
  const meta=extra.dimInfo||(engine&&engine.DIM_INFO)||{};
  const rows=Object.keys(r.scores||{}).filter(k=>Number.isFinite(r.scores[k])).sort((a,b)=>r.scores[b]-r.scores[a]);if(!rows.length)return null;
  const label=k=>meta[k]?.name||k,top=rows[0],low=rows[rows.length-1],flat=r.scores[top]===r.scores[low];
  const tops=rows.filter(k=>r.scores[k]===r.scores[top]);
  report.evidence=[['Items answered',val(r.answered)+' / '+val(r.total)],['Highest rating',tops.map(label).join(', ')],['Rating range',val(r.scores[low])+'–'+val(r.scores[top])+' / 100']];
  report.summary=flat?'Your ratings are tied across areas. The displayed ordering should not be interpreted as a meaningful ranking. Choose a real-life priority to explore.':tops.map(label).join(' and ')+' received your highest ratings. '+(['career','workvalues'].includes(kind)?'These are preferences you reported, not measured abilities.':label(low)+' is one place to test a practical change.');
  const actions=kind==='studyhabits'?studyActions:kind==='habitanalyzer'?habitActions:interviewActions;
  report.sections=rows.map(k=>{
   let text=meta[k]?.blurb||'This area summarizes the answers in this category.';
   if(kind==='career')text+=' Experiment: '+careerExperiments[k];
   else if(kind==='workvalues')text+=' Evidence to look for: '+(meta[k]?.lookFor||'Ask for a concrete example of this value in day-to-day work.');
   else text+=' Next step: '+(actions[k]||meta[k]?.improve||meta[k]?.fix||'Choose one small change and observe the result.');
   return card(label(k)+' · '+val(r.scores[k])+'/100 response index',text);
  });
  if(kind==='career') {
   task=careerExperiments[top];follow=careerExperiments[rows[1]||top];review='Compare enjoyment, frustration and willingness to keep learning in both activities. Check training requirements and practical constraints before making a career decision.';
   report.reflection='Did you enjoy the activity itself, or mainly the idea or status of the career?';
   report.track='Rate interest before and after two real activities. A low interest rating does not establish a lack of ability, and a high one does not guarantee job fit.';
   report.links.push({label:'Compare your work values',href:'/work-values-test/'},{label:'O*NET: career interest exploration',href:'https://www.onetcenter.org/IP.html'});
  }else if(kind==='workvalues') {
   task='Turn '+label(top)+' into one question to ask about a role. Ask for a recent, concrete example rather than a general promise.';
   follow='Compare two real opportunities against your top values. Include pay, access, training and responsibilities; do not decide from the questionnaire alone.';
   review='Choose which value is essential and which you could compromise on. If your scores are tied, use a real trade-off to clarify priorities.';
   report.reflection='Which trade-off would you accept: more autonomy, more support, more stability or more recognition? Why?';
  }else {
   task=actions[low]||'Pick the lowest-rated area and make one small change.';
   follow='Repeat that change on two realistic occasions. '+(kind==='studyhabits'?'Check understanding with a short closed-book quiz.':kind==='habitanalyzer'?'Record whether the cue occurred and whether you started, without judging missed days.':'Ask a willing person for specific feedback on one practice answer.');
   review=kind==='studyhabits'?'Compare what you can explain without notes with your starting point. Keep the technique if it helps with your material.':kind==='habitanalyzer'?'Review starts versus opportunities. If starts were rare, make the action smaller or change the cue.':'Review whether your answers now contain clearer evidence and whether practical preparation is complete.';
   report.track=kind==='studyhabits'?'Track correct answers on new questions and delayed recall, not study hours alone.':kind==='habitanalyzer'?'Track starts, obstacles and task completion; the design index is not a probability of success.':'Track clear examples and feedback; readiness ratings do not predict a hiring decision.';
   if(kind==='studyhabits')report.links.push({label:'Research guide: organizing study',href:'https://ies.ed.gov/ncee/wwc/PracticeGuide/1'});
  }
  report.limits='Scores summarize your own ratings, with reverse scoring where applicable. They are not population percentiles, probabilities or independent observations of your behavior. Mood, context and interpretation of the questions can affect answers. AurorIQ is not the official O*NET assessment.';
 }else if(kind==='workstyle') {
  if(!Array.isArray(r.dimensions)||!r.dimensions.length)return null;
  report.summary='Your answers describe how you prefer to work across different situations. Neither end of a scale is better, and a midpoint can reflect flexibility or mixed preferences.';
  report.evidence=[['Answered',val(r.answered)+' / '+val(r.total)]];
  report.sections=r.dimensions.map(d=>card(d.poleA+' / '+d.poleB,d.descriptor+'. Your marker is '+val(d.pct)+'/100 toward the second pole; it is not a performance score. '+d.helps+' Try: '+(styleTasks[d.key]||'Compare two ways of approaching the same task.')));
  const lead=r.dimensions.slice().sort((a,b)=>Math.abs(b.pct-50)-Math.abs(a.pct-50))[0];
  task=styleTasks[lead.key]||'Try the work setting you prefer on one small task.';follow='Try the alternative once, with similar task difficulty. Record output quality, effort and interruptions.';
  report.reflection='When does your usual preference help, and when do circumstances require a different approach?';report.track='Compare concrete work outcomes and your experience rather than trying to move every marker to one side.';
 }else if(kind==='memory') {
  if(!r.forward||!r.backward)return null;
  const f=r.forward.span,b=r.backward.span;
  report.summary='You recalled up to '+val(f)+' digits forward and '+val(b)+' backward. Forward recall emphasizes holding the sequence; backward recall also requires reversing it.';
  report.evidence=[['Forward span',val(f)+' digits'],['Backward span',val(b)+' digits'],['Observed difference',val(f-b)+' digits']];
  report.sections=[card('What the difference means',f>b?'Reversing the sequence was harder in this sitting. This does not isolate a single mental ability or explain why the difference occurred.':f===b?'Your spans were equal. That does not mean the two tasks make identical demands.':'Backward span was higher this time. Strategy, attention and trial variation can produce this pattern; it is not an error or a diagnosis.'),card('Make it useful','For a real task with several steps, write a short checklist or repeat the steps back. External support is often more useful than trying to remember everything unaided.')];
  task='Choose one everyday multi-step task and write a short checklist before starting.';follow='Try the checklist twice. Note forgotten steps or restarts, then simplify the wording.';report.track='Compare raw forward/backward spans only with the same display pace and conditions. Repeated testing and rehearsal affect results.';
 }else if(['logical','verbal','numerical'].includes(kind)) {
  const type=kind==='logical'?'pattern':kind==='numerical'?'numeric':'verbal';
  report.summary='You answered '+val(r.correct)+' of '+val(r.total)+' questions correctly ('+val(r.accuracy)+'%). '+(r.atChance?'Accuracy is near the tool’s guessing threshold, so focus on the questions and methods rather than the composite score.':'Use the difficulty breakdown and missed questions to choose what to practice.');
  report.evidence=[['Correct',val(r.correct)+' / '+val(r.total)],['Accuracy',val(r.accuracy)+'%'],['Difficulty-weighted accuracy',val(r.weightedPct)+'%']];
  report.sections=Object.entries(r.tiers||{}).map(([tier,score])=>card(tier[0].toUpperCase()+tier.slice(1)+' questions · '+score,'This is the number correct out of the questions shown in this difficulty group. Compare the denominator too; a small group is a limited sample.'));
  report.sections.push(card('A method to practice',domain[type][2]));
  task=domain[type][3];follow='Choose unfamiliar questions on a second day. For each mistake, mark whether it involved reading, a missing concept, a method or a calculation.';
  report.track='Track accuracy by problem type on new questions. Knowing the answers on a retake is practice, not independent evidence of higher ability.';
  if(extra.items&&extra.answers) report.review=extra.items.map((it,i)=>({question:it.prompt,correct:extra.answers[i]===it.answer,yours:it.options?.[extra.answers[i]]??'No answer',answer:it.options?.[it.answer]??'Unavailable'}));
 }else if(kind==='reaction') {
  if(!r.times?.length)return null;
  const range=Math.max(...r.times)-Math.min(...r.times);
  report.summary='Your median response was '+val(r.median)+' ms across '+r.times.length+' scored trials. The median is the middle trial, so one unusually fast or slow attempt has less influence.';
  report.evidence=[['Median',val(r.median)+' ms'],['Fastest',val(r.best)+' ms'],['Trial range',val(range)+' ms'],['False starts',val(r.falseStarts)]];
  report.sections=[card('Consistency and anticipation',r.falseStarts?'You made '+r.falseStarts+' early presses. Those were discarded. Wait for the actual signal rather than predicting it.':'No false starts were recorded. The spread between trials still matters more than your single fastest response.'),card('Device effects','Touchscreens, keyboards, display refresh and browser scheduling contribute to the recorded time. This test cannot separate your response from device delay.')];
  task='Record the device and input method used for this baseline.';follow='If you retest, use the same device and a similar setting. Compare complete sets of trials, not your best attempt.';report.track='Track the median, spread and false starts together. Do not use this as a driving, sports-selection or medical fitness test.';
 }else if(kind==='processingspeed'||kind==='spatial') {
  const spatial=kind==='spatial';report.summary='You made '+val(r.correct)+' correct decisions out of '+val(spatial?r.total:r.attempted)+'. '+(r.atChance?'Accuracy is close to guessing, so a speed-based comparison would be misleading.':'Accuracy and time describe different parts of this attempt; look at them together.');
  report.evidence=[['Accuracy',val(r.accuracy)+'%'],[spatial?'Median correct response':'Mean response',val(spatial?r.medianMs:r.meanMs,' ms')]];
  if(!spatial)report.evidence.push(['Correct decisions per minute',val(r.throughput)]);
  report.sections=[card('Your next focus',r.atChance?'Slow down and confirm the rule before responding. A fast wrong response is not better processing.':spatial?'Track one distinctive corner before deciding whether a shape is rotated or mirrored.':'Use the same scan order on each pair. Change your pace only after you can compare the details accurately.'),card('What the index leaves out','The internal composite blends task accuracy and timing. It is not a measured rank in a population and cannot identify the cause of an error.')];
  task=spatial?domain.spatial[3]:'Compare five pairs of short strings at a comfortable pace, scanning left to right.';follow='Try new examples on two later days. Note errors before looking for a faster time.';report.track='Compare accuracy first, then speed at a similar accuracy level, with the same device and input method.';
 }else if(kind==='focus') {
  report.summary='You responded correctly on '+val(r.accuracy)+'% of '+val(r.total)+' trials. This task separates presses when you should wait from missed responses when you should act.';
  report.evidence=[['Accuracy',val(r.accuracy)+'%'],['Presses on no-go trials',val(r.commissionErrors)],['Missed go responses',val(r.omissionErrors)],['Mean valid response',val(r.meanRt,' ms')]];
  report.sections=[card('Where to start',r.commissionErrors>r.omissionErrors?'There were more unwanted presses than missed responses. Rehearse the stop rule before a new attempt. This is a task pattern, not a personality trait.':r.omissionErrors>r.commissionErrors?'There were more missed responses than unwanted presses. Check whether the signal and controls were clear and whether interruptions affected the sitting.':'The two error counts were equal. Look at the instructions and setting before attributing the score to attention.'),card('Avoid overinterpretation','This short task does not diagnose ADHD or explain attention problems in everyday life. A low score alone cannot tell whether distraction, device timing or misunderstanding contributed.')];
  task='Choose one short real work task and remove one avoidable interruption.';follow='Repeat a similar task twice and record interruptions and completed work.';report.track='Track errors and interruptions. Better performance on this game alone does not establish a general attention improvement.';
 }else if(kind==='reading') {
  report.summary='You answered '+val(r.comprehension?.correct)+' of '+val(r.comprehension?.total)+' comprehension questions correctly. '+(r.tooFast?'The recorded pace triggered the tool’s too-fast flag; do not interpret its speed comparison.':!r.passed?'The comprehension threshold was not met. Prioritize understanding before trying to read faster.':'The comprehension threshold was met for this passage. Check whether you can also explain the ideas without looking.');
  report.evidence=[['Raw pace',val(r.rawWpm)+' words/min'],['Comprehension',val(r.comprehensionPct)+'%']];
  report.sections=[card('Speed versus understanding','Effective WPM multiplies raw pace by the fraction of questions answered correctly. It is a convenience metric, not a validated measure of how much you understood.'),card('Try a useful reading check','After each short section, pause and state the main claim and one supporting detail. Check the text again where your summary is uncertain.')];
  task='Read an unfamiliar short passage without racing. Close it and write a three-sentence summary.';follow='On another day, use a similar passage. Check key facts and your explanation before considering reading speed.';report.track='Compare comprehension on new material of similar difficulty. A familiar passage can inflate reading speed.';
 }else if(kind==='creativity') {
  report.summary='You produced '+val(r.fluency)+' distinct accepted ideas. The result measures output in this timed task, not how original, valuable or creative you are overall.';
  report.evidence=[['Distinct accepted ideas',val(r.fluency)],['First-word variety heuristic',val(r.variety)]];
  report.sections=[card('Quantity and quality are different','The variety count groups ideas by their opening word; it is not a semantic analysis. Neither metric decides whether an idea is useful or original.'),card('Turn one idea into something useful',r.fluency?'Choose an idea from your list. Explain who could use it, what problem it solves and one practical drawback.':'Try again without the timer first. Write ordinary uses, then change the user, location or purpose to find alternatives.')];
  task='Choose one everyday object and list uses from three different contexts.';follow='Pick two ideas to develop. Write a use case and limitation for each instead of simply increasing the count.';report.track='Compare the range and usefulness of your ideas using the same rubric. Do not equate word count with creativity.';
 }else if(kind==='chronotype') {
  report.summary='Your answers lean toward '+r.band.toLowerCase()+'. The suggested '+r.peak+' window is a scheduling hypothesis to test, not a measured biological peak.';
  report.evidence=[['Morningness response index',val(r.morningness)+' / 100'],['Suggested window',r.peak]];
  report.sections=[card('Use your real schedule','Compare demanding work at two times you can realistically use. Keep essential sleep and obligations intact; do not force a schedule just to match a label.'),card('Preference is not destiny','Your reported timing preference can differ from your best performance under a particular routine. This questionnaire does not assess a sleep disorder.')];
  task='For two days, note when a short demanding task feels easiest and what your schedule was.';follow='Try similar tasks in two available time windows; record completion, errors and perceived effort.';report.track='Look for a repeated pattern across the week rather than one unusually good or bad day.';
 }else if(kind==='timeaudit') {
  report.summary=r.balanced?'Your allocations account for the 168-hour week. Use the largest categories to ask where time matches your priorities.':'Your entries add to '+val(r.total)+' hours. '+(r.remaining>=0?val(r.remaining)+' hours are unassigned.':val(-r.remaining)+' hours overlap or exceed the week.')+' Reconcile the totals before drawing conclusions.';
  report.evidence=[['Allocated hours',val(r.total)],['Unassigned / over',val(r.remaining)],['Largest category',r.ranked?.[0]?r.ranked[0].name+' · '+val(r.ranked[0].hours)+' hours':'No entries']];
  report.sections=[card('Estimates are not observations','Log one ordinary day before treating these numbers as exact. Count simultaneous activities once, or clearly choose which category represents them.'),card('Make one deliberate trade-off','Choose an optional activity you control and move one realistic block to a priority. Family responsibilities and recovery are not automatically wasted time.')];
  task=r.balanced?'Choose one 20-minute block you can realistically redirect this week.':'Use a one-day log to reconcile missing or overlapping time.';follow='Record what actually happened in that block on two occasions.';report.track='Compare planned and actual time, then adjust one category. Do not cut essential commitments just to make a chart look better.';
 }else if(kind==='studyplanner') {
  if(!r.summary)return null;
  report.summary='Your plan schedules '+r.summary.sessions+' sessions for '+r.summary.topics+' topics over '+r.window+' days. The busiest day has '+r.summary.heaviestDay+' sessions; session length is not included in the generator.';
  report.evidence=[['Topics',val(r.summary.topics)],['Study days',val(r.summary.studyDays)],['Busiest day',val(r.summary.heaviestDay)+' sessions']];
  report.sections=[card('Check whether the load fits','Estimate minutes for each session before committing. A large topic and a short definition should not automatically receive the same time.'),card('Give each session a purpose','Learn: understand a small section and attempt an example. Recall: answer without notes, then check. Final review: revisit the gaps you found instead of rereading everything.')];
  task='Start with '+(r.topics?.[0]||'one topic')+'. Split it into a manageable learning goal and estimate the time needed.';follow='At each scheduled review, try a few questions without notes and record which ideas need another pass.';review='Compare the busiest day with the time you actually have. Split large topics or revise the plan if it does not fit.';report.track='Track delayed recall and completed sessions. A generated schedule is not evidence that content has been mastered.';
  report.links.push({label:'Research guide: organizing study',href:'https://ies.ed.gov/ncee/wwc/PracticeGuide/1'});
 }
 if(!report.summary)return null;
 report.plan=[{when:'Day 1 · try one small step',text:task},{when:'Days 2–6 · practise and notice',text:follow},{when:'Day 7 · keep what helps',text:review}];
 report.coaching=coaching(kind,r,extra,report);
 report.plan[0].text=report.coaching.action;
 report.plan[2].text=report.coaching.success;
 return report;
}
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function content(r) {
 const c=r.coaching;
 let html='<header><p class="pr-eyebrow">Your personal report</p><h2>'+escape(c.headline)+'</h2></header>';
 html+='<div class="pr-story"><section class="pr-strength"><p class="pr-kicker">01 · Build on this</p><h3>What you do well — or can build on</h3><p>'+escape(c.strength)+'</p></section><section class="pr-barrier"><p class="pr-kicker">02 · Understand the obstacle</p><h3>What may hold you back</h3><p>'+escape(c.barrier)+'</p></section><section><h3>What this could look like in everyday life</h3><p>'+escape(c.meaning)+'</p></section><section class="pr-first-step"><p class="pr-kicker">03 · Start here</p><h3>How to work on it</h3><p>'+escape(c.action)+'</p><h4>You will know it is helping when…</h4><p>'+escape(c.success)+'</p></section></div>';
 html+='<details class="pr-breakdown"><summary>Your scores and area-by-area explanation</summary><dl class="pr-evidence">'+r.evidence.map(([k,v])=>'<div><dt>'+escape(k)+'</dt><dd>'+escape(v)+'</dd></div>').join('')+'</dl><div class="pr-grid">'+r.sections.map(s=>'<section><h3>'+escape(s.heading)+'</h3><p>'+escape(s.text)+'</p></section>').join('')+'</div></details>';
 if(r.review) html+='<details class="pr-review"><summary>Review your '+r.review.length+' answers</summary><p>Use missed items to study the method. Seeing the answer makes later retakes less independent.</p><ol>'+r.review.map(q=>'<li><strong>'+escape(q.question)+'</strong><p>'+ (q.correct?'Correct':'Review this')+' · Your answer: '+escape(q.yours)+'<br>Expected answer: '+escape(q.answer)+'</p></li>').join('')+'</ol></details>';
 html+='<section class="pr-plan"><h3>Put it into practice this week</h3><p>A suggested routine to adapt to your life, not a promise of a higher score.</p><ol>'+r.plan.map(p=>'<li><strong>'+escape(p.when)+'</strong><p>'+escape(p.text)+'</p></li>').join('')+'</ol></section><section><h3>How to judge progress</h3><p>'+escape(r.track)+'</p><h3>A question to reflect on</h3><p>'+escape(r.reflection)+'</p></section><aside class="pr-limits"><h3>What this report cannot tell you</h3><p>'+escape(r.limits)+'</p></aside><nav aria-label="Report resources">'+r.links.map(l=>'<a href="'+escape(l.href)+'">'+escape(l.label)+'</a>').join('')+'</nav>';
 return html;
}
function exportHtml(r) {
 const saved = Object.assign({}, r, {links:r.links.map(l=>({label:l.label,href:l.href.startsWith('/')?'https://auroriq.com'+l.href:l.href}))});
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>'+escape(r.title)+' | AurorIQ</title><style>body{font:16px/1.7 system-ui,sans-serif;color:#142235;max-width:850px;margin:auto;padding:24px}h2,h3{line-height:1.3}section,aside{margin:24px 0}dt{font-weight:bold}dd{margin:0}a{color:#174bab;margin-right:20px}li{margin:12px 0}.pr-evidence{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px}.pr-limits{border-left:3px solid #2563eb;padding-left:16px}@media print{details>*{display:block!important}summary{display:none}section,li{break-inside:avoid}}</style></head><body><main>'+content(saved).replace(/<details class="(pr-review|pr-breakdown)">/g,'<details class="$1" open>')+'</main><footer>AurorIQ · Saved '+escape(new Date().toISOString().slice(0,10))+' · Educational self-reflection. Keep this file private if it contains personal information. Open in a browser and use Print / Save as PDF.</footer></body></html>';
}
function render(kind,r,host,extra) {
 if(!host||!document)return;
 const old=host.querySelector('[data-practical-report]');
 const report=build(kind,r,extra);if(old)old.remove();if(!report)return;
 const el=document.createElement('section');el.className='practical-report';el.setAttribute('data-practical-report',kind);el.innerHTML=content(report);
 const actions=document.createElement('div');actions.className='pr-actions';
 const download=document.createElement('button');download.type='button';download.className='btn btn--primary';download.textContent='Save detailed report';
 download.addEventListener('click',()=>{const blob=new Blob([exportHtml(report)],{type:'text/html;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='AurorIQ-'+kind+'-report.html';document.body.appendChild(a);a.click();a.remove();global.setTimeout(()=>URL.revokeObjectURL(url),1000);});
 const note=document.createElement('p');note.textContent='Saves a private HTML file you can read offline or print to PDF. The report is refreshed when you finish another attempt.';
 actions.appendChild(download);actions.appendChild(note);el.appendChild(actions);
 if(kind==='timeaudit'||kind==='studyplanner')host.appendChild(el);
 else {const heading=host.firstElementChild;host.insertBefore(el,heading&&/^H[1-6]$/.test(heading.tagName)?heading.nextSibling:host.firstChild);}
}
A.reports={build,render,content,exportHtml};
if(typeof module!=='undefined'&&module.exports)module.exports=A.reports;
})(typeof window!=='undefined'?window:globalThis,typeof document!=='undefined'?document:null);
