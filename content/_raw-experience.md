# Raw content — extracted from git HEAD

Real career and education data recovered from the previous scaffold
(`components/sections/experience-section.tsx`, `education-section.tsx` at commit `1ea7f90`).

Parked here as plain markdown so the old scaffold is never needed again. It becomes typed
`Persona` data in **M2** (`content/personas/swe.ts`). Nothing consumes this file yet.

The `_` prefix marks it as raw input, not shipped content.

---

## Identity

- Display name: **Ronaldo Katriel**
- Informal line: *"you can call me Raka Widjaja"*

---

## Experience

**Consumed by `content/experience.ts` since M6.** The four jobs below were rewritten from
résumé voice into portfolio voice there — every fact and number survives (8+ internal apps,
40% faster page loads, a 3-person team, a 22% exam-score lift); the résumé scaffolding does
not, because "aligning delivery with institutional priorities" asserts nothing a reader can
check. This file stays the source of record for what was actually claimed.

The tech list scattered through these entries is consumed by `content/skills.ts`, grouped
into Languages / Frameworks and runtime / Data and infrastructure / Practices.

### Software Engineer & Project Lead
**Yayasan Pendidikan Pelita Harapan — SDH Head Office** · March 2023 – Present

- Defined product roadmaps and led sprint planning for 8+ internal applications, including
  Data Warehouse, Ticketing System, Asset Management, and Digital Asset Management, aligning
  delivery with institutional priorities.
- Prioritized features using the MoSCoW framework, balancing stakeholder urgency with
  engineering capacity to ensure timely, high-impact releases.
- Launched a new ticketing system with complete logging and reporting, replacing manual
  tracking and enabling reliable post-launch evaluation and continuous improvement.

### Software Engineer (Full Stack)
**Yayasan Pendidikan Pelita Harapan — SDH Head Office** · March 2022 – February 2023

- Developed and launched core internal platforms — Online Admission, LMS, and School
  Management System — used by thousands across departments, translating stakeholder
  requirements into scalable web applications using Laravel, Vue, MySQL, CodeIgniter, and
  SQL Server.
- Participated in agile delivery through sprint planning, backlog grooming, and stand-ups,
  while leading weekly feedback loops to gather user insights and drive continuous UX and
  feature improvements.
- Optimized database queries and application performance, resulting in 40% faster page load
  times and improved system responsiveness.

### Project Manager & Backend Intern
**PITOO.COOP** · September 2021 – December 2021

- Defined MVP scope and prioritized core features — authentication, user profiles, and
  real-time multiplayer gameplay — in collaboration with the CTO and CEO.
- Led a 3-person development team using Kanban methodology to deliver milestone-based builds
  and maintain stakeholder alignment throughout the development cycle.
- Coordinated backend development and database schema design, ensuring scalable architecture
  and smooth real-time communication for all players.

### Assistant Professor
**Universitas Pelita Harapan (UPH)** · August 2020 – May 2021

- Taught and mentored students in Calculus and Operating Systems using real-world
  applications and iterative assessment.
- Developed and delivered comprehensive course materials, including lecture slides,
  assignments, and hands-on lab exercises bridging theory and practice.
- Implemented active learning strategies and project-based assessments that increased
  student engagement and improved average exam scores by 22%.

---

## Education

**Consumed by `content/experience.ts` since M6**, as one more entry in the same timeline
rather than its own section — one degree does not earn a landmark.

**Bachelor of Computer Science** — Universitas Pelita Harapan (UPH) · 2018 – 2022

---

## Projects with real screenshots in `public/`

Only these were real work. The rest of the old `lib/data.ts` was v0.dev placeholder fiction
(`example.com` links, invented blockchain/fitness projects) and was discarded.

| Project | Screenshots | Live |
| --- | --- | --- |
| Online Admission SDH | `online_admission_{home,index,form,dashboard,reports}.png` | https://sdh.or.id/registrasi/ |
| Ticketing System | `ticketing_{home,index,ticket,reports,email}.png` | internal |
| Asset / Inventory Management | `inventory_{index,dashboard,assets,forms,reports}.png` | internal |
| Facility Management | `fm_{index,dashboard,assets,summary,reports}.png` | internal |
| Moodle LMS | `moodle_{index,login,course,courses,settings}.png` | internal |
| Evaluation System | `evaluation_{index,evaluation_form,schedules,users,reports}.png` | internal |

Tech logos available: `laravel`, `vuejs`, `reactjs`, `nodejs`, `mysql`, `mongodb`, `redis`,
`docker`, `php`, `codeigniter`, `sql-server`, `android`.

**Consumed by `content/work.ts` since M3.** The screenshot→project mapping in the table above
is now the source of that file's six entries, and the PNGs it names have been deleted from
`public/` — they live in git history at `c35dee3`, and `scripts/prepare-work-images.mjs`
regenerates the WebP output from them. Only `online_admission_*` is cleared for publication
and rendered; the five internal sets render `_placeholder.webp`.

**Still open:** one-line outcome per project (five are `TODO` in `content/work.ts`), and the
decision on which internal apps may be shown publicly. Both are tracked in
`docs/roadmap.md` under "Carried out of M3"; granting publication later is one entry in
`SETS` in the image script plus a re-run.
