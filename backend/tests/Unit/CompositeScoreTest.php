<?php

use App\Support\CompositeScore;

it('gives full credit to perfect score and zero distance', function () {
    expect(CompositeScore::compute(100, 0, 1.0, 1.0))->toBe(200.0);
});

it('weights distance credit toward closer homes', function () {
    // 0.5/0.5 weights: score 80 → 40; dist 20 → (100-20)*0.5 = 40; total 80
    expect(CompositeScore::compute(80, 20, 0.5, 0.5))->toBe(80.0);
});

it('caps distance credit at 100 km', function () {
    expect(CompositeScore::compute(70, 150, 0.5, 0.5))->toBe(35.0); // 35 + 0
});

it('zero weight ignores that dimension', function () {
    expect(CompositeScore::compute(50, 90, 1.0, 0.0))->toBe(50.0);
});
