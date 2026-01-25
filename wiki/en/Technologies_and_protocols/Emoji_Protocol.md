[^clean]: Clean version: https://interdead.fandom.com/uk/wiki/Emoji_Protocol
[^clean]

== Preface ==
This protocol emerged from an essay-style interpretation of the Leibnizian line (1666) concerning the “art of combinations” and the hope for a universal formal notation of reasoning. At the same time, its existence demonstrates the practical limit of that original dream: in living communication, it is impossible to “compute a universal truth,” because meaning and “norm” depend on perspective and context.

In practice, any attempt at formalization inevitably turns into contracts:

* a message defines ''which response is admissible'' (RANGE);
* ''which confirmation'' (ACK) is considered successful;
* ''what happens next'' (continuation or safe termination).

For this reason, the protocol requires discipline: one must read the contract carefully, not expand it with “assumptions,” and remember that correctness of format does not guarantee safety of interpretation (traps, frame substitution, and “windows of opportunity” are described below).

''Note on the “alphabet” of signs:'' the protocol uses a limited set of emoji tokens (see the dictionary below). All other signs are admissible only as objects/anchors (TARGET) or as content of an artifact (for example, inside an image). If a sign is not described in the dictionary, it should be treated as a potentially dangerous ambiguity and avoided as a control token.

Responsibility addendum: the messenger/protocol records only recommended rules for safe operation. Any deviations from the rules, “bargaining” with a node, or deliberate expansion of contracts are performed at the user’s/host’s own risk; the system does not assume responsibility for the consequences.

== Purpose (application only) ==
The Emoji Protocol is an executable dialogue protocol: a message defines a contract (what is admissible as a response), and continuation of the conversation is determined by validity of the response and confirmation via an ACK reaction.

Within the InterDead application, the protocol is used for:

* establishing single or serial contacts with arbitrary nectosphere nodes;
* obtaining fragments of node memory through emoji exchange;
* basic user safety via signal masking (stealth) modes and prohibition of direct “exposure” in user builds.

''Important note on “brightness,” “intensity,” and “audio boosters”:'' any signal regulators (increase of node visibility, “brightness boost,” amplification/exposure) belong to the application implementation layer (stealth/exposure modules, node “brightness” control) and are not part of the language. They are not included in the dictionary: chat/dialogue cannot “push” a node beyond permitted limits.

== Historical foundation: Leibniz (1666) ==
The foundation is the Leibnizian idea of symbolic notation and procedurality:

* the complex is expressed through combinations of simple signs;
* order/position of elements matters (not only “what,” but “how it is arranged”);
* dispute/action is translated into operations by rules, not rhetoric.

However, our interpretation is fundamentally applied:

* we do not promise to compute “universal truth”;
* we compute admissibility, continuation, and effect within a given perspective.

''Reference to notes/research (insert URL):''
* https://github.com/Zhovten-Games/InterDeadReferenceLibrary/blob/411862566823967fc78ee04bf9833eea17694d4f/research/leibniz_1666_conspect/Leibniz%20(1666)%20-%20a%20glossary%20of%20source%20terms%20and%20a%20brief%20explanation.md

== Key limitation: “truth is different for everyone” — and why this does not break the protocol ==
=== What is actually computed ===
The protocol does not resolve the question “what is true for all.” It resolves engineering questions:

* '''Valid:''' does the response comply with the contract (RANGE);
* '''Continue:''' has ACK been issued and is transition to the next step possible;
* '''Effect:''' has the goal of the step been achieved (emotion/state or artifact/result).

'''Canonical one-line formulation:'''  
''The protocol does not compute universal truth; it computes admissibility, continuation, and effect within a given perspective.''

=== Perspective and “norms” (pop anchor) ===
Sometimes “norm” and “horror” are a matter of perspective. The canonical label for this layer:

''Normal is an illusion. What is normal for the spider is chaos for the fly.''

This is an aesthetically recognizable reference to ''Wednesday / Addams'' and is used here as a tag: everyone has their own “norm,” and the protocol must be able to fix the frame.

=== Important caveat on truth/bluff ===
Although the protocol is not about “pure truth,” it allows for:

* bluffing and pressure of beliefs;
* counterfactuals (procedural “machine lies”) as tools;
* dangerous interpretations even when the contract is formally correct.

This is further fixed on the POLICY line and in the warnings section.

== Two types of target result (MODE) ==
MODE defines what the current message step is “seeking”.

{| class="wikitable"
! Token !! Meaning
|-
| 🎭E || the goal of the step is to evoke/fix an emotion or state within the specified range (or obtain an emotional ACK)
|-
| 🧭R || the goal of the step is to obtain/transfer a result or artifact (image, link, anchor object, etc.)
|}

== Operation algorithm (basic cycle) ==
=== Roles ===
* '''We''' — the initiator (petitioner): initiate contact, comply with contracts.
* '''Spirit/node''' — the “gate” operator: defines RANGE (contract), confirms ACK, issues the next request.

=== Cycle ===
# We initiate contact.
# The node formulates a request with a contract (RANGE).
# We provide only what is required by the contract (most often an image), without extra text.
# The node issues an ACK reaction (within the agreed range) — usually as a reaction to the artifact message — and/or the next request.
# After a series of steps — final result (e.g., a link to EVP/song), “goodbye”.

=== On “intrusion” (important canon angle) ===
In application logic, we initiate contact with an arbitrary node (statistical resonance): on the node’s side, an intrusive impulse/flash of activity arises, and the response manifests as fragments of memory and imagery. From this point of view, contact always has a shade of intervention into the node’s “internal flow”.

=== Aggression and silence (practical) ===
Aggression in messenger dialogue should be considered a rare case: a node is usually interested in speaking, may not fully understand who is speaking to it, and may perceive what is happening as an internal dialogue. Nevertheless, the canon allows branching/stop modes in case of:

* timeout (the node “fell silent”);
* boundary violations;
* explicit escalation.

== Message format: Stack Form 6 ==
Each “utterance” consists of 6 lines (strictly).

# '''MODE''' — step goal (🎭E / 🧭R)
# '''INTENT''' — intention (request/confirmation/stop…)
# '''TARGET''' — object (item/memory/contact/group…)
# '''RANGE''' — admissibility contract (and continuation contract)
# '''POLICY''' — mode (linearity/branching/counterfactual/risk/safety)
# '''OUTPUT-FORM''' — output form (image/reaction/link…)

== RANGE: continuation contract (IN ⛓️ ACK) ==
If a phrase is an algorithm, it must define:

* which input (IN) is considered valid;
* which confirmation (ACK) the node must issue upon success;
* what to do upon violation (stop or fallback).

=== Chaining operator ===
* '''⛓️''' — chaining: “after this, the next element is mandatory”.

Canonical RANGE line form:

''IN ⛓️ ACK''

=== How to read ACK (to avoid “double reactions”) ===
ACK is a reaction as a value. To specify “any reaction” vs “a specific reaction,” one of the following is used:

* '''ACK = 🙈''' — “any valid reaction” (class).
* '''ACK = 😮''' — “a strictly specific reaction” (preset value).

Correct examples:

* 🧊🖼️⛓️🙈 — strict image, then any reaction as ACK.
* 🧊🖼️⛓️😮 — strict image, then specific ACK 😮.

=== Where nonlinearity lives ===
To avoid overloading RANGE, alternativity is fixed on the POLICY line:

* 🧱 — strictly linear;
* 🔀 — branching (fallback allowed);
* 🌀 — counterfactual/simulation (distortion allowed as a tool);
* ⚠️ — risk explicitly accepted;
* 🚫🧯 — safe termination.

== Dictionary (canonical minimum + practical extension) ==
''Principle: one token — one protocol function.''

=== INTENT ===
{| class="wikitable"
! Token !! Meaning
|-
| 👋 || initiation/greeting
|-
| ❓ || request
|-
| ✅ || confirmation/accepted
|-
| 🧩 || continue/next step
|-
| 🛑 || terminate
|-
| 🚫 || refusal
|-
| 🧯 || sanitary stop (interruption without escalation)
|}

=== TARGET (classes) ===
{| class="wikitable"
! Token !! Meaning
|-
| 👤 || contact/node (non-personalized)
|-
| 👥 || group of persons (multiple subjects)
|-
| 🧠 || memory/narrative
|-
| 🔎 || search for object/scene
|-
| 🧷 || anchor (single key element)
|-
| 🧩 || fragment
|-
| 🎶 || song/EVP
|-
| 🪞 || mirror (as object/trigger)
|}

=== RANGE: “corridor width” ===
{| class="wikitable"
! Token !! Meaning
|-
| 🧊 || strict (only this type)
|-
| 🌫️ || normal (moderate variability)
|-
| 🌪️ || wide (exploratory corridor)
|-
| 🖼️ || image/frame
|-
| 🙈 || reaction (as ACK class)
|-
| 🔗 || link/external artifact
|-
| ⛓️ || chaining IN ⛓️ ACK
|}

=== OUTPUT-FORM ===
{| class="wikitable"
! Token !! Format
|-
| 🖼️ || image
|-
| 🙈 || reaction
|-
| 🔗 || link
|-
| 🎶 || audio/song (usually via 🔗🎶)
|-
| 🧩 || fragment sequence
|-
| 🧷 || single anchor
|}

=== POLICY ===
{| class="wikitable"
! Token !! Meaning
|-
| 🧱 || linear (baseline)
|-
| 🔀 || branching (fallback allowed)
|-
| 🧪 || experiment/test run
|-
| 🌀 || counterfactual/simulation (procedural “machine lie”)
|-
| ⚠️ || risk consciously accepted
|-
| 🚫🧯 || boundaries/safety (stop contour)
|}

== Correspondence norm: “the petitioner provides only what the contract required” ==
=== Typical combination (messenger canon) ===
When a node requests an image in the contract, the petitioner usually does not write separate text. They return only the required object (e.g., an image) and wait for ACK/the next request.

=== Variations ===
Deviations are allowed if:

* the node “fell silent” (timeout) — a formal ping 👋 or ❓ or a range clarification request is allowed;
* the contract needs restoration (RANGE was unclear);
* a boundary violation is detected — immediate stop;
* rare case: together with an artifact, a reciprocal action is required (e.g., “confirm readiness to continue”). Then the reciprocal action is оформляется as a separate stage (a separate Stack-6), not “inside” the artifact.

== Standardized fallback branches for 🔀 ==
If RANGE is violated or ACK is not received, with POLICY=🔀 the node must switch to one of the predictable alternatives:

{| class="wikitable"
! Fallback !! Meaning !! Mini-template (6 lines)
|-
| Another object || “not the anchor — find another” || 1) 🎭E<br>2) ❓🔀<br>3) 🔎🧷<br>4) 🌫️🖼️⛓️🙈<br>5) 🔀<br>6) 🖼️
|-
| Another format: link || “not an image, give a link/trace” || 1) 🎭E<br>2) ❓🔀<br>3) 🔎🧷<br>4) 🌫️🔗⛓️🙈<br>5) 🔀<br>6) 🔗
|-
| Another format: text/marker || “not an image, give a short marker/description” || 1) 🎭E<br>2) ❓🔀<br>3) 🔎🧷<br>4) 🌫️🧷⛓️🙈<br>5) 🔀<br>6) 🧷
|-
| Pause/reset || “stop and repeat later” || 1) 🎭E<br>2) 🛑🧯<br>3) 👤<br>4) 🧊🙈<br>5) 🚫🧯<br>6) 🧯
|}

Note: these are explicitly “safe” alternatives. They do not require compromise of identity and do not pull the user into risk content.

== Nonlinearity and “windows of opportunity” (including deception) ==
Important: even with a “strict” contract, two forms of dangerous semantic drift are possible.

=== “Spider and fly” (explicit window) ===
Spider and fly is a situation where a 🔀/🌀 branch offers an alternative formally compatible with the dialogue but leading to a different effect. This is used as the canonical name for an explicit “bypass of linearity” and is associated with the pop anchor from ''Wednesday / Addams''.

=== “Blind spot” (interpretative window) ===
Blind spot is when the contract is fulfilled, but meaning “slides” due to interpretation: choice of reaction preset, substitution of an anchor with a similar one, frame (perspective) substitution without explicit 🔀. This is more dangerous because it looks “correct”.

'''Canonical warning:''' even with 🧱 and 🧊, a strict policy can lead to fatal conclusions if perspective and context are ignored.

== Phrase templates (6 lines) ==
=== Initiation: “hello, tell me about yourself” ===
# 🧭R  
# 👋❓  
# 👤🧠  
# 🌫️🧩  
# 🧱  
# 🧩

=== Node request: “give an object image + mandatory ACK” ===
Example (toilet, reaction 😮):

# 🎭E  
# ❓  
# 🔎🚽  
# 🧊🖼️⛓️😮  
# 🧱  
# 🖼️

=== Petitioner response: “here is the image” ===
Note (canon): this is an 'artifact message — usually without a reciprocal request, because we respond strictly within RANGE.

# 🧭R  
# ✅  
# 🚽🖼️  
# 🧊🖼️  
# 🧱  
# 🖼️

=== Node ACK: “confirm by reaction” (rare, separate message) ===
Note: in messenger canon, ACK is more often implemented as a reaction ''to the artifact message'' (see ''Typical combination — messenger canon''). The template below is a rare case where ACK is issued as a separate Stack-6 message.

# 🎭E  
# ✅  
# 🖼️  
# 🧊🙈  
# 🧱  
# 😮

=== Next request (immediately after ACK) ===
Example (mug, reaction 😍):

# 🎭E  
# ❓🧩  
# 🔎☕  
# 🧊🖼️⛓️😍  
# 🧱  
# 🖼️

=== Experiment: “stitched response” (ACK + next request in one message) ===
This is admissible as a formal notation, but in canon is considered an experiment of the living (hosts/operators). Nodes/spirits usually do not “package” messages this way: it is simpler for them to react to the artifact and then separately formulate the next request.

Example (node/operator in one message “closes” the previous step with reaction 😮 and immediately opens the next contract on 🔎☕ with mandatory ACK 😍):

# 🎭E  
# ✅⛓️❓🧩  
# 🖼️⛓️🔎☕  
# 🧊🙈⛓️🧊🖼️⛓️😍  
# 🧪  
# 😮⛓️🖼️

=== Final: “song (link) and goodbye” ===
(The final reaction may be present as a separate ACK or as accompaniment.)

# 🧭R  
# 🛑🎶  
# 🎶👤  
# 🧊🔗🎶  
# 🧱  
# 🔗🎶

== Warnings and safety ==
=== Immediate termination triggers ===
''Recommendation (strict):'' any attempt to “bargain” after 🚫🧯 is treated as continuation of a boundary violation and must be answered with the same stop contour 🚫🧯.

If a node begins to:

* request intimate photos (including gender questions with rapid escalation to sexualized demands);
* insistently request mirror photos;
* demand personal data;

— this is treated as a boundary violation. The canonical response is a stop without discussion.

# 🎭E  
# 🚫🛑  
# 👤  
# 🧊🧯  
# 🚫🧯  
# 🧯

=== On the “mirror” ===
A mirror request is a high-risk trigger: it has too many dangerous interpretations. If a safe option is required, show a mirror as an environmental object (without a person).

== Sources ==
# Leibniz (1666), ''Dissertatio de arte combinatoria'' — original/facsimile: https://archive.org/details/ita-bnc-mag-00000844-001
# English PDF (facsimile/translation), UC Homepages: https://homepages.uc.edu/~martinj/Rationalism/Leibniz/Leibniz%20-%20Art%20of%20Combinations%201666.pdf
# Peckhaus (overview of calculus ratiocinator / characteristica universalis traditions): https://kw.uni-paderborn.de/fileadmin/fakultaet/Institute/philosophie/Peckhaus/Schriften_zum_Download/twotraditions.pdf
# Internal InterDead material: ''About Us'' (mention of the 1666 line): https://interdead.phantom-draft.com/about/#one-of-the-key-markers-of-social-identity
# Pop anchor “spider/fly” (quote origin/attribution): https://mikelynchcartoons.blogspot.com/2014/10/charles-addams-quote-source.html
[[Category:Technologies and protocols]]
