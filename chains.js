// Emanation chains — each field tells one story of how intention becomes body, handing off to the next field.
// Captions: name + one-line note in the imagined voice of "Longchenpa landed in modern times" (not quotations).
// ORBIT: earth → water → fire → desire → ether → mind → air → light → earth
import { FIELDS, SHAKTIS } from './data.js';

// thread = shakti j indices (within the field) in story order; caps keyed by form; climax = two closing phases.
const STORIES = {
  earth: { thread: [7, 0, 4, 5, 6, 1, 2, 3], caps: {
      crystal: ['Lattice', 'The first ordering of matter: a crystal is a rule repeated until it shines.'],
      stone: ['Stone', 'Data written to the slowest, surest disk.'],
      mountain: ['Mountain', 'Mass stacked into a world-axis: Meru as the server tower.'],
      roots: ['Roots', 'Earth reaches down: the system mounts its own foundation.'],
      seed: ['Seed', 'A compressed archive that unpacks itself into a life.'],
      bone: ['Bone', 'The world’s scaffolding, now inside a body.'],
      flesh: ['Flesh', 'Earth learns to contract and move.'],
      body: ['The body’s mass', 'The full hardware stack: you are a mountain that breathes.'] },
    climax: [['gravity', 'Gravity well', 'Mass draws everything to its centre; even a planet longs.'], ['spring', 'The spring', 'Press stone hard enough and water appears: earth hands its secret to water.']] },
  water: { thread: [0, 6, 7, 1, 3, 2, 4, 5], caps: {
      mist: ['Vapor — the intention of water', 'Before the ocean, the wish to flow: water as pure intent.'],
      waves: ['Ocean and wave', 'The intent becomes an ocean, and the ocean lifts one wave: one process forked from the sea.'],
      dew: ['Dew', 'The sea, distilled into a single bead on a leaf.'],
      rain: ['Rain', 'The cloud downloads itself to earth.'],
      kidneys: ['The kidney element', 'Water takes residence in an organ: the body’s own filtering ocean.'],
      amnion: ['The womb-sea', 'Every body boots first in water.'],
      union: ['Two currents entwine', 'Two beings’ waters move toward each other: a double helix of attraction.'],
      mitosis: ['Procreation', 'One cell copies itself: the oldest fork() call.'] },
    climax: [['being', 'A being with kidneys', 'The waters now circulate in a body, glowing in the lower back: the ocean wearing skin.'], ['drops', 'White drop meets the red moon', 'The white drop travels; the red moon receives. Union of the two drops, and the meeting calls down lightning.']] },
  fire: { thread: [4, 5, 0, 6, 7, 1, 3, 2], caps: {
      lightning: ['Lightning — the spark of union', 'Water’s union discharges as light: the first ignition.'],
      sparks: ['Sparks', 'The ignition scatters: fireflies, the third sign.'],
      flame: ['Flame', 'Fire stands up: one thin line of heat, the posture of tummo.'],
      kunda: ['The hearth', 'Fire contained, fed and offered.'],
      lamp: ['Lamp', 'Fire becomes steady enough to read by.'],
      digestion: ['Digestive fire', 'Fire moves inward and ripens food into body.'],
      heat: ['Metabolic heat', 'The body runs warm: every cell a small furnace in convection.'],
      sun: ['Sun', 'The inner fire mirrors the outer: one sun in the sky, one at the navel.'] },
    climax: [['blaze', 'Blaze', 'Heat at full load, spiralling upward.'], ['kindle', 'The heart catches fire', 'Fire learns warmth for another: heat turning into desire.']] },
  desire: { thread: [0, 6, 1, 2, 4, 5, 3, 7], caps: {
      attraction: ['Attraction', 'Two masses notice each other: the first pull.'],
      magnet: ['Magnetic draw', 'Attraction drawn as a field: invisible, everywhere.'],
      heart: ['The heart’s pull', 'Desire finds its organ and starts to beat.'],
      longing: ['Longing', 'Reaching toward a light not yet reached: the request still in flight.'],
      embrace: ['Embrace', 'Two rings interlocked: neither owns the other.'],
      nectar: ['Nectar', 'Bliss condensing, drop by sweet drop.'],
      lotus: ['Lotus opening', 'Desire, unclenched, becomes a flower that grew from mud.'],
      blossom: ['Blossoming', 'Desire fulfilled as offering: the branch gives itself away.'] },
    climax: [['bloomBurst', 'Petals to the sky', 'The blossom releases its petals into open space: desire letting go.'], ['pulse', 'The pulse of release', 'What was held now radiates: waves into emptiness.']] },
  ether: { thread: [0, 2, 5, 7, 6, 4, 1, 3], caps: {
      hollow: ['Hollow space', 'Space appears as room: nested, open, ready.'],
      silence: ['Silence', 'Almost nothing: the most important part of the signal.'],
      sky: ['Sky dome', 'Space gets a shape: the dome that holds every weather.'],
      torus: ['The void torus', 'Flow around an empty centre: the shape of every vortex and every breath.'],
      bell: ['Bell', 'Emptiness struck, and it rings.'],
      nada: ['Sound shaping matter', 'Vibration arranges dust into pattern: code compiling itself.'],
      channels: ['The three channels', 'Space becomes a pipe system inside the body.'],
      chakras: ['Wheels', 'Routers threaded on the central channel.'] },
    climax: [['constellate', 'Knowing appears', 'Points of awareness light up in the void and link: space becoming cognisant.'], ['halo', 'Rings of awareness', 'The links become orbits: the first circles of mind.']] },
  mind: { thread: [1, 3, 0, 6, 4, 7, 5, 2], caps: {
      thirdEye: ['Third-eye oval', 'Awareness opens an eye: the ground looking at its own display.'],
      dream: ['Dream ripples', 'Images ripple across the lake of mind.'],
      neurons: ['Web of thought', 'Thought branches like a neural net, firing.'],
      fractal: ['Proliferation', 'Concepts copy themselves: every branch another branch.'],
      knot: ['Memory knot', 'A loop that cannot be untied by pulling.'],
      mandala: ['Turning mandala', 'Mind arranges itself in circles: order as ornament.'],
      galaxy: ['Spiral of insight', 'Insight turns, and the clutter becomes a galaxy.'],
      moonStars: ['Moon and stars', 'Mind at night: crescent clarity, scattered sparks.'] },
    climax: [['thoughtWind', 'Thoughts ride the wind', 'Every thought is carried by a wind: mind and prāṇa as rider and horse.'], ['channels', 'Into the channels', 'The rider-wind enters the pipes of the body.']] },
  air: { thread: [0, 2, 7, 1, 6, 5, 4, 3], caps: {
      breath: ['Breath', 'The tide in and out: 21,600 ticks of the body’s clock in a day.'],
      lungs: ['Lungs', 'Breath gets a home and a branching tree.'],
      pulse: ['Pulse', 'Wind in the blood, wave after wave.'],
      wind: ['Wind', 'The breath leaves the body and becomes weather.'],
      leaves: ['Swirling leaves', 'Wind made visible by what it carries.'],
      flock: ['Flock', 'Many winds, one intelligence.'],
      vortex: ['Whirlwind', 'Wind concentrated to a single axis.'],
      movement: ['Movement', 'The body dancing: wind as choreography.'] },
    climax: [['eyeOfStorm', 'The eye of the storm', 'All winds turning around one still, bright centre.'], ['lamp', 'The steady lamp', 'Wind stills, and only the lamp-flame remains: the fourth sign.']] },
  light: { thread: [5, 0, 7, 6, 4, 1, 2, 3], caps: {
      dawn: ['Dawn', 'Light rises at the horizon of the mind.'],
      radiance: ['Radiance', 'The core outputs light in every direction.'],
      halo: ['Halo rings', 'Light orbits itself.'],
      aurora: ['Aurora', 'Light curtains: the sky’s own screensaver.'],
      rainbow: ['Rainbow body', 'All colours, no solidity.'],
      afterglow: ['Residual luminosity', 'Light that remains after the image fades.'],
      eclipse: ['Near-attainment', 'The black screen with a bright corona: not off, just not drawing.'],
      clearLight: ['Clear light', 'The screen itself, lit and blank.'] },
    climax: [['fiveLights', 'The five lights', 'Clear light splits into five colours, the five elements’ subtle source.'], ['condense', 'Light condenses', 'Light slows, cools, and settles as dust and crystal: the screen begins to draw earth again.']] },
};

const KEYS = FIELDS.map((f) => f.key);
export const INTENT_CAP = (f) => [`Intention — the bija of ${f.name} stirs`, 'Before any app runs, there is the intent to run it: a seed syllable spinning in the void.'];
export function fieldStory(fi) {
  const f = FIELDS[fi], S = STORIES[f.key], next = (fi + 1) % 8, Sn = STORIES[KEYS[next]];
  const thread = S.thread.map((j) => { const s = SHAKTIS[fi * 8 + j]; const [name, voice] = S.caps[s.form]; return { kind: 'shakti', form: s.form, idx: s.idx, field: fi, name, voice }; });
  const climax = S.climax.map(([form, name, voice]) => ({ kind: 'climax', form, field: fi, name, voice }));
  const ns = SHAKTIS[next * 8 + Sn.thread[0]]; const [hn, hv] = Sn.caps[ns.form];
  const handoff = { kind: 'handoff', form: ns.form, field: next, idx: ns.idx, name: `Hand-off → ${FIELDS[next].name}: ${hn}`, voice: hv };
  return { thread, climax, handoff };
}
// Chain for one shakti: intent → its own phase → up to two following phases → two climax phases → hand-off (5–7 phases)
export function shaktiChain(idx) {
  const s = SHAKTIS[idx], fi = s.field, st = fieldStory(fi); const pos = st.thread.findIndex((p) => p.idx === idx);
  const [iname, ivoice] = INTENT_CAP(FIELDS[fi]);
  return [{ kind: 'intent', form: 'intent', field: fi, idx, name: iname, voice: ivoice }, ...st.thread.slice(pos, pos + 3), ...st.climax, st.handoff];
}
// Whole thread of a field: intent → 8 shaktis in story order → climax → hand-off
export function threadChain(fi) {
  const st = fieldStory(fi); const [iname, ivoice] = INTENT_CAP(FIELDS[fi]);
  return [{ kind: 'intent', form: 'intent', field: fi, idx: st.thread[0].idx, name: iname, voice: ivoice }, ...st.thread, ...st.climax, st.handoff];
}
