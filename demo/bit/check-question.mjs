import {strict as assert} from 'node:assert';
import {classify,questionState} from './bit-question.js';
assert.equal(classify(.99,.9),'yes');assert.equal(classify(.99,.1),'no');
assert.equal(classify(.99,.5),'unknown');assert.equal(classify(.1,.9),'unknown');
for(const value of [NaN,Infinity,-1,1.1])assert.throws(()=>classify(.99,value));
assert.ok(questionState('"'.repeat(10000),'"'.repeat(1000)).length<=4096);
console.log('Noul relevance, uncertainty, invalid probabilities and escaped payload bounds passed');
