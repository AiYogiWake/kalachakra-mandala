# Kālacakra Maṇḍala Palace — interactive 3D

A single-page Three.js (WebGL) experience of the Kalachakra mandala palace.

**Live:** https://aiyogiwake.github.io/kalachakra-mandala/

- **Six Yogas dissolution nav** (upper left): six manual stages + emanation bloom. Nothing auto-plays; each click dissolves the palace to that stage only. The bindu glows brighter with each deeper stage.
- **Palace**: Body 200×200 hasta (four gates), Speech 100×100 raised 100, Mind 50×50 raised 50, Exalted Wisdom 25×25 raised 25, Great Bliss on a green lotus (Kālacakra & Viśvamātā, eight shaktis). Roof tip at 200 hasta: a cube of time. 1 hasta ≈ 6 ft.
- **Six elemental disks** beneath: earth, water, fire, wind, space, consciousness.
- **Eight elemental fields** in a closed, non-hierarchical orbit (earth → water → fire → desire → ether → mind → air → light → earth), 8 shaktis each = 64 clickable bija nodes. Each one turns into its own animated particle form when you hover or select it.
- **Aṣṭamātṛkā ring** of the eight mothers.
- **Emanation cascade**: bija → ḍākinī → Buddha family → planet → nakshatra, drawn as animated particle streams.
- Orbit/zoom, field isolation, 2D plan ↔ 3D extrusion slider.

The palace proportions, floors, disks, dissolution signs, five families, the eight Great-Bliss shaktis and the Aṣṭamātṛkā names follow commonly published descriptions. The per-shakti bijas, descriptive names and the ḍākinī/family/planet/nakshatra assignments are an artistic, interpretive mapping made for this visualization.

Static files only: `index.html`, `main.js`, `data.js`, `forms.js`. Three.js loads from the unpkg CDN through an import map. To run it locally: `python3 -m http.server`.
