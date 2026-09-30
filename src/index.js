import { hostname } from 'node:os';
export class GuardError extends Error { constructor(message) { super(message); this.name='GuardError'; } }
const valid=(ok,message)=>{if(!ok)throw new GuardError(message);};
/** Pure evaluation only. Never runs a command or interprets shell text. */
export function evaluate(config, { env=process.env, host=hostname(), override }={}) {
 valid(config && typeof config==='object' && !Array.isArray(config),'Config must be an object');
 valid(config.version===1,'Config version must be 1');
 valid(Array.isArray(config.rules)&&config.rules.length>0&&config.rules.length<=100,'Supply 1-100 rules');
 const matches=[];
 for(const rule of config.rules) {
  valid(rule&&typeof rule==='object'&&!Array.isArray(rule),'Each rule must be an object');
  valid(typeof rule.label==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9 _.-]{0,79}$/.test(rule.label),'Rule label must be 1-80 safe characters');
  const conditions=rule.env;
  const hosts=rule.hosts;
  valid(conditions!==undefined||hosts!==undefined,'Each rule needs env or hosts');
  let match=true;
  if(conditions!==undefined) {
   valid(conditions&&typeof conditions==='object'&&!Array.isArray(conditions),'env must be an object');
   const entries=Object.entries(conditions);
   valid(entries.length>0&&entries.length<=32,'env needs 1-32 entries');
   for(const [key,expected] of entries) {
    valid(/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key),'Invalid environment key');
    valid(typeof expected==='string'&&expected.length>0&&expected.length<=512,'Environment match must be a nonempty string');
    // Missing is unsafe: do not silently permit a command on absent configuration.
    valid(Object.hasOwn(env,key)&&typeof env[key]==='string'&&env[key].length>0,`Required environment key is missing: ${key}`);
    if(env[key]!==expected)match=false;
   }
  }
  if(hosts!==undefined) {
   valid(Array.isArray(hosts)&&hosts.length>0&&hosts.length<=32,'hosts must be 1-32 exact names');
   valid(typeof host==='string'&&host.length>0,'Host is unavailable');
   for(const name of hosts) valid(typeof name==='string'&&/^[a-zA-Z0-9_.-]{1,253}$/.test(name),'Hostnames must be exact safe names, not URLs or patterns');
   if(!hosts.includes(host))match=false;
  }
  if(match)matches.push(rule.label);
 }
 valid(new Set(config.rules.map(r=>r.label)).size===config.rules.length,'Rule labels must be unique');
 const expected=`I UNDERSTAND ${matches.join(', ')}`;
 return {allowed:matches.length===0||override===expected,matchedRules:matches,overrideRequired:matches.length?expected:null,reason:matches.length?(override===expected?'explicit-override':'protected-environment'):'no-protected-rule-matched'};
}
