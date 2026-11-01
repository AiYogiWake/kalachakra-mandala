import asyncio, sys
from playwright.async_api import async_playwright
SEQ = [(0, [(5.5, 'v5-ascension-1-rising')]), (1, [(3.5, 'v5-ascension-2a-stardust'), (7.5, 'v5-ascension-2-kailash')]),
       (2, [(4, 'v5-ascension-3a-lifting'), (8.5, 'v5-ascension-3-sadhus')]), (3, [(6.5, 'v5-ascension-4-vortex')])]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':1600,'height':900}); logs=[]
        pg.on('pageerror', lambda e: logs.append(str(e))); pg.on('console', lambda m: m.type=='error' and logs.append(m.text))
        await pg.goto('http://localhost:8765/?fixedstep'); await pg.wait_for_function('window.__ready === true', timeout=60000)
        for n, shots in SEQ:
            await pg.click(f'.ascstep[data-asc="{n}"]'); t0 = await pg.evaluate('__app.now()')
            await pg.click('#ascFocus')
            for st, name in shots:
                await pg.wait_for_function(f'__app.now() - {t0} >= {st}', polling=20, timeout=300000)
                await pg.screenshot(path=f'shots/{name}.png'); print(name, await pg.evaluate('JSON.stringify(__state.asc)'), flush=True)
        await pg.click('#resetView'); await pg.wait_for_timeout(3000); await pg.screenshot(path='shots/v5-ascension-5-overview.png')
        print('errors', logs); await b.close()
asyncio.run(main())
