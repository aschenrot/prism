use emberfall::{advance, Progress, FRAGMENTS, SANCTUARY};

#[test]
fn sanctuary_requires_all_fragments() {
    let mut run = Progress::default();
    advance(&mut run, SANCTUARY);
    assert!(!run.complete);
    for point in FRAGMENTS { advance(&mut run, point); }
    assert_eq!(run.count(), 3);
    assert!(!run.complete);
    advance(&mut run, SANCTUARY);
    assert!(run.complete);
}

#[test]
fn fragments_cannot_be_counted_twice() {
    let mut run = Progress::default();
    advance(&mut run, FRAGMENTS[0]);
    advance(&mut run, FRAGMENTS[0]);
    assert_eq!(run.count(), 1);
}
