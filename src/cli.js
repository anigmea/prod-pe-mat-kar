#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { evaluate } from './index.js';
const help='prod-pe-mat-kar --config guard.json [--override "I UNDERSTAND label"] [--json]\nEvaluates only. Use before your command with &&. No command execution, hidden retries or inference.\nExit: 0 allowed, 2 protected, 1 invalid/missing config.';
try {
 const args=process.argv.slice(2);let configPath,override,json=false;
 if(args.length===1&&args[0]==='--help')console.log(help);
 else if(args.length===1&&args[0]==='--version')console.log('0.1.0');
 else {
  for(let i=0;i<args.length;i++) {
   const arg=args[i];
   if(arg==='--json'){if(json)throw Error('Duplicate --json');json=true;}
   else if(arg==='--config'||arg==='--override') {
    const value=args[++i];if(!value||value.startsWith('--'))throw Error(`Missing value for ${arg}`);
    if(arg==='--config'){if(configPath)throw Error('Duplicate --config');configPath=value;}
    else {if(override!==undefined)throw Error('Duplicate --override');override=value;}
   } else throw Error(`Unexpected option: ${arg}`);
  }
  if(!configPath)throw Error(help);
  const bytes=readFileSync(configPath);if(bytes.length>65536)throw Error('Config exceeds 64 KiB');
  const result=evaluate(JSON.parse(bytes.toString('utf8')),{override});
  if(json)console.log(JSON.stringify(result));
  else if(result.reason==='protected-environment')console.log(`Bhai, that is production (${result.matchedRules.join(', ')}). Gate blocked.\nReview the target, then supply --override with: ${result.overrideRequired}`);
  else console.log(result.reason==='explicit-override'?'Explicit override accepted. This is not a safety guarantee.':'No configured protected environment matched. This is not a safety guarantee.');
  if(!result.allowed)process.exitCode=2;
 }
} catch(e){console.error(JSON.stringify({allowed:false,error:e.message}));process.exitCode=1;}
