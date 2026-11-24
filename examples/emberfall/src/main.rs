//! Emberfall: a minimal exploration loop for exercising Prism's repository adapter.
use bevy::prelude::*;
use emberfall::{advance, Progress, FRAGMENTS, SANCTUARY};

#[derive(Component)]
struct Player;

#[derive(Component)]
struct Fragment(usize);

#[derive(Resource, Default)]
struct Run(Progress);

struct ExplorationPlugin;

impl Plugin for ExplorationPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<Run>()
            .add_systems(Startup, setup)
            .add_systems(Update, (reset, movement, collect, update_title).chain());
    }
}

fn main() {
    App::new()
        .insert_resource(ClearColor(Color::srgb(0.055, 0.075, 0.09)))
        .add_plugins(DefaultPlugins.set(WindowPlugin {
            primary_window: Some(Window {
                title: "Emberfall".into(),
                resolution: (960., 640.).into(),
                ..default()
            }),
            ..default()
        }))
        .add_plugins(ExplorationPlugin)
        .run();
}

fn setup(mut commands: Commands) {
    commands.spawn(Camera2d);
    commands.spawn((
        Sprite::from_color(Color::srgb(0.17, 0.24, 0.27), Vec2::new(760., 480.)),
        Transform::from_xyz(0., 0., -2.),
    ));
    for x in -3..=3 {
        for y in -2..=2 {
            commands.spawn((
                Sprite::from_color(Color::srgb(0.20, 0.28, 0.30), Vec2::splat(3.)),
                Transform::from_xyz(x as f32 * 100., y as f32 * 100., -1.),
            ));
        }
    }
    commands.spawn((
        Sprite::from_color(Color::srgb(0.28, 0.72, 0.64), Vec2::splat(64.)),
        Transform::from_xyz(SANCTUARY.x, SANCTUARY.y, 0.),
    ));
    commands.spawn((
        Player,
        Sprite::from_color(Color::srgb(0.88, 0.93, 0.92), Vec2::splat(22.)),
        Transform::from_xyz(SANCTUARY.x, SANCTUARY.y, 2.),
    ));
    for (i, position) in FRAGMENTS.iter().enumerate() {
        commands.spawn((
            Fragment(i),
            Sprite::from_color(Color::srgb(0.99, 0.64, 0.25), Vec2::splat(21.)),
            Transform::from_xyz(position.x, position.y, 1.)
                .with_rotation(Quat::from_rotation_z(std::f32::consts::FRAC_PI_4)),
        ));
    }
}

fn reset(
    keyboard: Res<ButtonInput<KeyCode>>,
    mut run: ResMut<Run>,
    mut player: Query<&mut Transform, With<Player>>,
    mut fragments: Query<&mut Visibility, With<Fragment>>,
) {
    if !keyboard.just_pressed(KeyCode::KeyR) { return; }
    run.0 = Progress::default();
    for mut transform in &mut player {
        transform.translation = SANCTUARY.extend(2.);
    }
    for mut visibility in &mut fragments { *visibility = Visibility::Visible; }
}

fn movement(
    keyboard: Res<ButtonInput<KeyCode>>,
    time: Res<Time>,
    run: Res<Run>,
    mut player: Query<&mut Transform, With<Player>>,
) {
    if run.0.complete { return; }
    let mut axis = Vec2::ZERO;
    if keyboard.pressed(KeyCode::KeyW) || keyboard.pressed(KeyCode::ArrowUp) { axis.y += 1.; }
    if keyboard.pressed(KeyCode::KeyS) || keyboard.pressed(KeyCode::ArrowDown) { axis.y -= 1.; }
    if keyboard.pressed(KeyCode::KeyA) || keyboard.pressed(KeyCode::ArrowLeft) { axis.x -= 1.; }
    if keyboard.pressed(KeyCode::KeyD) || keyboard.pressed(KeyCode::ArrowRight) { axis.x += 1.; }
    for mut transform in &mut player {
        let position = transform.translation.truncate() + axis.normalize_or_zero() * 230. * time.delta_secs();
        transform.translation = position.clamp(Vec2::new(-365., -225.), Vec2::new(365., 225.)).extend(2.);
    }
}

fn collect(
    player: Query<&Transform, With<Player>>,
    mut run: ResMut<Run>,
    mut fragments: Query<(&Fragment, &mut Visibility)>,
) {
    let Some(transform) = player.iter().next() else { return; };
    advance(&mut run.0, transform.translation.truncate());
    for (fragment, mut visibility) in &mut fragments {
        *visibility = if run.0.collected[fragment.0] { Visibility::Hidden } else { Visibility::Visible };
    }
}

fn update_title(run: Res<Run>, mut windows: Query<&mut Window>) {
    for mut window in &mut windows {
        window.title = if run.0.complete {
            "Emberfall | Sanctuary restored | R to restart".into()
        } else {
            format!("Emberfall | {}/3 embers | Return to sanctuary | WASD / R", run.0.count())
        };
    }
}
