# Game design — Emberfall

## Vision
A short, readable exploration loop in a quiet, ruined sanctuary.

## Core loop
Explore → recover three embers → return to the sanctuary → restore the light.

The prototype has one arena and no combat. Movement and collectible rules live in the Rust source. See [exploration rules](../src/lib.rs) and [runtime](../src/main.rs). Do not duplicate tunable gameplay constants in planning records.

## Visual direction
Muted slate architecture, cool teal sanctuary markers, luminous amber collectibles and ivory player marker. See [palette study](../assets/palette.svg). The SVG is a reference, not a loaded Bevy texture.

## Success criteria
A player can understand the goal, recover all fragments, return to the sanctuary, and restart. Playtesting and usability measurement remain planned.
