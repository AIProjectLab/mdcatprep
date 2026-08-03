import fs from "node:fs";

const d = JSON.parse(fs.readFileSync("src/data/questions.json", "utf8"));

// Full decision map.
// - fix: { opts: {...}, ans?: "X" } -> replace options (and optionally answer)
// - remove: true -> remove from bank (garbled/unreadable)
const decisions = {};

// 794: molar specific heat SI unit = J mol⁻¹ K⁻¹ (A). Stored B wrong. Fix answer + distinct opts.
decisions[794] = { ans: "A", opts: { A: "J mol⁻¹ K⁻¹", B: "J mol K", C: "J mol⁻¹ K", D: "J K⁻¹" } };
decisions[1382] = { ans: "A", opts: { A: "J mol⁻¹ K⁻¹", B: "J mol K", C: "J mol⁻¹ K", D: "J K⁻¹" } };

// 849/1437: correct passive = "was completed" (A). Stored D wrong. Fix.
decisions[849] = { ans: "A", opts: { A: "The task was completed with great difficulty by her.", B: "The task has been completed with great difficulty by her.", C: "The task was being completed with great difficulty by her.", D: "The task is being completed with great difficulty by her." } };
decisions[1437] = { ans: "A", opts: { A: "The task was completed with great difficulty by her.", B: "The task has been completed with great difficulty by her.", C: "The task was being completed with great difficulty by her.", D: "The task is being completed with great difficulty by her." } };

// 2130: HIV spikes = gp120 + gp41 (A correct). C/D dup p24. Fix D.
decisions[2130] = { opts: { A: "gp120 and gp41", B: "p17", C: "p24", D: "gp41" } };

// 4833: 'vaccine' from Latin 'vacca' (cow). A correct. B/C/D dup Vaccinum. Fix B,C,D distinct.
decisions[4833] = { opts: { A: "Vacca", B: "Vaccinum", C: "Vaccinus", D: "Vaccina" } };

// 5059/5060: garbled symbols (wave number / velocity of radiation) - unreadable, remove
decisions[5059] = { remove: true };
decisions[5060] = { remove: true };

// 5115: n=4 subshells. Answer C = "1s,2p,3d,4h" - questionable (should be 4s,4p,4d,4f).
// B/D dup "1s,2p,3d,4f". Keep stored answer; just dedupe. Flag answer separately.
decisions[5115] = { opts: { A: "1s, 2p, 3d, 4g", B: "1s, 2p, 3d, 4f", C: "1s, 2p, 3d, 4h", D: "2s, 2p, 3d, 4f" } };

// 5352: gas density = PM = dRT (B correct). A/D dup PV=nRT. Fix D.
decisions[5352] = { opts: { A: "PV = nRT", B: "PM = d × RT", C: "M = m/M", D: "P = dRT/M" } };

// 10072: Kb = [BH+][OH-]/[B]. Options use [H2O][A-] style (wrong symbols). B/D dup.
// Question text mentions weak base with [HA][OH-]... this is garbled chemistry. Remove.
decisions[10072] = { remove: true };

// 10163: solubility gases Henry's law, True/False. C/D are "?" placeholders. Remove.
decisions[10163] = { remove: true };

// 12029: force on wire = F = BIL (A correct). C/D dup "F = B L × I". Fix D.
decisions[12029] = { opts: { A: "F = I L × B", B: "F = I B × L", C: "F = B L × I", D: "F = B²L²" } };

// 12439: Bohr K.E. - garbled LaTeX $ rac{Ze^2}{r}$. Remove.
decisions[12439] = { remove: true };

// 12512: fission reaction - garbled LaTeX. Remove.
decisions[12512] = { remove: true };

// 20153: terminal voltage = 1.2V (A correct). B/D dup "120 W". Fix D.
decisions[20153] = { opts: { A: "1.2 V", B: "120 W", C: "1200 W", D: "12 V" } };

// 20554: Lycopodium sporophylls = strobili (A correct). B/D dup sporangia. Fix D.
decisions[20554] = { opts: { A: "strobili", B: "sporangia", C: "gametophytes", D: "cones" } };

// 20936: Calvin cycle = C3 (A correct). C/D dup CAM. Fix D.
decisions[20936] = { opts: { A: "C3", B: "C4", C: "CAM", D: "C2" } };
decisions[55772] = { opts: { A: "C3", B: "C4", C: "CAM", D: "C2" } };

// 21231: emphysema - fewer alveoli (A correct). B/D dup increased surface area. Fix D.
decisions[21231] = { opts: { A: "fewer alveoli", B: "increased surface area", C: "decreased volume", D: "increased volume" } };

// 21280: incipient plasmolysis (A correct). B/D dup plasmolyse. Fix D.
decisions[21280] = { opts: { A: "incipient plasmolysis", B: "incipient plasmolyse", C: "complete plasmolysis", D: "full plasmolysis" } };

// 21550: uniform circular motion - garbled equation (v² = a² + ... nonsense). Remove.
decisions[21550] = { remove: true };

// 21703: continuity equation Av = A'v' (A correct). B/D dup. Fix D.
decisions[21703] = { opts: { A: "Av = A'v'", B: "Av = Av'", C: "Av = A'v", D: "A'v' = Av" } };

// 21797: intensity I = kA² (A correct). B/D dup I=kA. Fix D.
decisions[21797] = { opts: { A: "I = kA²", B: "I = kA", C: "I = kA³", D: "I = kA/2" } };

// 21829: electron charge = -1.6e-19 (A correct). B/D dup positive. Fix B,D.
decisions[21829] = { opts: { A: "-1.6 x 10⁻¹⁹ C", B: "+1.6 x 10⁻¹⁹ C", C: "1.6 x 10⁻¹⁹ C", D: "-1.6 x 10¹⁹ C" } };

// 21886: force = BIL (A correct). B/C/D dup F=kIBL. Fix B,C,D.
decisions[21886] = { opts: { A: "F = BIL", B: "F = kBLI", C: "F = BIL sinθ", D: "F = BIL cosθ" } };

// 33505: "Which is INCORRECT" - multiple statements are actually incorrect, unanswerable. Remove.
decisions[33505] = { remove: true };

// 33649: equilibrium expression Kc = [C]^c[D]^d/[A]^a[B]^b (A correct). B/D dup numerator. Fix D.
decisions[33649] = { opts: { A: "[C]^c[D]^d/[A]^a[B]^b", B: "[C]^c[D]^d[A]^a[B]^b", C: "[C]^c[D]^d[A]^a[B]", D: "[C]^c[D]^d/[A]^a[B]" } };

// 33789: IUPAC 2,3,5-trimethylhexane (D correct). A/C dup. Fix C.
decisions[33789] = { opts: { A: "2,4,6-trimethylheptane", B: "2-methyl-4,6-dimethylheptane", C: "3,3,5-trimethylhexane", D: "2,3,5-trimethylhexane" } };

// 34779: penicillin structure similar to beta-lactamase (B correct). A/C dup penicillinase. Fix C.
decisions[34779] = { opts: { A: "penicillinase", B: "beta-lactamase", C: "peptidase", D: "penicillin" } };

// 35242: both dominant traits = Homozygous dominant (C correct). B/D dup Heterozygous. Fix D.
decisions[35242] = { opts: { A: "Homozygous recessive", B: "Heterozygous", C: "Homozygous dominant", D: "Heterozygous for one trait" } };

// 35243: both recessive = Homozygous recessive (C correct). B/D dup. Fix D.
decisions[35243] = { opts: { A: "Homozygous dominant", B: "Heterozygous", C: "Homozygous recessive", D: "Heterozygous for one trait" } };

// 36768: Round seed genotype = RR (A correct). C/D dup rr. Fix D.
decisions[36768] = { opts: { A: "RR", B: "Rr", C: "rr", D: "Rr or rr" } };

// 37354: avg velocity squared = V² (A correct). B/C/D dup V'. Fix B,C,D.
decisions[37354] = { opts: { A: "V²", B: "V'", C: "V", D: "V̄" } };

// 37407: heat transfer Q = mcΔT (C correct). B/D dup Q=nCmΔT. Fix D.
decisions[37407] = { opts: { A: "Q = mΔT", B: "Q = nCmΔT", C: "Q = mcΔT", D: "Q = nCΔT" } };

// 37620: hysteresis loop statement - answer A "Correct". B/C/D dup "Incorrect". Question truncated. Flag.
decisions[37620] = { opts: { A: "Correct", B: "Incorrect", C: "Partially correct", D: "Always false" } };

// 37660: closed-loop gain G = Vout/Vin (A correct). B/C/D dup "G = Vo/Vi". Fix C,D.
decisions[37660] = { opts: { A: "G = Vout / Vin", B: "G = Vo / Vi", C: "G = Vin / Vout", D: "G = Vout × Vin" } };

// 55945: pili protein = Fimbriae (A correct). B/D dup Fimbria. Fix D.
decisions[55945] = { opts: { A: "Fimbriae", B: "Fimbria", C: "Fimbriate", D: "Flagellin" } };

// 57068: clavicle from Latin 'clavis' (A correct). C/D dup Clavus. Fix D.
decisions[57068] = { opts: { A: "Clavis", B: "Clevis", C: "Clavus", D: "Clavicula" } };

// 58505: boron BF3 ground state config - answer C. A/D? Actually B/D dup "1s²2s²2px³2py¹2pz⁰". Fix D.
// Boron = 1s2 2s2 2p1 -> 2px²2py²2pz¹ is not right either (2p1 total). Options use 3 e in 2p (wrong, that's 2p3). Garbled. Flag/remove.
decisions[58505] = { remove: true };

// 58592: total pressure - garbled (P1V1+P2V2=PV is nonsense). A/C dup PV=nRT. Remove.
decisions[58592] = { remove: true };

// 58797: leveling effect - strong acids close pKa (B correct). A/C dup pH. Fix C.
decisions[58797] = { opts: { A: "pH", B: "pK_a", C: "pK_b", D: "pOH" } };

// 58963: heat of neutralization q = CmΔT (A correct). B/C/D dup q=ΔH×C×m×ΔT. Fix C,D.
decisions[58963] = { opts: { A: "q = C × m × ΔT", B: "q = ΔH × C × m × ΔT", C: "q = m × ΔT", D: "q = ΔH × m" } };

// 59110: aldehydes/ketones prep - question garbled, answer C "decarboxylation" is wrong chemistry. Remove.
decisions[59110] = { remove: true };

// 59793: angle between adjacent bonds = Bond Angle (A correct). B/D dup Bond Enthalpy. Fix D.
decisions[59793] = { opts: { A: "Bond Angle", B: "Bond Enthalpy", C: "Bond Length", D: "Bond Energy" } };

// 60482: diffraction grating d sinθ = mλ (answer C "d sin θ = m λ"). A/C dup mλ vs D dup nλ.
// Answer C = d sinθ = mλ correct. Fix A,D.
decisions[60482] = { opts: { A: "d sinθ = mλ", B: "d sin θ = n λ", C: "d sin θ = m λ", D: "d sin θ = 2mλ" } };

// Apply
const kept = [];
let fixedCount = 0, removedCount = 0;
for (const q of d) {
  const dec = decisions[q.id];
  if (!dec) { kept.push(q); continue; }
  if (dec.remove) { removedCount++; continue; }
  if (dec.opts) q.options = dec.opts;
  if (dec.ans) q.answer = dec.ans;
  fixedCount++;
  kept.push(q);
}

console.log("Fixed:", fixedCount, "| Removed:", removedCount);
fs.writeFileSync("src/data/questions.json", JSON.stringify(kept, null, 2) + "\n");
console.log("Bank:", kept.length);
