# Drives the real grade pages in headless Chromium and checks the XP and help rules.
# Usage: python3 tools/browser-check.py   (needs: pip install playwright; playwright install chromium)
import sys, json
from playwright.sync_api import sync_playwright
import os
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..")+"/"
PAGES={7:"FINAL GRADE 7 RMA/G7 RMA1 V1.html",8:"RMA G8 V2/G8 RMA V5.html",9:"RMA G9 V1/rmag9 v3.html",10:"RMA G10 V1/g10rma v4.html"}
results=[]
def check(g,name,cond,extra=""):
    results.append((g,name,bool(cond),extra))

PICK="""(correct)=>{
 const p=gameState.activeQuestions[gameState.currentQIndex], q=rawQuestions[p.rawIndex];
 const ans=Array.isArray(q.answer)?q.answer:[q.answer];
 const inputs=[...document.querySelectorAll('.option-label input')].filter(i=>!i.disabled);
 if(correct){ inputs.filter(i=>ans.includes(i.value)).forEach(i=>i.click()); }
 else { const w=inputs.find(i=>!ans.includes(i.value)); w.click(); }
}"""
def state(pg): return pg.evaluate("""()=>({xp:gameState.scorePoints,correct:gameState.correctCount,
  pill:document.getElementById('xpValue').textContent,run:document.getElementById('runXP').textContent,
  bal:document.getElementById('helpBalance').textContent,chip:document.getElementById('helpToken').textContent,
  dis:{e:document.getElementById('help-eliminate').disabled,t:document.getElementById('help-time').disabled,r:document.getElementById('help-retry').disabled},
  why:{e:document.querySelector('#help-eliminate .help-why').textContent,r:document.querySelector('#help-retry .help-why').textContent},
  cost:{e:document.querySelector('#help-eliminate .help-cost').textContent,t:document.querySelector('#help-time .help-cost').textContent,r:document.querySelector('#help-retry .help-cost').textContent},
  nAns:Object.keys(gameState.userAnswers).length, nRec:gameState.itemAnalysisRecords.length})""")
def answer(pg,correct):
    pg.evaluate(PICK,correct); pg.click('#checkBtn'); pg.wait_for_timeout(60)
def nxt(pg): pg.click('#nextBtn'); pg.wait_for_timeout(80)

with sync_playwright() as p:
    b=p.chromium.launch()
    for g,rel in PAGES.items():
        pg=b.new_page(viewport={'width':1280,'height':900})
        errs=[]; pg.on('pageerror',lambda e,errs=errs: errs.append(str(e)))
        pg.on('dialog',lambda d:d.accept())
        pg.route('**/*',lambda r: r.continue_() if r.request.url.startswith('file://') else r.abort())
        pg.goto('file://'+ROOT+rel); pg.wait_for_timeout(400)
        pg.evaluate("()=>{SECURITY.examStarted=true;gameState.student={name:'T',section:'A',lastName:'T',firstNameMI:'T'};gameStartTime=new Date();document.getElementById('loginOverlay').style.display='none';initGame();}")
        pg.wait_for_timeout(200)
        s=state(pg)
        check(g,"starts at 0 XP everywhere",s['xp']==0 and s['pill']=='0' and s['run']=='0' and s['bal']=='0 XP',str(s))
        check(g,"no free help: eliminate & extra time disabled at 0 XP",s['dis']['e'] and s['dis']['t'],str(s['dis']))
        check(g,"costs shown, none say Free",all('Free' not in v for v in s['cost'].values()) and s['cost']['e']=='10 XP',str(s['cost']))
        check(g,"chip shows one second chance",s['chip']=='Second chance: 1 left',s['chip'])
        # correct answer = +1 XP, header/run/help agree
        answer(pg,True); s=state(pg)
        check(g,"correct answer earns exactly 1 XP",s['xp']==1,str(s['xp']))
        check(g,"pill, run card and help balance agree",s['pill']=='1' and s['run']=='1' and s['bal']=='1 XP',str(s))
        # wrong answer changes nothing
        nxt(pg); answer(pg,False); s=state(pg)
        check(g,"wrong answer changes nothing",s['xp']==1 and s['correct']==1 and s['pill']=='1',str(s))
        check(g,"1 XP cannot buy second chance",s['dis']['r'],str(s['why']))
        # simulate having earned enough XP, then use second chance once
        pg.evaluate("()=>{gameState.scorePoints=60; window.RMATheme.syncRun(); window.RMAHelp.refresh();}")
        s=state(pg); check(g,"second chance available after wrong answer with XP",not s['dis']['r'],str(s['why']))
        pg.click('#help-retry'); pg.wait_for_timeout(80); s=state(pg)
        check(g,"second chance cost 20 XP",s['xp']==40,str(s['xp']))
        check(g,"chip now 0 left",s['chip']=='Second chance: 0 left',s['chip'])
        answer(pg,False); s=state(pg)
        check(g,"after another wrong answer second chance still locked this question",s['dis']['r'])
        nxt(pg); answer(pg,False); s=state(pg)
        check(g,"second chance locked on later questions: one per attempt",s['dis']['r'] and 'attempt' in s['why']['r'],str(s['why']))
        check(g,"wrong answers never changed XP",s['xp']==40,str(s['xp']))
        # spending cap still applies (20 spent so far)
        nxt(pg); pg.evaluate("()=>{gameState.scorePoints=60;window.RMAHelp.refresh();}")
        pg.click('#help-eliminate'); pg.wait_for_timeout(60); s=state(pg)
        check(g,"eliminate cost 10 XP",s['xp']==50,str(s['xp']))
        check(g,"spending cap: 20+10 XP spent, extra time now refused",state(pg)['dis']['t'] and pg.evaluate("()=>document.querySelector('#help-time .help-why').textContent").startswith('Help limit'),pg.evaluate("()=>document.querySelector('#help-time .help-why').textContent"))
        # fresh attempt: extra time works and costs 5
        pg.evaluate("()=>initGame()"); pg.wait_for_timeout(150)
        pg.evaluate("()=>{gameState.scorePoints=60;window.RMAHelp.refresh();}")
        left=pg.evaluate("()=>questionTimeLeft"); pg.click('#help-time'); pg.wait_for_timeout(60)
        d=pg.evaluate("()=>questionTimeLeft")-left
        check(g,"extra time adds 10s",d in (10,9),str(d))
        check(g,"extra time cost 5 XP",state(pg)['xp']==55,str(state(pg)['xp']))
        pg.evaluate("()=>{gameState.userAnswers[1]='T';gameState.itemAnalysisRecords.push({id:1,result:'T'});gameState.scorePoints=7}")
        # practice again: clean slate, second chance returns
        pg.evaluate("()=>initGame()"); pg.wait_for_timeout(150); s=state(pg)
        check(g,"new attempt resets XP, correct, answers and records",s['xp']==0 and s['correct']==0 and s['nAns']==0 and s['nRec']==0,str(s))
        check(g,"new attempt restores the second chance",s['chip']=='Second chance: 1 left',s['chip'])
        errs=[e for e in errs if 'no supported sources' not in e]  # sound clips are blocked offline
        check(g,"no page errors",not errs,str(errs[:2]))
        pg.close()
    b.close()
bad=[r for r in results if not r[2]]
for g,n,ok,x in results: print(('PASS' if ok else 'FAIL'),f"G{g}",n,('-> '+x) if (not ok and x) else '')
print(len(results)-len(bad),'pass',len(bad),'fail')
sys.exit(1 if bad else 0)
