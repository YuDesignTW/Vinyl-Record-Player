// A pocket and its disc rotate rigidly around the same inner-paper hinge.
export function gatefoldPosition(angle, extraction = 0) {
 const reach = 2.75 + extraction * 3.9, hinge = .125;
 return { x: -reach * Math.cos(angle) - hinge * Math.sin(angle), z: hinge + reach * Math.sin(angle) - hinge * Math.cos(angle) };
}
