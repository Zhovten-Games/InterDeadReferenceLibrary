# Research navigation

This directory collects public reference notes and supporting research materials used around the InterDead project.

The structure separates two layers:

* **Core reference notes** — compact materials stored directly in this repository.
* **Side research / supporting studies** — related research outputs published or maintained as separate packages.

## Core reference notes

### Brain Anatomy & Information Flow (Practical Primer)

Short overview of brain anatomy and information processing used as a practical primer for narrative and design references.

* Localizations: [EN](./brain_anatomy/Brain%20Anatomy%20%26%20Information%20Flow%20%28Practical%20Primer%29.md), [RU](./brain_anatomy/%D0%90%D0%BD%D0%B0%D1%82%D0%BE%D0%BC%D0%B8%D1%8F%20%D0%BC%D0%BE%D0%B7%D0%B3%D0%B0%20%D0%B8%20%D0%BF%D1%83%D1%82%D1%8C%20%D0%BE%D0%B1%D1%80%D0%B0%D0%B1%D0%BE%D1%82%D0%BA%D0%B8%20%D0%B8%D0%BD%D1%84%D0%BE%D1%80%D0%BC%D0%B0%D1%86%D0%B8%D0%B8%20%28%D0%BF%D1%80%D0%B0%D0%BA%D1%82%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9%20%D0%BA%D0%BE%D0%BD%D1%81%D0%BF%D0%B5%D0%BA%D1%82%29.md)

### Leibniz (1666) - a glossary of source terms and a brief explanation

Glossary-style reference with concise explanations of source terms related to Leibniz (1666).

* Localizations: [EN](./leibniz_1666_conspect/Leibniz%20%281666%29%20-%20a%20glossary%20of%20source%20terms%20and%20a%20brief%20explanation.md), [RU](./leibniz_1666_conspect/%D0%9B%D0%B5%D0%B9%D0%B1%D0%BD%D0%B8%D1%86%20%281666%29%20-%20%D1%81%D0%BB%D0%BE%D0%B2%D0%B0%D1%80%D1%8C%20%D0%B8%D1%81%D1%85%D0%BE%D0%B4%D0%BD%D1%8B%D1%85%20%D1%82%D0%B5%D1%80%D0%BC%D0%B8%D0%BD%D0%BE%D0%B2%20%D0%B8%20%D0%BA%D1%80%D0%B0%D1%82%D0%BA%D0%BE%D0%B5%20%D0%BF%D0%BE%D1%8F%D1%81%D0%BD%D0%B5%D0%BD%D0%B8%D0%B5.md)

## Side research / supporting studies

These materials are independent research outputs that began from questions raised during the development of InterDead. They reflect the studio’s internal attempt to unpack complex problems discussed during the game’s production: horror, language, communication systems, documentation, and implementation discipline.

Although InterDead is their point of departure, these materials are not direct game documents, story-bible fragments, or implementation requirements. They are self-contained works that can be read and referenced independently from the game.

### Canon Horror Series: Language as Infection and the Systems of Horror v1.2.0

Bilingual archived working-paper package on language, perception, media channels, contagion, environment, biopolitics, and systems of vulnerability in modern horror and science fiction.

* Zenodo archive: [10.5281/zenodo.20647570](https://doi.org/10.5281/zenodo.20647570)
* Source repository: [canon-horror-01](https://github.com/Zhovten-Games/zhovten-games.github.io/tree/main/publications/research/canon-horror-01)
* Build pipeline: [ZG Journal Template](https://github.com/Zhovten-Games/zg-journal-template)

### Literate Programming: Donald Knuth, WEB, and Contemporary Workflows

Methodological review of Donald Knuth’s *Literate Programming* and the WEB system, with contemporary companion examples.

This work follows the language/horror research as a second supporting track. It emerged from the development of our own production pipeline, where the game design document is intended to be structurally connected to the game engine, implementation tasks, validation scenarios, and reproducible artifacts.

The focus therefore shifts from language as a horror medium to language as an engineering discipline: explanation, source structure, traceable implementation, and verifiable workflow.

* Zenodo archive: [10.5281/zenodo.20608559](https://doi.org/10.5281/zenodo.20608559)
* Source repository: [literate-programming](https://github.com/Zhovten-Games/literate-programming)
* Build pipeline: [ZG Journal Template](https://github.com/Zhovten-Games/zg-journal-template)

#### Related methodology: Prompt-Literate Workflow

Prompt-Literate Workflow is a derivative methodology that grew out of the literate-programming review as a boundary case for LLM-assisted development.

It is listed here as a related method, not as a separate InterDead research track.

* Zenodo archive: [10.5281/zenodo.20684079](https://doi.org/10.5281/zenodo.20684079)
* Source repository: [prompt-literate-workflow](https://github.com/IRONCREED/prompt-literate-workflow)
