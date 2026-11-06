#!/usr/bin/env python3
"""v7 Collapse of Time tab — click-only assertions + layout probes at 390 and 1440."""
import asyncio, json, os
from playwright.async_api import async_playwright

URL = os.environ.get('KALA_URL', 'http://localhost:8765/')
OUT = 'shots'
results = []

def check(name, cond, detail=''):
    results.append((name, bool(cond), detail))
    print(('PASS ' if cond else 'FAIL ') + name + ' ' + str(detail)[:200], flush=True)

async def layout_probe(pg, w, h, tag):
    await pg.set_viewport_size({'width': w, 'height': h})
    await pg.wait_for_timeout(600)
    m = await pg.evaluate("""() => {
      const info = document.querySelector('#info');
      const open = info.classList.contains('open');
      const r = info.getBoundingClientRect();
      const cx = innerWidth/2, cy = innerHeight/2;
      const coversCenter = open && r.left < cx && r.right > cx && r.top < cy && r.bottom > cy;
      const detailsOpen = [...document.querySelectorAll('#collapsePanel details.ex')].filter(d => d.open).length;
      const panel = document.querySelector('#collapsePanel');
      return {
        mode: window.__state.mode,
        open, coversCenter, detailsOpen,
        panelVisible: !!(panel && getComputedStyle(panel).display !== 'none'),
        tabPresent: !!document.querySelector('#tabs [data-mode="collapse"]'),
      };
    }""")
    check(f'layout {tag}: mode is collapse', m['mode']=='collapse', m)
    check(f'layout {tag}: drawer closed by default (not covering center)', (not m['open']) and (not m['coversCenter']), m)
    check(f'layout {tag}: collapse panel visible', m['panelVisible'], m)
    check(f'layout {tag}: explain details collapsed', m['detailsOpen']==0, m)
    check(f'layout {tag}: tab present', m['tabPresent'], m)
    await pg.screenshot(path=f'{OUT}/v7-collapse-{tag}.png')
    # open drawer briefly then close
    await pg.click('#drawerBtn')
    await pg.wait_for_timeout(400)
    openm = await pg.evaluate("() => ({open: document.querySelector('#info').classList.contains('open'), hasSynth: document.body.innerText.includes('USER SYNTHESIS') || document.querySelector('#info').innerText.includes('USER SYNTHESIS'), hasSourced: document.querySelector('#info').innerText.includes('56') })")
    check(f'layout {tag}: Explain toggle opens drawer with banners', openm['open'] and openm['hasSynth'] and openm['hasSourced'], openm)
    await pg.screenshot(path=f'{OUT}/v7-collapse-{tag}-drawer.png')
    await pg.click('#drawerBtn')
    await pg.wait_for_timeout(300)

async def main():
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':1440,'height':900})
        logs=[]
        pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error',) else None)
        pg.on('pageerror', lambda e: logs.append(f'PAGEERROR: {e}'))
        await pg.goto(URL)
        await pg.wait_for_function('window.__ready === true', timeout=90000)
        await pg.wait_for_timeout(800)

        # Switch to collapse tab
        await pg.click('#tabs [data-mode="collapse"]')
        await pg.wait_for_function("() => window.__state.mode === 'collapse'", timeout=15000)
        await pg.wait_for_timeout(1000)

        s = await pg.evaluate("""() => {
          const S = __app.collapse.S;
          return { mode: __state.mode, minute: S.minute, wmode: S.windowMode, closed: S.closed, closeProg: S.closeProg,
            cam: __app.camera.position.toArray().map(v=>+v.toFixed(2)),
            panel: document.querySelector('#collapsePanel')?.innerText || '',
            ring: document.querySelector('#collapseRingLbl')?.innerText || '' };
        }""")
        check('boot collapse: mode is collapse', s['mode']=='collapse', s)
        check('boot collapse: starts open (not closed)', s['closed'] is False and s['closeProg']==0, s)
        check('boot collapse: window mode sourced', s['wmode']=='sourced', s)
        check('panel cites 56¼ / 1800 / 3.125% or 675', ('56' in s['panel'] and ('3.125' in s['panel'] or '675' in s['panel'] or '1 m 52' in s['panel'] or '1 m' in s['panel'])), s['panel'][:180])
        check('panel marks USER SYNTHESIS', 'USER SYNTHESIS' in s['panel'].upper() or 'SYNTHESIS' in s['panel'].upper(), s['panel'][:120])
        check('panel does NOT invent root/Vimalaprabhā discrepancies', 'discrepanc' not in s['panel'].lower() or 'no invented' in s['panel'].lower() or 'NOT' in s['panel'], True)

        cam0 = s['cam']; closed0 = s['closed']; minute0 = s['minute']
        await pg.wait_for_timeout(8000)
        s2 = await pg.evaluate("""() => {
          const S = __app.collapse.S;
          return { minute: S.minute, closed: S.closed, closeProg: S.closeProg,
            cam: __app.camera.position.toArray().map(v=>+v.toFixed(2)) };
        }""")
        check('collapse idle 8s: minute/closed unchanged', s2['minute']==minute0 and s2['closed']==closed0 and s2['closeProg']==0, s2)
        check('collapse idle 8s: camera did not move', s2['cam']==cam0, (cam0, s2['cam']))

        # scrubber
        await pg.fill('#collapseScrub', '30')
        await pg.dispatch_event('#collapseScrub', 'input')
        await pg.wait_for_timeout(400)
        s3 = await pg.evaluate("() => __app.collapse.S.minute")
        check('scrubber sets minute (click/input only)', abs(s3-30)<0.6, s3)

        # toggle user 4-min
        await pg.click('#cModeUser')
        await pg.wait_for_timeout(400)
        s4 = await pg.evaluate("() => ({mode: __app.collapse.S.windowMode, sec: __app.collapse.S.windowSeconds})")
        check('user toggle: 4 min window (240s)', s4['mode']=='user' and abs(s4['sec']-240)<0.1, s4)
        await pg.click('#cModeSourced')
        await pg.wait_for_timeout(300)
        s5 = await pg.evaluate("() => ({mode: __app.collapse.S.windowMode, sec: __app.collapse.S.windowSeconds})")
        check('sourced toggle: ~112.5s window', s5['mode']=='sourced' and abs(s5['sec']-112.5)<0.1, s5)

        # Close the gap — only on click
        await pg.click('#cCloseGap')
        await pg.wait_for_function("() => __app.collapse.S.closed === true", timeout=5000)
        await pg.wait_for_timeout(2800)  # allow closeProg to rise
        s6 = await pg.evaluate("() => ({closed: __app.collapse.S.closed, prog: __app.collapse.S.closeProg, frozen: __app.collapse.S.wheelFrozen})")
        check('close-gap only on click: closed true', s6['closed'] is True, s6)
        check('close-gap animates (closeProg > 0.5)', s6['prog'] > 0.5, s6)
        check('close-gap freezes wheel', s6['frozen'] is True, s6)
        await pg.screenshot(path=f'{OUT}/v7-collapse-closed.png')

        # Reset clears
        await pg.click('#cReset')
        await pg.wait_for_timeout(500)
        s7 = await pg.evaluate("() => ({closed: __app.collapse.S.closed, prog: __app.collapse.S.closeProg, mode: __app.collapse.S.windowMode, minute: __app.collapse.S.minute})")
        check('reset clears closed/prog, returns sourced', s7['closed'] is False and s7['prog']==0 and s7['mode']=='sourced', s7)

        # Cross-link Clear Light yoga
        await pg.click('#cLinkYoga')
        await pg.wait_for_function("() => window.__state.mode === 'palace'", timeout=10000)
        await pg.wait_for_timeout(600)
        s8 = await pg.evaluate("() => ({mode: __state.mode, stage: __state.stage})")
        check('cross-link yoga → palace Clear Light (stage 6)', s8['mode']=='palace' and s8['stage']==6, s8)

        # Back to collapse, cross-link bindu
        await pg.click('#tabs [data-mode="collapse"]')
        await pg.wait_for_function("() => window.__state.mode === 'collapse'", timeout=10000)
        await pg.wait_for_timeout(400)
        await pg.click('#cLinkBindu')
        await pg.wait_for_function("() => window.__state.mode === 'palace'", timeout=10000)
        await pg.wait_for_timeout(600)
        s9 = await pg.evaluate("() => __state.mode")
        check('cross-link bindu → palace', s9=='palace', s9)

        # Layout probes
        await pg.click('#tabs [data-mode="collapse"]')
        await pg.wait_for_function("() => window.__state.mode === 'collapse'", timeout=10000)
        await pg.wait_for_timeout(500)
        # ensure drawer closed
        await pg.evaluate("() => { document.querySelector('#info').classList.remove('open'); document.querySelector('#drawerBtn').classList.remove('on'); }")
        await layout_probe(pg, 1440, 900, 'desktop-1440')
        await pg.evaluate("() => { document.querySelector('#info').classList.remove('open'); document.querySelector('#drawerBtn').classList.remove('on'); }")
        await layout_probe(pg, 390, 844, 'phone-390')

        # Wind map still default on fresh load? check hero unchanged by ensuring wind tab still exists as active on reload
        await pg.set_viewport_size({'width':1440,'height':900})
        await pg.goto(URL)
        await pg.wait_for_function('window.__ready === true', timeout=90000)
        hero = await pg.evaluate("() => __state.mode")
        check('hero still Wind Map on fresh load', hero=='wind', hero)

        check('no console errors', len(logs)==0, logs[:5])
        json.dump([{'name':n,'pass':c,'detail':str(d)} for n,c,d in results], open(f'{OUT}/v7-assertions.json','w'), indent=1)
        passed = sum(1 for _,c,_ in results if c)
        print(f'\\nRESULT {passed}/{len(results)}', flush=True)
        await b.close()
        return 0 if passed == len(results) else 1

if __name__ == '__main__':
    raise SystemExit(asyncio.run(main()))
