# Kālacakra Maṇḍala Palace — interactive 3D

A single-page Three.js (WebGL) experience of the Kalachakra mandala palace.

**Live:** https://aiyogiwake.github.io/kalachakra-mandala/

- **Six Yogas dissolution nav** (upper left): six manual stages, then the emanation bloom, then **Phowa**, the final release: the bindu rises up the central axis and out through the 200-hasta roof tip, the palace dissolves into light, and the water thread lifts away. Nothing auto-plays; each click dissolves the palace to that stage only. The bindu glows brighter with each deeper stage.
- **Emanation threads**: clicking a shakti plays its multi-phase particle sequence. It goes from intention, through its own phase and the next phases of its field, to the field's climax, then hands off into the next field (light → earth closes the loop). You can step back and forward, pause, and read a caption for each phase. Every field also has a **Play the whole thread** button.
- **Expandable explanations** for every element: a plain account plus a clearly labelled imagined “Longchenpa in modern times” metaphor, and references.
- **The Human Maṇḍala — Three Kāyas**: a holographic seated figure showing the channels, wheels, drops and the kati channel. It steps through tummo one click at a time, ending with phowa (the drop leaving through the crown). This is an educational overview only, and these practices need empowerment and a qualified teacher.
- **Linked phowa**: clicking Phowa on the palace also runs the figure's phowa, and the figure's phowa step also runs the palace's. Both share one progress clock across tabs, and Re-manifest or Reset figure resets both.
- **Thögal: the four visions** (Human Maṇḍala tab), one click each: Direct Perception of the Ultimate Nature, Increasing Experience, Perfection of Intrinsic Awareness, and Dissolution of Phenomena, then the Rainbow Body. Karmic imprints appear as turning sentient geometry (a metaphor) that slows, stops and dissolves one form at a time into galactic vortexes and a moonlit night sky. There are thigle and vajra chains, five-light mandalas that fold back into the heart, and a full-spectrum breakthrough. The body thins into rainbow light that gathers on the same ground the phowa drop reaches.
- **Purpose of Kālacakra**: an imagined, clearly labelled dialogue between H.H. the Dalai Lama and Longchenpa. **References** lists real works only, with links that were checked.
- **Palace**: Body 200×200 hasta (four gates), Speech 100×100 raised 100, Mind 50×50 raised 50, Exalted Wisdom 25×25 raised 25, Great Bliss on a green lotus (Kālacakra & Viśvamātā, eight shaktis). Roof tip at 200 hasta: a cube of time. 1 hasta ≈ 6 ft.
- **Six elemental disks** beneath: earth, water, fire, wind, space, consciousness.
- **Eight elemental fields** in a closed, non-hierarchical orbit (earth → water → fire → desire → ether → mind → air → light → earth), 8 shaktis each = 64 clickable bija nodes. Each one turns into its own animated particle form when you hover or select it.
- **Aṣṭamātṛkā ring** of the eight mothers.
- **Emanation cascade**: bija → ḍākinī → Buddha family → planet → nakshatra, drawn as animated particle streams.
- Orbit/zoom, field isolation, 2D plan ↔ 3D extrusion slider.

The palace proportions, floors, disks, dissolution signs, five families, the eight Great-Bliss shaktis and the Aṣṭamātṛkā names follow commonly published descriptions. The per-shakti bijas, descriptive names and the ḍākinī/family/planet/nakshatra assignments are an artistic, interpretive mapping made for this visualization.

Static files only: `index.html`, `main.js`, `data.js`, `forms.js`, `chains.js`, `teachings.js`, `human.js`. Three.js loads from the unpkg CDN through an import map. To run it locally: `python3 -m http.server`.

## v4 — crisp labels, thögal in depth, elemental signatures
- **Labels** are now an HTML overlay (`#labels3d`), projected from 3D every frame: crisp at any zoom/DPR, never passed through bloom, backplate + text-shadow, serif titles / sans labels / Noto Sans Devanagari for bījas, distance fade, screen-space de-overlap (nudge with leader line, else hide), clickable where the 3D object was. The 64 bīja syllables are crisp gold HTML text on the nodes.
- **Thögal** (`thogal3d.js`): five-shell fresnel thigle in a deep field, double-helix beaded vajra chains on swaying catenaries, the crystal kati tube with light streaming from the eyes into the visions, true 3D polyhedra (stellated / nested, fresnel faces, luminous cores) inside thick 3D galactic vortexes, five-coloured 3D maṇḍala palaces (5 near in vision II, 40 on the sky sphere in III), a 360° full-spectrum burst at the breakthrough, fold-back of everything into the heart along curved paths, and a volumetric five-light sparkling rainbow body. Moonlit silver-blue, fog/haze depth layering. Geometry, not digits. Still click-only.
- **Fields** each have a particle signature (interpretive): earth crystalline grains, water droplets with refraction rim, fire rising teardrop embers, desire heartbeat-pulsing glow, ether sparse hollow rings, mind filament sparks with synaptic links, air streaked swirling wisps, light prismatic twinkling stars; node rings follow elemental yantra-like shapes.
- **64 forms**: 6400 smaller, crisper, DPR-aware points in the field's own point shape; several look-alikes redrawn (wind streamlines, afterglow shells, clear-light orb, aurora rays, galaxy arms, dream ripples, tree forms always half-grown). Contact sheet: `shots/v4-forms-contact-sheet.png`.
- `?fixedstep` URL flag: deterministic 30 fps virtual clock for screenshot capture only.
