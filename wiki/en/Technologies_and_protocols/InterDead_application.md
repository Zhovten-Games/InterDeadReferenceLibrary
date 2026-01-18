[^clean]: Clean version: https://interdead.fandom.com/wiki/InterDead_application
[^clean]

== InterDead application ==
An experimental application for communication with the dead.

Main declared tasks:

* establishing one-time/serial contact with arbitrary nodes of the [[Nectosphere|nectosphere]];
* obtaining fragments of their memories via the emoji protocol;
* protecting living users from direct contact with local spirits (stealth mode).

Limitations:

* is not intended for calling a “specific person”;
* works on the principle of statistical resonance (see below).

=== Emoji protocol ===
A supralingual protocol of exchange with the nectosphere based on emoji.

Description:

* a sequence of emoji → is converted into a semantic vector;
* the vector is projected into the nectosphere;
* a cluster with the maximum match in the “cloud of meanings” is selected by it.

Reason for choosing emoji:

* they are not tied to a national language;
* they are well suited to semantic modelling as sets of semantic features.

=== Semantic vector ===
A mathematical representation of the meaning of a message in the form of a point/cloud in a multidimensional space.

Use:

* each combination of emoji → a set of coordinates;
* the search for a [[Nectosphere_node|nectosphere node]] proceeds on the principle of “find the nearest point/cluster”.

=== Statistical resonance ===
A mechanism for establishing communication with the dead.

Essence:

* the application does not address a specific deceased person;
* the algorithm searches for a [[Nectosphere_node|node]] with the maximum match of the semantic profile;
* communication is established with the one whose pattern “best fits” the request.

This explains:

* the impossibility of guaranteed calling the “desired personality”;
* the random nature of contacts.

=== Stealth mode ===
A mode of masking the user's signal in the nectosphere. It is the ''basic and mandatory'' mode for consumer builds of the application.

Technical behaviour:

* the emotional/semantic profile of requests is “fragmented” and smoothed;
* the signal is made to resemble background noise;
* nectosphere routers do not perceive the source as a significant node.

Consequences:

* local spirits do not register the source as an object of interest;
* requests are proxied to remote segments;
* the risk of direct contact with “inhabitants of the place” is reduced.

Legal and regulatory status:

* after a series of incidents and lawsuits, disabling stealth mode in user (consumer) versions of the application is prohibited;
* changing the mode is only possible via internal development/debug mechanisms and is not documented in public user documentation.

=== Exposure mode ===
A mode opposite to stealth mode.

Functions:

* a sharp increase in [[Node_brightness|node brightness]];
* turning it into a “beacon” for nectospheric processes;
* creating conditions for forming a directed channel (for example, the supposed [[Return corridor|return corridor]]) to the corresponding port of a living body or another target interface.

Risks:

* the node becomes noticeable and attractive for other dead;
* the probability of a “chase” and attempts to intercept the channel increases.

Availability:

* the mode is not available in regular user builds;
* enabling it is only possible in developer mode / research configurations:
** through separate diagnostic interfaces;
** with multi-step confirmation and strict legal disclaimers;
* in protocol specifications it is described as experimental and high-risk (see also section [[Theories about the nectosphere and boundary states]]).

=== Residual synchronisation ===
A term denoting a hypothetical temporary two-way link between the configuration of consciousness in the nectosphere and live digital services.

It is considered in detail as a model in the section [[Techno-theories]].

=== Post-mortem interface emulation ===
A concept describing the possible reproduction in the nectosphere of interfaces familiar to a personality.

The theoretical aspects and the supposed mechanism are set out in [[Techno-theories]].

=== AI assistant ===
A digital support and accompaniment system for the user, trained on their data (history of actions, queries, preferences).

Roles within the model:

* in life — a classical assistant/organiser integrated with the InterDead application and/or other services;
* in post-mortem scenarios — is considered a potential core of the digital profile, capable of participating in extended protocols of interaction with the nectosphere (see the section [[Techno-theories]]).

== InterDead application documentation (short technical specification) ==

=== Purpose ===
* Establishing communication with arbitrary nodes of the [[Nectosphere|nectosphere]].
* Obtaining fragments of memories via the emoji protocol.
* Providing basic user safety through stealth mode.

=== Architecture ===
Components:

* '''Client''' (on the user side):
** collection of the emoji request;
** primary semantic processing;
** dialogue interface.

* '''Nectosphere access server''':
** building of the semantic vector;
** search for a resonant cluster in the nectosphere;
** maintaining the communication channel.

* '''Protection module (stealth/exposure)''':
** controlling node brightness;
** masking or exposure in the nectosphere.

If necessary, the architecture can be extended with external AI services via API.

=== Modes of operation ===

==== Standard mode ====
* stealth is active by default;
* in user builds, disabling stealth is not provided;
* single communication sessions;
* node brightness is minimal.

==== Stealth mode (enhanced) ====
* additional suppression of the signal;
* recommended for group trips to “cursed places”;
* all contacts only through remote segments.

==== Exposure mode ====
* used in exceptional scenarios and only in developer / research builds;
* node brightness increases sharply;
* conditions are created for forming directed communication channels if a port is available;
* not available in user builds.

=== Interaction protocol (simplified) ===
# The user forms a request in emoji.
# The client builds a semantic vector and sends it to the server.
# The server searches in the nectosphere for the nearest node by profile (statistical resonance).
# On the node’s side, an obsessive thought / flash of activity arises.
# The response is encoded in the form of images, which the client interprets and displays to the user (usually through new emoji and/or text hints).

=== Limitations ===
* There is no direct addressing by personality (“calling a specific dead person” is impossible).
* A high proportion of noisy and fragmentary responses.
* With long sessions, the risk of mental destabilisation of the user grows (obsessiveness of emoji interpretation).

=== Side effects for the living ===
* obsessive search for the “correct” interpretation of emoji;
* formation of stable illusions of control over post-mortem communication;
* risk of dependence on the application as the only way of experiencing loss.

=== Side effects for the dead ===
* obsessive thoughts and recurring flashes of memories;
* increased fragmentation of personality with constant unsuccessful sessions;
* possible shifting of the node towards mainlines due to increased load.

=== Typical life cycle of a session ===
# Initialisation of the request (emoji → semantic vector).
# Search for a resonant node in the nectosphere.
# Obsessive thought on the side of the dead.
# Response → interpretation → new emoji combination.
# End of the session, decline of activity in the corresponding cluster.

[[Category:Technologies and protocols]]