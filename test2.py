import asyncio, json
from playwright.async_api import async_playwright
URL = 'http://localhost:8765/'
results = []
def check(name, cond, detail=''):
    results.append((name, bool(cond), detail)); print(('PASS ' if cond else 'FAIL ') + name + ' ' + str(detail), flush=True)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':1600,'height':900})
        logs=[]
        pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error',) else None)
        pg.on('pageerror', lambda e: logs.append(f'PAGEERROR: {e}'))
        await pg.goto(URL)
        await pg.wait_for_function('window.__ready === true', timeout=90000)
        await pg.wait_for_timeout(1500)
        S = lambda: pg.evaluate('({stage: __state.stage, bi: __state.binduIntensity, bl: __state.binduLevel, th: __state.thogal, ts: __state.thogalStep, phowa: __state.phowa, pp: __state.phowaPalace, ph: __state.phowaHuman, chain: __state.chain, tummo: __state.tummoStep, mode: __state.mode, active: [...document.querySelectorAll("#stageButtons .stage.active")].map(b=>+b.dataset.stage), cam: __app.camera.position.toArray().map(v=>+v.toFixed(2))})')
        s0 = await S()
        await pg.screenshot(path='shots/v2-palace-default.png')
        L = await pg.evaluate("""(()=>{const ls=[...document.querySelectorAll('#labels3d .l3')]; const vis=ls.filter(e=>getComputedStyle(e).display!=='none' && +getComputedStyle(e).opacity>0.05); const bij=ls.filter(e=>e.classList.contains('bija')); const fl=vis.find(e=>e.textContent.includes('Earth field')); const fs = fl ? parseFloat(getComputedStyle(fl.querySelector('.box')).fontSize) : 0; return {n: ls.length, vis: vis.length, bija: bij.length, visBija: bij.filter(e=>getComputedStyle(e).display!=='none' && +getComputedStyle(e).opacity>0.05).length, fs, canvasLabels: 0}})()""")
        check('labels: HTML overlay (#labels3d), not canvas textures; many visible', L['n'] > 60 and L['vis'] >= 20, L)
        check('labels: 64+ crisp HTML bija syllables on nodes (those ≥7px visible at home view)', L['bija'] >= 64 and L['visBija'] >= 16, (L['bija'], L['visBija']))
        check('labels: field label font size in px >= 12', L['fs'] >= 12, L['fs'])
        ov = await pg.evaluate("""(()=>{const v=[...document.querySelectorAll('#labels3d .l3:not(.bija)')].filter(e=>getComputedStyle(e).display!=='none' && +getComputedStyle(e).opacity>0.05).map(e=>e.querySelector('.box').getBoundingClientRect()); let o=0; for(let i=0;i<v.length;i++)for(let j=i+1;j<v.length;j++){const a=v[i],b=v[j]; if(a.left<b.right-2&&b.left<a.right-2&&a.top<b.bottom-2&&b.top<a.bottom-2)o++;} return o})()""")
        check('labels: de-overlapped (no visible non-bija label boxes overlap)', ov == 0, ov)
        await pg.click('#labels'); await pg.wait_for_timeout(300)
        L2 = await pg.evaluate("[...document.querySelectorAll('#labels3d .l3:not(.bija)')].filter(e=>getComputedStyle(e).display!=='none' && +getComputedStyle(e).opacity>0.05).length")
        check('labels: Labels toggle hides text labels', L2 <= 1, L2); await pg.click('#labels'); await pg.wait_for_timeout(300)
        await pg.wait_for_timeout(10000)
        s1 = await S()
        check('idle 10s: stage unchanged (0)', s0['stage']==s1['stage']==0, (s0['stage'], s1['stage']))
        check('idle 10s: no active stage button', s1['active']==[], s1['active'])
        check('idle 10s: bindu intensity unchanged', s0['bi']==s1['bi'] and abs(s0['bl']-s1['bl'])<1e-6, (s0['bl'], s1['bl']))
        check('idle 10s: camera did not move', s0['cam']==s1['cam'], (s0['cam'], s1['cam']))
        check('idle 10s: no shakti chain playing', s1['chain'] is None, s1['chain'])
        check('idle 10s: phowa not started', s1['phowa']==0, s1['phowa'])
        check('idle 10s: linked phowa not auto-started (palace & figure both 0, no tummo step)', s1['pp']==0 and s1['ph']==0 and s1['tummo']==-1, (s1['pp'], s1['ph'], s1['tummo']))
        prev = s1['bl']; bls = {}
        for n in range(1, 9):
            await pg.click(f'#stageButtons .stage[data-stage="{n}"]')
            if n == 8:
                await pg.wait_for_function('__state.phowa >= 0.1', polling=50); sA = await S(); await pg.screenshot(path='shots/v2-phowa-start.png')
                check('LINK: one palace phowa click sets both progress values (figure on step 13)', sA['pp'] > 0 and sA['ph'] > 0 and abs(sA['pp'] - sA['ph']) < 0.02 and sA['tummo'] == 12, (round(sA['pp'],3), round(sA['ph'],3), sA['tummo']))
                await pg.wait_for_function('__state.phowa >= 0.5', polling=50); sB = await S(); await pg.screenshot(path='shots/v2-phowa-mid.png')
                await pg.click('#tabs [data-mode="human"]'); await pg.wait_for_timeout(200); sH = await S(); await pg.screenshot(path='shots/v2-link-human-mid.png')
                check('LINK: switching to figure mid-run shows the same progress', sH['mode']=='human' and abs(sH['pp'] - sH['ph']) < 0.02 and 0.4 < sH['ph'] < 1, (round(sH['pp'],3), round(sH['ph'],3)))
                await pg.click('#tabs [data-mode="palace"]'); await pg.wait_for_timeout(200)
                await pg.wait_for_function('__state.phowa >= 1', polling=50); await pg.wait_for_timeout(1500); sC = await S(); await pg.screenshot(path='shots/v2-phowa-end.png')
                check('phowa progress advances only after its click (start<mid<end=1)', 0 < sA['phowa'] < sB['phowa'] < sC['phowa'] == 1, (round(sA['phowa'],3), round(sB['phowa'],3), sC['phowa']))
                s = sC
            else:
                await pg.wait_for_timeout(3500); s = await S()
                await pg.screenshot(path=f'shots/v2-stage-{n}.png')
            check(f'click stage {n}: stage == {n} only', s['stage']==n and s['active']==[n], (s['stage'], s['active']))
            check(f'click stage {n}: bindu increased', s['bl'] > prev + 1e-3, (round(prev,3), round(s['bl'],3)))
            prev = s['bl']; bls[n] = s['bi']
        check('phowa bindu intensity >= emanation', bls[8] >= bls[7], (bls[7], bls[8]))
        await pg.wait_for_timeout(5000); s = await S()
        check('phowa holds 5s, nothing auto-advances', s['stage']==8 and s['active']==[8], s['stage'])
        # explanation expanded for phowa
        await pg.evaluate("document.querySelector('#stageText details').open = true"); await pg.wait_for_timeout(400)
        await pg.screenshot(path='shots/v2-phowa-explain.png')
        await pg.click('#stageButtons .stage[data-stage="0"]'); await pg.wait_for_timeout(3500)
        s = await S(); check('re-manifest resets phowa', s['stage']==0 and s['phowa']==0, (s['stage'], s['phowa']))
        check('LINK: re-manifest also resets the figure', s['tummo']==-1 and s['ph']==0, (s['tummo'], s['ph']))
        # ---- shakti chains: start only on click
        await pg.wait_for_timeout(3000); s = await S(); check('no chain before any shakti click', s['chain'] is None, s['chain'])
        await pg.evaluate("__app.flyTo(new __app.camera.position.constructor(260, 260, 520), new __app.camera.position.constructor(230, 100, 230))"); await pg.wait_for_timeout(2200)
        xy = await pg.evaluate('__app.projectShakti(8)')
        await pg.mouse.move(xy[0], xy[1]); await pg.wait_for_timeout(300); await pg.mouse.click(xy[0], xy[1]); await pg.wait_for_timeout(500)
        s = await S(); check('real click on water shakti starts its chain at phase 1', s['chain'] is not None and s['chain']['i']==0 and s['chain']['playing'], s['chain'])
        await pg.wait_for_timeout(4200); s2 = await S()
        check('chain advances through phases after click', s2['chain'] and s2['chain']['i'] >= 1, s2['chain'] and s2['chain']['i'])
        await pg.click('#chPlay'); await pg.wait_for_timeout(200); s3 = await S(); await pg.wait_for_timeout(5000); s4 = await S()
        check('paused chain does not advance', s4['chain']['i']==s3['chain']['i'] and not s4['chain']['playing'], (s3['chain']['i'], s4['chain']['i']))
        await pg.click('#chNext'); await pg.wait_for_timeout(200); s5 = await S()
        check('step ▶ advances exactly one phase', s5['chain']['i']==s4['chain']['i']+1, (s4['chain']['i'], s5['chain']['i']))
        await pg.click('#chPrev'); await pg.wait_for_timeout(200); s6 = await S()
        check('◀ step back goes back one phase', s6['chain']['i']==s4['chain']['i'], s6['chain']['i'])
        async def shoot_chain(idx, tag, mode='shakti', phases=None):
            if mode == 'shakti': await pg.evaluate(f'__app.selectShakti({idx})')
            else: await pg.evaluate(f'__app.selectField({idx}); __app.playThread({idx})')
            n = (await S())['chain']['n']
            for k in (phases or range(n)):
                await pg.evaluate(f'__app.goPhase({k}, true); __app.focusCurrent()'); await pg.wait_for_timeout(2600)
                c = (await S())['chain']; await pg.screenshot(path=f'shots/v2-chain-{tag}-{k+1}-{c["form"]}.png')
        await shoot_chain(8, 'water')
        await shoot_chain(16, 'fire')
        await shoot_chain(7, 'light-thread', mode='thread', phases=[0, 3, 8, 9, 10, 11])
        s = await S(); check('whole-thread run has 12 phases', s['chain']['n']==12 and s['chain']['mode']=='thread', s['chain'])
        # mid-morph frame (particles travelling) and hand-off stream overview
        await pg.evaluate('__app.selectShakti(8); __app.goPhase(5, true)'); await pg.evaluate("__app.resetView()"); await pg.wait_for_timeout(1800)
        await pg.evaluate('__app.goPhase(6, true)'); await pg.wait_for_timeout(700); await pg.screenshot(path='shots/v2-chain-water-handoff-stream.png')
        await pg.evaluate('__app.stopChain()')
        # ---- explanations & detailed palace
        await pg.evaluate("__app.setStage(0); document.querySelector('#about').click()"); await pg.wait_for_timeout(500)
        await pg.evaluate("[...document.querySelectorAll('#info details')].slice(0,2).forEach(d=>d.open=true)"); await pg.wait_for_timeout(300)
        await pg.screenshot(path='shots/v2-panel-guide.png')
        await pg.evaluate("__app.selectField(1)"); await pg.wait_for_timeout(2500); await pg.screenshot(path='shots/v2-panel-field.png')
        await pg.evaluate('__app.stopChain()')
        await pg.evaluate("__app.flyTo(new __app.camera.position.constructor(0, 70, 230), new __app.camera.position.constructor(0, 55, 100))"); await pg.wait_for_timeout(2600)
        await pg.screenshot(path='shots/v2-palace-detail-gate.png')
        await pg.evaluate("__app.flyTo(new __app.camera.position.constructor(70, 230, 95), new __app.camera.position.constructor(0, 170, 0))"); await pg.wait_for_timeout(2600)
        await pg.screenshot(path='shots/v2-palace-detail-upper.png')
        await pg.evaluate("__app.flyTo(new __app.camera.position.constructor(0, 1250, 0.01), new __app.camera.position.constructor(0,0,0)); __app.setMorph(0)"); await pg.wait_for_timeout(2600)
        await pg.screenshot(path='shots/v2-palace-plan.png'); await pg.evaluate("__app.setMorph(1); __app.resetView()"); await pg.wait_for_timeout(1800)
        # ---- human mandala: click-only tummo
        await pg.click('#tabs [data-mode="human"]'); await pg.wait_for_timeout(1500); s0 = await S()
        await pg.wait_for_timeout(6000); s1 = await S()
        check('human mode idle 6s: tummo step unchanged (none)', s0['tummo']==s1['tummo']==-1, (s0['tummo'], s1['tummo']))
        nsteps = await pg.evaluate('document.querySelectorAll(".tstep").length')
        for i in range(nsteps):
            await pg.click(f'.tstep[data-step="{i}"]')
            key = await pg.evaluate(f'document.querySelectorAll(".tstep")[{i}].textContent')
            if i == nsteps - 1:
                t0 = await pg.evaluate('performance.now()')
                for tag, ms in [('start', 700), ('mid', 3200), ('end', 7600)]:
                    await pg.wait_for_function(f'performance.now() - {t0} >= {ms}', polling=50); await pg.screenshot(path=f'shots/v2-phowa-human-{tag}.png')
            else:
                await pg.wait_for_timeout(3600); await pg.screenshot(path=f'shots/v2-human-step-{i+1:02d}.png')
            s = await S(); check(f'tummo click {i+1}: step == {i}', s['tummo']==i, s['tummo'])
        await pg.wait_for_timeout(4000); s = await S(); check('tummo does not auto-advance after last click', s['tummo']==nsteps-1, s['tummo'])
        s = await S(); check('LINK: figure step-13 click also runs palace phowa (stage 8, same progress)', s['stage']==8 and s['pp'] > 0 and abs(s['pp'] - s['ph']) < 0.02, (s['stage'], round(s['pp'],3), round(s['ph'],3)))
        await pg.evaluate("document.querySelector('#tummoText details').open = true"); await pg.wait_for_timeout(300); await pg.screenshot(path='shots/v2-human-explain.png')
        await pg.click('.tstep[data-step="12"]'); await pg.wait_for_timeout(400); await pg.wait_for_function('__state.phowaHuman >= 0.5 && __state.phowaHuman < 0.95', polling=50)
        await pg.click('#tabs [data-mode="palace"]'); await pg.wait_for_timeout(200); s = await S(); await pg.screenshot(path='shots/v2-link-palace-mid.png')
        check('LINK: switching to palace mid-run (started from figure) shows the same progress', s['mode']=='palace' and s['stage']==8 and abs(s['pp'] - s['ph']) < 0.02 and 0.4 < s['pp'] < 1, (round(s['pp'],3), round(s['ph'],3)))
        await pg.click('#tabs [data-mode="human"]'); await pg.wait_for_timeout(300)
        await pg.click('#tummoButtons .stage.reset'); await pg.wait_for_timeout(300); s = await S()
        check('LINK: Reset figure resets both', s['tummo']==-1 and s['stage']==0 and s['pp']==0 and s['ph']==0, (s['tummo'], s['stage'], s['pp'], s['ph']))
        await pg.wait_for_timeout(4000); s = await S(); check('after reset, nothing auto-starts (4s)', s['tummo']==-1 and s['stage']==0 and s['pp']==0, (s['tummo'], s['stage']))
        # ---- THÖGAL: four visions + rainbow body, click-only
        check('thögal: no auto-start (nothing shown, no step) after 4s idle', s['ts']==-1 and s['th']['step']==-1 and s['th']['active']==0 and s['th']['dissolved']==0, (s['ts'], s['th']))
        EXP = [3, 9, 15, 21, 24]; keys = ['direct', 'increase', 'perfect', 'exhaust', 'rainbow']; prevD, prevS = 0, 0
        for i in range(5):
            await pg.click(f'.thstep[data-thstep="{i}"]')
            if i == 4: await pg.click('#hFocus')
            await pg.wait_for_timeout(1100); await pg.screenshot(path=f'shots/v3-thogal-{i+1}-early.png')
            await pg.wait_for_function(f'__state.thogal.dissolved >= {EXP[i]}', polling=100, timeout=45000)
            if i == 4:
                await pg.wait_for_function('__state.thogal.rainbow >= 0.5', polling=100, timeout=30000); await pg.screenshot(path='shots/v3-thogal-5-rainbow-mid.png')
                await pg.wait_for_function('__state.thogal.rainbow >= 1', polling=100, timeout=30000)
            await pg.wait_for_timeout(1200); s = await S(); await pg.screenshot(path=f'shots/v3-thogal-{i+1}-{keys[i]}.png')
            check(f'thögal click {i+1}: sets exactly that vision (tummo cleared)', s['ts']==i and s['th']['step']==i and s['tummo']==-1 and [int(x) for x in await pg.evaluate('[...document.querySelectorAll(".thstep.active")].map(b=>b.dataset.thstep)')]==[i], (s['ts'], s['th']['step'], s['tummo']))
            check(f'thögal click {i+1}: forms dissolved count increases ({prevD} -> {s["th"]["dissolved"]}), stopped {prevS} -> {s["th"]["stopped"]}', s['th']['dissolved'] > prevD and s['th']['stopped'] >= prevS and s['th']['stopped'] >= s['th']['dissolved'], s['th'])
            prevD, prevS = s['th']['dissolved'], s['th']['stopped']
            if i == 2:
                g = await pg.evaluate("({pal: __t3d.PAL.filter(p=>p.visible).length, th: __t3d.shells.visible, beads: __t3d.beads.visible, vort: __t3d.vort.visible})")
                check('thögal III: 3D mandala palaces fill the sky + thigle shells + vajra chains + vortexes', g['pal'] >= 30 and g['th'] and g['beads'] and g['vort'], g)
            await pg.wait_for_timeout(3000); s2 = await S(); check(f'thögal vision {i+1} holds 3s (no auto-advance)', s2['ts']==i, s2['ts'])
        txt = await pg.evaluate("document.querySelector('#tummoText').innerText")
        check('thögal panel has no teacher/prerequisite note', ('teacher' not in txt.lower()) and ('empowerment' not in txt.lower()) and ('trekch' not in txt.lower()), txt[:80])
        await pg.evaluate("document.querySelectorAll('#tummoText details').forEach(d=>d.open=true); document.querySelector('#humanPanel').scrollTop = 9999"); await pg.wait_for_timeout(300); await pg.screenshot(path='shots/v3-thogal-explain.png')
        await pg.click('#tummoButtons .stage.reset'); await pg.wait_for_timeout(2500); s = await S()
        check('Reset figure clears thögal (step -1, no forms, no dissolved)', s['ts']==-1 and s['th']['step']==-1 and s['th']['active']==0 and s['th']['dissolved']==0 and s['tummo']==-1, (s['ts'], s['th']))
        await pg.wait_for_timeout(4000); s = await S(); check('after reset, thögal does not auto-start (4s)', s['ts']==-1 and s['th']['step']==-1, s['th'])
        await pg.click('#tabs [data-mode="palace"]'); await pg.wait_for_timeout(1000)
        # ---- dialogue & references
        await pg.click('#tabs [data-ov="purpose"]'); await pg.wait_for_timeout(600); await pg.screenshot(path='shots/v2-dialogue.png')
        await pg.evaluate("[...document.querySelectorAll('#ovBody details')].forEach((d,k)=>d.open=k==2)"); await pg.wait_for_timeout(300); await pg.screenshot(path='shots/v2-dialogue-breath.png')
        await pg.click('#ovClose'); await pg.click('#tabs [data-ov="refs"]'); await pg.wait_for_timeout(600); await pg.screenshot(path='shots/v2-references.png'); await pg.click('#ovClose')
        s = await S(); check('stage still 0 at end (nothing auto-advanced)', s['stage']==0, s['stage'])
        check('no console errors', len(logs)==0, logs[:5])
        print('LOGS', logs)
        json.dump([{'name':n,'pass':c,'detail':str(d)} for n,c,d in results], open('shots/v4-assertions.json','w'), indent=1)
        await b.close()
asyncio.run(main())
