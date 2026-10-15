# Mark'Up · Marketing, chapitre 1 « Le concept de marché »

Site de révision pour les étudiants de Bachelor 1re année, en deux modes :

- **Le daily** (page d'accueil) : un chemin façon Duolingo, une étape de 3 minutes par notion. Les étoiles suivent la répétition espacée : ⭐ au 1er passage, ⭐⭐ en revenant au moins 1 jour plus tard (70 % de bonnes réponses), ⭐⭐⭐ une semaine après. Pas de minuteur.
- **Le mode Tryhard** : une séance de 5, 10, 25 minutes ou plus, qui s'adapte à la durée et commence par tes points faibles et tes erreurs (minuteur discret, masquable). Plus l'accès direct aux flashcards, au QCM (avec un mode examen noté sur 10), aux calculs, classements, vrai/faux et cas pratiques.

Et aussi : un **compagnon kawaii** à adopter et à baptiser (renard, panda ou licorne arc-en-ciel) qui t'attend sur le chemin et réagit pendant tes séances, une **boutique** d'accessoires payés en Marks 🪙 (1 Mark pour 10 XP, gagnés automatiquement, + un coffre de 20 Marks au premier bilan terminé), **4 mondes gratuits** pour le décor du chemin (Arc-en-ciel, Jardin, Galaxie, Hiver), de petites animations (l'étoile gagnée s'envole vers le compteur, le compagnon saute au rond suivant), XP, niveaux, série avec joker, badges, un menu **Personnaliser** (couleur Pêche, Menthe, Lavande ou Rose, mode sombre, durée de séance préférée, minuteur), et une page **Astuces** ludique (quiz « Quel·le réviseur·se es-tu ? », astuces en stories, mini-jeu « Repère l'erreur », semaine type à cocher).

- **Sans compte** (mode invité), la progression est sauvegardée dans le navigateur.
- **Avec un compte** (Supabase, gratuit), elle est sauvegardée en ligne et tu la retrouves sur tous tes appareils.

---

## Sommaire

1. [Lancer le site sur ton ordinateur](#1-lancer-le-site-sur-ton-ordinateur)
2. [Activer les comptes avec Supabase](#2-activer-les-comptes-avec-supabase)
3. [Mettre le site en ligne avec Vercel](#3-mettre-le-site-en-ligne-avec-vercel) (ou [Netlify](#variante--netlify))
4. [Corriger ou ajouter une question](#4-corriger-ou-ajouter-une-question)
5. [Organisation du code](#5-organisation-du-code)

---

## 1. Lancer le site sur ton ordinateur

**Une seule fois** : installe [Node.js](https://nodejs.org) (version « LTS », le gros bouton vert), puis télécharge le projet (sur GitHub : bouton vert **Code** → **Download ZIP**, puis dézippe-le).

Ouvre un terminal **dans le dossier du projet**. Sur Mac : clic droit sur le dossier → *Nouveau terminal au dossier*. Sur Windows : dans le dossier, tape `cmd` dans la barre d'adresse puis Entrée.

```bash
npm install      # installe les outils (une seule fois, ~1 minute)
npm run dev      # lance le site
```

Ouvre ensuite **http://localhost:5173** dans ton navigateur. Pour arrêter le site, reviens dans le terminal et appuie sur `Ctrl + C`.

Autres commandes utiles :

| Commande | À quoi elle sert |
|---|---|
| `npm run build` | Vérifie qu'il n'y a pas d'erreur et prépare la version à mettre en ligne |
| `npm run check` | Vérifie les fichiers de contenu (questions, flashcards…) |
| `npm test` | Lance les tests automatiques (répétition espacée, série, XP, synchronisation) |

---

## 2. Activer les comptes avec Supabase

> Facultatif : sans cette étape, le site marche très bien en mode invité.

### a) Créer le projet (5 minutes)

1. Va sur **https://supabase.com** → **Start your project** → connecte-toi (avec ton compte GitHub, c'est le plus simple).
2. Clique sur **New project**.
   - *Name* : `revision-marketing`
   - *Database Password* : clique sur **Generate a password** (tu n'en auras pas besoin ensuite, mais garde-le de côté).
   - *Region* : **West EU (Paris)** ou une région européenne proche.
   - Clique sur **Create new project** et attends 1 à 2 minutes.

### b) Créer les tables

1. Dans le menu de gauche, clique sur **SQL Editor** (icône `>_`).
2. Clique sur **New query** (ou le **+**).
3. Ouvre le fichier [`supabase/schema.sql`](supabase/schema.sql) de ce projet, **copie tout son contenu** et colle-le dans l'éditeur.
4. Clique sur **Run** (en bas à droite). Tu dois voir « Success. No rows returned ».

> Tu avais déjà collé une ancienne version de ce fichier ? Recolle simplement la nouvelle en entier : elle ajoute ce qui manque (les étoiles du chemin, la boutique) sans effacer les données.

> Supabase peut afficher un avertissement sur la vue `classement_semaine` (« security definer view »). C'est voulu : cette vue ne montre que le pseudo et les XP de la semaine des étudiants qui ont accepté d'apparaître dans le classement.

### c) Régler les adresses de redirection

1. Menu de gauche : **Authentication** → **URL Configuration**.
2. *Site URL* : pour l'instant `http://localhost:5173` (tu la remplaceras par l'adresse Vercel à l'étape 3).
3. *Redirect URLs* → **Add URL** : ajoute `http://localhost:5173/connexion`.

### d) Copier les deux clés dans le projet

1. Clique sur **Connect** (en haut de la page du projet) ou va dans **Project Settings** (roue dentée) → **API Keys** / **Data API**.
2. Repère :
   - l'**URL du projet** (`https://xxxxxxxx.supabase.co`) ;
   - la clé publique : **anon public** (ou **Publishable key**, qui commence par `sb_publishable_`). ⚠️ **Jamais** la clé `service_role` / `secret`.
3. Dans le dossier du projet, fais une copie du fichier `.env.example` et nomme-la **`.env.local`**.
4. Ouvre `.env.local` et colle tes valeurs :

   ```
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=ta-cle-publique
   ```

5. Arrête le site (`Ctrl + C`) et relance `npm run dev`. Le bouton **Créer un compte** apparaît dans le profil.

> Le fichier `.env.local` n'est jamais envoyé sur GitHub (il est dans `.gitignore`). La clé « anon / publishable » peut être publique : c'est la sécurité « Row Level Security » de la base qui protège les données (chaque étudiant ne voit que ses propres lignes).

**Confirmation par e-mail** : par défaut, Supabase demande de confirmer son adresse e-mail après l'inscription. L'offre gratuite n'envoie que quelques e-mails par heure. Pour un petit groupe, tu peux désactiver la confirmation dans **Authentication** → **Sign In / Providers** → **Email** → décoche **Confirm email**.

---

## 3. Mettre le site en ligne avec Vercel

1. Va sur **https://vercel.com** → **Sign Up** → **Continue with GitHub**.
2. **Add New…** → **Project** → choisis le dépôt **revision-marketing** → **Import**.
3. Vercel détecte tout seul « Vite ». Ouvre **Environment Variables** et ajoute les deux mêmes variables que dans `.env.local` :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Clique sur **Deploy**. Après ~1 minute, tu obtiens une adresse du type `https://revision-marketing.vercel.app`.
5. **Retourne dans Supabase** → **Authentication** → **URL Configuration** :
   - *Site URL* : ton adresse Vercel ;
   - *Redirect URLs* : ajoute `https://ton-adresse.vercel.app/connexion`.

Ensuite, **chaque modification envoyée sur GitHub met le site à jour automatiquement**.

### Variante : Netlify

1. **https://app.netlify.com** → **Add new site** → **Import an existing project** → GitHub → `revision-marketing`.
2. *Build command* : `npm run build` · *Publish directory* : `dist`.
3. **Environment variables** : ajoute les deux variables `VITE_SUPABASE_…`, puis **Deploy**.
4. Mets à jour les adresses dans Supabase comme ci-dessus.

(Le fichier `public/_redirects` est déjà prêt pour que les pages comme `/reviser` marchent sur Netlify ; `vercel.json` fait la même chose pour Vercel.)

---

## 4. Corriger ou ajouter une question

Tout le contenu pédagogique est dans **`src/data/`**, en fichiers JSON. Tu peux les modifier directement sur GitHub : ouvre le fichier → icône crayon ✏️ → modifie → **Commit changes**. Vercel remet le site à jour tout seul.

| Fichier | Contenu |
|---|---|
| `notions.json` | Les 10 notions du chapitre (pour le suivi de maîtrise) |
| `flashcards.json` | Les flashcards |
| `qcm.json` | Les questions de QCM |
| `classements.json` | Les exercices de classement (glisser-déposer) |
| `vraifaux.json` | Le vrai/faux du marketing |
| `cas.json` | Les cas pratiques |
| `donnees-cours.json` | Les calculs sur les données réelles du cours |
| `astuces.json` | La page Astuces : les stories, le quiz « Quel·le réviseur·se es-tu ? », le mini-jeu « Repère l'erreur » et la semaine type |

### Exemple : ajouter une question de QCM

Copie un bloc existant de `qcm.json`, colle-le **après une accolade fermante suivie d'une virgule** `},`, et modifie-le :

```json
{
  "id": "q-tm-09",
  "seance": 1,
  "notion": "types-de-marche",
  "question": "Pour une marque de thé, le sucre appartient au marché…",
  "choix": [
    { "texte": "complémentaire", "correct": true, "pourquoi": "On le met dans son thé : il se consomme avec." },
    { "texte": "de substitution", "correct": false, "pourquoi": "Le sucre ne remplace pas le thé." },
    { "texte": "principal", "correct": false, "pourquoi": "Le marché principal est celui du thé." },
    { "texte": "Aucun : ce n'est pas lié", "correct": false, "pourquoi": "Il se consomme avec le thé : il est lié." }
  ],
  "explication": "Complémentaire = « avec ». Substitution = « à la place de »."
}
```

Les règles :

- `id` : unique, jamais deux fois le même (sinon la progression se mélange).
- `seance` : `1` ou `2`.
- `notion` : un des identifiants de `notions.json` (ex. `types-de-marche`, `macro-environnement`).
- Exactement **4** propositions, chacune avec un `pourquoi`.
- Plusieurs bonnes réponses ? Ajoute `"multiple": true` (l'étudiant le verra clairement).
- Les apostrophes `'` et guillemets français « » sont autorisés ; les guillemets droits `"` à l'intérieur d'un texte doivent s'écrire `\"`.

Après une modification, lance `npm run check` : le script te dit s'il manque quelque chose (virgule, notion inconnue, identifiant en double…). Sur GitHub, si le site ne se met plus à jour, c'est souvent une virgule oubliée : Vercel affiche l'erreur dans l'onglet **Deployments**.

---

## 5. Organisation du code

```
src/
  data/            → le contenu pédagogique (JSON)
  lib/             → la logique sans écran : répétition espacée (leitner.ts), XP/niveaux/badges
                     (gamification.ts), chemin et étoiles (chemin.ts), contenu des séances (plan.ts),
                     calculs aléatoires (calculs.ts), synchronisation Supabase (sync.ts)
  state/           → l'état partagé : progression, compte, thème et couleur, filtres
  components/      → les morceaux d'interface (navigation, minuteur, cartes, exercices…)
  pages/           → une page par adresse (/, /reviser, /astuces, /profil, /classement…)
supabase/schema.sql → la base de données (tables + sécurité)
tests/             → tests automatiques (npm test)
scripts/           → vérification du contenu (npm run check)
```

**Règles de motivation** (dans `src/lib/gamification.ts`) : flashcard révisée 2 XP · bonne réponse QCM 5 XP · exercice réussi 10 XP · cas pratique terminé 25 XP · étape du chemin terminée +10 XP · séance Tryhard complète jusqu'à +20 XP. Une erreur ne fait jamais perdre d'XP. Un jour compte pour la série dès qu'une séance est terminée (même une étape de 3 minutes) ou après 10 minutes de révision ; un joker par semaine sauve un jour manqué.

**La boutique** (dans `src/lib/boutique.ts`) : les prix des compagnons et des accessoires se changent dans les listes `COMPAGNONS` et `ACCESSOIRES`. Les dessins sont dans `src/components/Compagnon.tsx`. Les décors des mondes sont dans `src/lib/mondes.ts` (positions) et `src/components/DecorMonde.tsx` (dessins). Sur ordinateur, le menu de gauche se masque avec le bouton en haut à droite du menu (plein écran).

**Le chemin** (dans `src/lib/chemin.ts`) : une étape par notion, un bilan par séance et une étape finale « Prêt·e pour le QCM ». Le contenu des séances est préparé dans `src/lib/plan.ts`.

**Répétition espacée** (dans `src/lib/leitner.ts`) : 5 boîtes, J+0 (même séance), J+1, J+3, J+7, J+30. « Je ne savais pas » → boîte 1 ; « Hésitant » → reste dans sa boîte ; « Je savais » → boîte suivante.

**Technique** : React + Vite + TypeScript, Tailwind CSS, React Router, Supabase (facultatif). Aucun logo de marque ni de l'école n'est utilisé : les marques sont citées en texte seulement.
