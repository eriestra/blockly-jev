import * as THREE from 'three';
import fs from 'node:fs';
const targets=JSON.parse(fs.readFileSync(new URL('./geometry.json', import.meta.url)));
for(let k=0;k<targets.length;k++){
 const values=targets[k];if(values.length!==targets[0].length||values.some(x=>!Number.isFinite(x)))throw Error('Invalid target');
 const planes=new Set();let inward=0;
 for(let i=0;i<values.length;i+=9){const a=new THREE.Vector3(...values.slice(i,i+3)),b=new THREE.Vector3(...values.slice(i+3,i+6)),c=new THREE.Vector3(...values.slice(i+6,i+9));const n=b.clone().sub(a).cross(c.clone().sub(a)).normalize();if(n.dot(a)<-1e-6)inward++;planes.add([...n.toArray(),n.dot(a)].map(n=>Math.round(n*1000)).join(','))}
 console.log({target:['shallow stellated dodecahedron','icosahedron','octahedron','stellated dodecahedron'][k],triangles:values.length/9,planes:planes.size,inward});if(inward)throw Error('Inverted faces');
 if(k===2&&planes.size!==8)throw Error('Octahedron must have exactly eight planes');
}
