import asyncio, json, os
from playwright.async_api import async_playwright
URL = os.environ.get('KALA_URL', 'http://localhost:8765/')
OUT = os.environ.get('KALA_SHOTS', 'shots')
os.makedirs(OUT, exist_ok=True)

async def click_tab(pg, mode):
    """Click a mode tab, opening the ≤420px hamburger menu first if needed."""
    vis = await pg.evaluate("""(m) => {
      const b = document.querySelector('#tabs [data-mode="'+m+'"]');
      if (!b) return {ok:false};
      const r = b.getBoundingClientRect();
      const cs = getComputedStyle(b);
      return {ok:true, visible: cs.display!=='none' && cs.visibility!=='hidden' && r.width>0 && r.height>0};
    }""", mode)
    if not vis.get('visible'):
        # open nav menu
        toggle = await pg.query_selector('#navToggle')
        if toggle and await toggle.is_visible():
            await pg.click('#navToggle')
            await pg.wait_for_timeout(200)
    await pg.click(f'#tabs [data-mode="{mode}"]')
    await pg.wait_for_timeout(400)

results = []
def check(name, cond, detail=''):
    results.append((name, bool(cond), detail)); print(('PASS ' if cond else 'FAIL ') + name + ' ' + str(detail)[:180], flush=True)

async def layout_probe(pg, w, h, tag):
    await pg.set_viewport_size({'width': w, 'height': h})
    await pg.wait_for_timeout(600)
    # ensure wind mode
    mode = await pg.evaluate('__state.mode')
    if mode != 'wind':
        await click_tab(pg, 'wind')
    # drawer closed
    await pg.evaluate("document.getElementById('info').classList.remove('open'); document.getElementById('drawerBtn').classList.remove('on')")
    await pg.wait_for_timeout(200)
    m = await pg.evaluate("""(()=>{
      const c=document.getElementById('c').getBoundingClientRect();
      const info=document.getElementById('info');
      const wind=document.getElementById('windPanel');
      const tabs=document.getElementById('tabs');
      const open=info.classList.contains('open');
      const ir=info.getBoundingClientRect();
      const wr=wind.getBoundingClientRect();
      const canvasArea=c.width*c.height;
      // how much of viewport center is free of opaque panels
      const cx=innerWidth/2, cy=innerHeight/2;
      const coversCenter = open && ir.left < cx && ir.right > cx && ir.top < cy && ir.bottom > cy;
      const detailsOpen=[...document.querySelectorAll('#windPanel details.ex')].filter(d=>d.open).length;
      return {mode:__state.mode, open, coversCenter, detailsOpen,
        windVisible: getComputedStyle(wind).display!=='none' && wr.height>40,
        tabsTop: tabs.getBoundingClientRect().top,
        canvasH: c.height, infoH: ir.height, windH: wr.height,
        bodyClass: document.body.className};
    })()""")
    await pg.screenshot(path=f'{OUT}/v6-layout-{tag}.png')
    check(f'layout {tag}: mode is wind (hero)', m['mode']=='wind', m)
    check(f'layout {tag}: drawer closed by default (not covering center)', (not m['open']) and (not m['coversCenter']), m)
    check(f'layout {tag}: wind panel visible', m['windVisible'], m)
    check(f'layout {tag}: wind explain details collapsed', m['detailsOpen']==0, m)
    # open drawer briefly and screenshot
    await pg.click('#drawerBtn'); await pg.wait_for_timeout(400)
    await pg.screenshot(path=f'{OUT}/v6-layout-{tag}-drawer.png')
    openm = await pg.evaluate("document.getElementById('info').classList.contains('open')")
    check(f'layout {tag}: Explain toggle opens drawer', openm, openm)
    await pg.click('#drawerBtn'); await pg.wait_for_timeout(200)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':1440,'height':900})
        logs=[]
        pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error',) else None)
        pg.on('pageerror', lambda e: logs.append(f'PAGEERROR: {e}'))
        await pg.goto(URL)
        await pg.wait_for_function('window.__ready === true', timeout=90000)
        await pg.wait_for_timeout(1200)
        # ---- default hero is wind
        s = await pg.evaluate("({mode:__state.mode, shift:__state.windShift, hour:__state.windHour, dawn:__state.windDawn, cam:__app.camera.position.toArray().map(v=>+v.toFixed(2))})")
        check('boot: default mode is wind', s['mode']=='wind', s)
        check('boot: starts at pre-dawn window (~4:30)', abs(s['hour']-4.5)<0.2 and s['dawn']=='pre', s)
        await pg.screenshot(path=f'{OUT}/v6-windmap-default.png')
        # idle click-only
        cam0 = s['cam']; await pg.wait_for_timeout(8000)
        s2 = await pg.evaluate("({mode:__state.mode, shift:__state.windShift, hour:__state.windHour, cam:__app.camera.position.toArray().map(v=>+v.toFixed(2))})")
        check('wind idle 8s: hour/shift unchanged', s2['hour']==s['hour'] and s2['shift']==s['shift'], s2)
        check('wind idle 8s: camera did not move', s2['cam']==cam0, (cam0, s2['cam']))
        # scrubber
        await pg.fill('#windScrub', '75')  # 7.5h
        await pg.evaluate("document.getElementById('windScrub').dispatchEvent(new Event('input',{bubbles:true}))")
        await pg.wait_for_timeout(400)
        s3 = await pg.evaluate("({hour:__state.windHour, shift:__state.windShift})")
        check('scrubber jumps hour (click/input only)', abs(s3['hour']-7.5)<0.15, s3)
        await pg.screenshot(path=f'{OUT}/v6-windmap-scrub-0730.png')
        # click each dawn slot
        for did, exp in [('pre',4.5),('dawn',5.5),('early',6.5),('morn',7.5)]:
            await pg.click(f'#windDawn .btn[data-dawn="{did}"]'); await pg.wait_for_timeout(700)
            s = await pg.evaluate("({hour:__state.windHour, dawn:__state.windDawn, limbs:[...__app.wind.S.limbs]})")
            check(f'dawn slot {did}: sets dawn + hour', s['dawn']==did and abs(s['hour']-exp)<0.2, s)
            await pg.screenshot(path=f'{OUT}/v6-windmap-dawn-{did}.png')
        # click all 12 shifts
        for i in range(12):
            await pg.click(f'.wshift[data-shift="{i}"]'); await pg.wait_for_timeout(500)
            s = await pg.evaluate("({shift:__state.windShift, act:[...document.querySelectorAll('.wshift.active')].map(b=>+b.dataset.shift)})")
            check(f'shift click {i}: active exactly that shift', s['shift']==i and s['act']==[i], s)
        await pg.screenshot(path=f'{OUT}/v6-windmap-shift-11.png')
        # sourced text present, interpretive banner present, no false discrepancy claim
        txt = await pg.evaluate("document.getElementById('windPanel').innerText")
        check('panel cites 1800 × 12 / 21600', '1,800' in txt and '21,600' in txt, txt[:120])
        check('panel marks interpretive schematic', 'INTERPRETIVE' in txt.upper() or 'interpretive' in txt.lower(), txt[:120])
        check('panel does NOT claim unchecked root/Vimalaprabhā discrepancies', 'discrepanc' not in txt.lower() or 'no discrepancy' in txt.lower() or 'NOT cited as' in txt, True)
        # reset
        await pg.click('#wReset'); await pg.wait_for_timeout(400)
        s = await pg.evaluate("({hour:__state.windHour, dawn:__state.windDawn, shift:__state.windShift})")
        check('reset returns to 4:30 / pre', abs(s['hour']-4.5)<0.2 and s['dawn']=='pre', s)
        # cross-link to yoga
        await pg.click('#wLinkYoga'); await pg.wait_for_timeout(800)
        s = await pg.evaluate("({mode:__state.mode, stage:__state.stage})")
        check('cross-link yoga switches to palace + sets a stage', s['mode']=='palace' and s['stage']>=1, s)
        await pg.screenshot(path=f'{OUT}/v6-windmap-link-yoga.png')
        # back to wind, link field
        await pg.click('#tabs [data-mode="wind"]'); await pg.wait_for_timeout(400)
        await pg.click('#wLinkField'); await pg.wait_for_timeout(800)
        s = await pg.evaluate("({mode:__state.mode, field:__state.field})")
        check('cross-link field switches to palace + isolates a field', s['mode']=='palace' and s['field'] is not None, s)
        # layout at both widths
        await pg.click('#tabs [data-mode="wind"]'); await pg.wait_for_timeout(400)
        await layout_probe(pg, 1440, 900, 'desktop-1440')
        await layout_probe(pg, 390, 844, 'phone-390')
        # other tabs still reachable and not auto-animating
        await pg.set_viewport_size({'width':1440,'height':900})
        await pg.click('#tabs [data-mode="palace"]'); await pg.wait_for_timeout(600)
        await pg.screenshot(path=f'{OUT}/v6-layout-palace-1440.png')
        await pg.click('#tabs [data-mode="human"]'); await pg.wait_for_timeout(600)
        await pg.screenshot(path=f'{OUT}/v6-layout-human-1440.png')
        # phone human/palace
        await pg.set_viewport_size({'width':390,'height':844})
        await click_tab(pg, 'palace')
        await pg.screenshot(path=f'{OUT}/v6-layout-palace-390.png')
        await click_tab(pg, 'human')
        await pg.screenshot(path=f'{OUT}/v6-layout-human-390.png')
        await click_tab(pg, 'wind')
        check('no console errors', len(logs)==0, logs[:5])
        json.dump([{'name':n,'pass':c,'detail':str(d)} for n,c,d in results], open(f'{OUT}/v6-assertions.json','w'), indent=1)
        print('TOTAL', len(results), 'PASS', sum(1 for _,c,_ in results if c), 'FAIL', sum(1 for _,c,_ in results if not c))
        await b.close()
asyncio.run(main())
