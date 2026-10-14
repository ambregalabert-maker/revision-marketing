// Vérifie les fichiers de contenu (src/data) : identifiants uniques, notions valides,
// une bonne réponse par question, volumes minimum. Lance : npm run check
import { readFileSync } from 'node:fs'

const lire = (f) => JSON.parse(readFileSync(new URL(`../src/data/${f}`, import.meta.url), 'utf8'))
const erreurs = []
const notions = new Set(lire('notions.json').map((n) => n.id))
const ids = new Set()

function verifierBase(item, fichier) {
  if (ids.has(item.id)) erreurs.push(`${fichier} : identifiant en double « ${item.id} »`)
  ids.add(item.id)
  if (![1, 2].includes(item.seance)) erreurs.push(`${fichier} › ${item.id} : seance doit valoir 1 ou 2`)
  for (const n of item.notions ?? [item.notion]) {
    if (!notions.has(n)) erreurs.push(`${fichier} › ${item.id} : notion inconnue « ${n} »`)
  }
}

const flashcards = lire('flashcards.json')
flashcards.forEach((c) => {
  verifierBase(c, 'flashcards.json')
  if (!c.recto || !c.verso || !c.exemple) erreurs.push(`flashcards.json › ${c.id} : recto, verso et exemple sont obligatoires`)
})

const qcm = lire('qcm.json')
qcm.forEach((q) => {
  verifierBase(q, 'qcm.json')
  const bonnes = q.choix.filter((c) => c.correct).length
  if (q.choix.length !== 4) erreurs.push(`qcm.json › ${q.id} : il faut exactement 4 propositions`)
  if (bonnes === 0) erreurs.push(`qcm.json › ${q.id} : aucune bonne réponse`)
  if (bonnes > 1 && !q.multiple) erreurs.push(`qcm.json › ${q.id} : plusieurs bonnes réponses → ajoute "multiple": true`)
  if (bonnes === 1 && q.multiple) erreurs.push(`qcm.json › ${q.id} : "multiple" mais une seule bonne réponse`)
  q.choix.forEach((c, i) => { if (!c.pourquoi) erreurs.push(`qcm.json › ${q.id} : proposition ${i + 1} sans « pourquoi »`) })
  if (!q.explication) erreurs.push(`qcm.json › ${q.id} : explication manquante`)
})

const classements = lire('classements.json')
classements.forEach((c) => {
  verifierBase(c, 'classements.json')
  const cats = new Set(c.categories.map((x) => x.id))
  c.elements.forEach((e) => {
    if (!cats.has(e.categorie)) erreurs.push(`classements.json › ${c.id} › ${e.id} : catégorie inconnue « ${e.categorie} »`)
    if (c.sousCategories) {
      const sous = new Set((c.sousCategories[e.categorie] ?? []).map((x) => x.id))
      if (!sous.has(e.sousCategorie)) erreurs.push(`classements.json › ${c.id} › ${e.id} : sous-catégorie « ${e.sousCategorie} » absente de « ${e.categorie} »`)
    }
  })
})

const vf = lire('vraifaux.json')
vf.forEach((v) => {
  verifierBase(v, 'vraifaux.json')
  if (!['vrai', 'faux', 'nuance'].includes(v.reponse)) erreurs.push(`vraifaux.json › ${v.id} : reponse doit être vrai, faux ou nuance`)
})

const cas = lire('cas.json')
cas.forEach((c) => verifierBase(c, 'cas.json'))
lire('donnees-cours.json').forEach((d) => {
  if (!notions.has(d.notion)) erreurs.push(`donnees-cours.json › ${d.id} : notion inconnue`)
})

const compte = (liste, s) => liste.filter((x) => x.seance === s).length
console.log(`Flashcards : ${flashcards.length} (séance 1 : ${compte(flashcards, 1)}, séance 2 : ${compte(flashcards, 2)})`)
console.log(`QCM : ${qcm.length} (séance 1 : ${compte(qcm, 1)}, séance 2 : ${compte(qcm, 2)})`)
console.log(`Classements : ${classements.length} · Vrai/Faux : ${vf.length} · Cas pratiques : ${cas.length}`)

if (flashcards.length < 45) erreurs.push('Il faut au moins 45 flashcards')
if (qcm.length < 50) erreurs.push('Il faut au moins 50 questions de QCM')
if (classements.length < 8) erreurs.push('Il faut au moins 8 exercices de classement')
if (cas.length < 4) erreurs.push('Il faut au moins 4 cas pratiques')

if (erreurs.length) {
  console.error('\n❌ Problèmes trouvés :\n- ' + erreurs.join('\n- '))
  process.exit(1)
}
console.log('\n✅ Contenu valide.')
