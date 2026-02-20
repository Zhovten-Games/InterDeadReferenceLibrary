# InterDead reproducible canon pipeline

This document defines the sequence of working with “why” as a contract of the canon and links it to the current mechanism of wiki export, localization, and repository fixation.

---

## Principle

* The canon changes only through causality.
* Causality is fixed in theory.
* Theory is updated before scaling.

The wiki acts not as a storage of pages, but as a mechanism for canon governance.

---

## 1) Discussion of “why” (the theoretical layer)

Any change begins with the formulation of:

* why the entity exists,
* what it explains,
* which sections of theory it affects,
* what systemic consequences it creates.

The discussion takes place in the issue of the corresponding repository or in a service channel with explicit fixation of the “why” formulation.

Until causality is confirmed, changes are not introduced into the canon.

The section is regularly updated:

**Theories / Теории / Теорії / 理論**

---

## 2) Updating the theory section

After formulating the “why,” the theoretical base is adjusted:

* models are refined,
* new causal links are fixed,
* anchors are added if necessary (protocols, entities, mechanics).

### Example: NIRO

The introduction of the system voice in the form of NIRO required updates to:

* [https://interdead.fandom.com/wiki/Techno-theories#Residual_synchronisation](https://interdead.fandom.com/wiki/Techno-theories#Residual_synchronisation)
* [https://interdead.fandom.com/wiki/Techno-theories#Case:_Niro_/_Incident_NERO-01](https://interdead.fandom.com/wiki/Techno-theories#Case:_Niro_/_Incident_NERO-01)

This became a theoretical fixation of partial confirmation of the residual synchronisation model.

---

## 3) Agreement

Before moving to edits, the following is fixed:

1. The list of affected pages.
2. Verification of causal consistency.
3. The necessity of updating related entities.

After agreement, the change is considered accepted.

---

## 4) Updating EN (SSOT) inside the repository

Work takes place inside the repository:
[https://github.com/Zhovten-Games/InterDeadReferenceLibrary/tree/main/wiki](https://github.com/Zhovten-Games/InterDeadReferenceLibrary/tree/main/wiki)

* [https://github.com/Zhovten-Games/InterDeadReferenceLibrary/tree/main/wiki/en](https://github.com/Zhovten-Games/InterDeadReferenceLibrary/tree/main/wiki/en) — The English version is primary (SSOT).

At the current stage, a manual mode is used:

* EN pages are updated,
* related sections are synchronized,
* consistency with theory is verified.

Automatic assembly is not used due to redundancy at the current scale and the risks of uncontrolled changes.

---

## 5) Translation requests (inside the repository)

After updating EN:

* translation tasks are formed,

* localizations (ru / uk / ja) are updated,

* derivation from EN is maintained.

* [https://github.com/Zhovten-Games/InterDeadReferenceLibrary/tree/main/wiki/ru](https://github.com/Zhovten-Games/InterDeadReferenceLibrary/tree/main/wiki/ru)

* [https://github.com/Zhovten-Games/InterDeadReferenceLibrary/tree/main/wiki/uk](https://github.com/Zhovten-Games/InterDeadReferenceLibrary/tree/main/wiki/uk)

* [https://github.com/Zhovten-Games/InterDeadReferenceLibrary/tree/main/wiki/ja](https://github.com/Zhovten-Games/InterDeadReferenceLibrary/tree/main/wiki/ja)

Localizations are not autonomous versions.

---

## 6) Editorial review

An editorial review of all versions inside the repository is conducted:
[https://github.com/Zhovten-Games/InterDeadReferenceLibrary/tree/main/wiki](https://github.com/Zhovten-Games/InterDeadReferenceLibrary/tree/main/wiki)

* compliance with the “why,”
* absence of semantic discrepancies,
* correctness of terminology.

---

## 7) Updating mirrors on Fandom

After internal fixation:

* edits are applied on Fandom,
* versions are brought to the current state.

Current localizations:

* EN — [https://interdead.fandom.com/wiki/InterDead_Wiki](https://interdead.fandom.com/wiki/InterDead_Wiki)
* RU — [https://interdead.fandom.com/ru/wiki/Interdead_Вики](https://interdead.fandom.com/ru/wiki/Interdead_Вики)
* UK — [https://interdead.fandom.com/uk/wiki/Main_Page](https://interdead.fandom.com/uk/wiki/Main_Page)
* JA — [https://interdead.fandom.com/ja/wiki/InterDead_Wiki](https://interdead.fandom.com/ja/wiki/InterDead_Wiki)

---

## Full sequence (strict order)

1. Discussion of “why” → fixation of the formulation
2. Updating the theory section
3. Agreement
4. Updating EN (SSOT) inside the repository
5. Translation requests (inside the repository)
6. Editorial review of all versions
7. Updating mirrors on Fandom

---

## Export templates

Export is used to actualize the state of the wiki inside the repository, but overusing this tool is not the correct decision. In theory, after the first export, there should be no further necessity for it (however, we are all human, so it is preserved).

---

### EN

Page:
[https://interdead.fandom.com/wiki/Special:Export](https://interdead.fandom.com/wiki/Special:Export)

Pages outside categories:
InterDead_Wiki

Categories:

* Meta-universe
* Natural phenomena and structures
* Technogenic phenomena and incidents
* Technologies and protocols
* Theories and models

---

### RU

Page:
[https://interdead.fandom.com/ru/wiki/Служебная:Экспорт](https://interdead.fandom.com/ru/wiki/Служебная:Экспорт)

Pages outside categories:
Interdead_Вики

Categories:

* Мета-вселенная
* Естественные явления и структуры
* Техногенные явления и инциденты
* Технологии и протоколы
* Теории и модели

---

### UK

Page:
[https://interdead.fandom.com/uk/wiki/Спеціальна:Експорт](https://interdead.fandom.com/uk/wiki/Спеціальна:Експорт)

Pages outside categories:
Main_Page

Categories:

* Мета-всесвіт
* Природні феномени та структури
* Техногенні феномени та інциденти
* Технології та протоколи
* Теорії та моделі

---

### JA

Page:
[https://interdead.fandom.com/ja/wiki/特別:データ書き出し](https://interdead.fandom.com/ja/wiki/特別:データ書き出し)

Pages outside categories:
InterDead_Wiki

Categories:

* InterDead ユニバース
* 自然現象と構造
* 技術的現象とインシデント
* 技術とプロトコル
* 理論とモデル

---

After export, the data passes through the build:

[https://github.com/Zhovten-Games/InterDeadReferenceLibrary/tree/main/tools/python/wiki_export_to_md_zip](https://github.com/Zhovten-Games/InterDeadReferenceLibrary/tree/main/tools/python/wiki_export_to_md_zip)
