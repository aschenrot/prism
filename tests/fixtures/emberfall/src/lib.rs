//! Shared, deterministic exploration rules.
use bevy::prelude::Vec2;

/// World coordinates of the sanctuary.
pub const SANCTUARY: Vec2 = Vec2::new(0., -185.);
/// World coordinates of the three collectible fragments.
pub const FRAGMENTS: [Vec2; 3] = [
    Vec2::new(-270., 140.),
    Vec2::new(250., 160.),
    Vec2::new(120., -40.),
];

/// Canonical state for a single exploration run.
#[derive(Default, Debug, Clone, PartialEq, Eq)]
pub struct Progress {
    pub collected: [bool; 3],
    pub complete: bool,
}

impl Progress {
    pub fn count(&self) -> usize {
        self.collected.iter().filter(|&&collected| collected).count()
    }
}

/// Collect nearby fragments and finish only after returning with every fragment.
pub fn advance(progress: &mut Progress, position: Vec2) {
    if progress.complete { return; }
    for (i, fragment) in FRAGMENTS.iter().enumerate() {
        if position.distance(*fragment) <= 25. {
            progress.collected[i] = true;
        }
    }
    if progress.count() == FRAGMENTS.len() && position.distance(SANCTUARY) <= 32. {
        progress.complete = true;
    }
}
