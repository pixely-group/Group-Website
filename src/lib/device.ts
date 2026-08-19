/**
 * The device's hardware dimensions, in logical points, so the screen inside is
 * laid out at exactly the size a designer would work at.
 *
 * Shared rather than local to HeroDevice because the travelling wrapper needs
 * the aspect ratio too: it holds the device in an out-of-flow child, so it has
 * nothing to take its own width from and must be told.
 */
export const SCREEN_W = 402;
export const SCREEN_H = 874;
export const BEZEL = 9;
export const BODY_W = SCREEN_W + BEZEL * 2;
export const BODY_H = SCREEN_H + BEZEL * 2;
export const DEVICE_ASPECT = `${BODY_W} / ${BODY_H}`;
