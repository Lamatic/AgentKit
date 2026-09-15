"use strict";var DAY=1440;var TYPES=["MAX_SHIFT_HOURS","MIN_REST_HOURS","MAX_WEEKLY_HOURS"]
;var QUALIFIER=/\b(?:except|unless|only|if|when|same day|apart from|other than|but not)\b/i;function p2(v){
v=String(v);return v.length<2?"0"+v:v}function dayNum(iso){
var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso==null?"":iso).trim());if(!m)return null
;var y=+m[1],mo=+m[2],d=+m[3],ms=Date.UTC(y,mo-1,d),b=new Date(ms)
;if(b.getUTCFullYear()!==y||b.getUTCMonth()!==mo-1||b.getUTCDate()!==d)return null;return Math.floor(ms/864e5)
}function isoOf(n){var d=new Date(n*864e5)
;return d.getUTCFullYear()+"-"+p2(d.getUTCMonth()+1)+"-"+p2(d.getUTCDate())}function mins(t){
var m=/^(\d{1,2}):(\d{2})$/.exec(String(t==null?"":t).trim());if(!m)return null;var h=+m[1],i=+m[2]
;return h>23||i>59?null:h*60+i}function hhmm(x){var w=(x%DAY+DAY)%DAY;return p2(Math.floor(w/60))+":"+p2(w%60)
}function weekOf(n){return n-((n%7+7+4)%7+6)%7}function norm(s){
return String(s==null?"":s).trim().replace(/\s+/g," ").toLowerCase()}function esc(x){
return String(x).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function nameOnLine(name,line){var a=norm(name)
;return a?new RegExp("(?:^|[^a-z0-9])"+esc(a)+"(?:[^a-z0-9]|$)").test(norm(line)):false}
function timeOnLine(t,line){if(line.indexOf(t)!==-1)return true;var m=/^(\d{2}):(\d{2})$/.exec(t)
;if(!m)return false;var h=+m[1],mm=m[2],h12=h%12===0?12:h%12,mer=h<12?"am":"pm"
;var lc=line.toLowerCase(),f=[h12+":"+mm+mer,h12+":"+mm+" "+mer];if(mm==="00"){f.push(h12+mer)
;f.push(h12+" "+mer)}for(var k=0;k<f.length;k++)if(lc.indexOf(f[k])!==-1)return true;return false}
function numOnLine(v,txt){
return new RegExp("(?:^|[^\\d.])"+String(v).replace(".","\\.")+"(?![\\d.])").test(String(txt==null?"":txt))}
function qty(t){
var s=String(t==null?"":t).replace(/\b\d{4}-\d{2}-\d{2}\b/g," ").replace(/\b\d{1,2}:\d{2}\b/g," ")
;var m=s.match(/\b\d+(?:\.\d+)?\b/g);return m?m.length:0}function readShifts(raw,rosterText){
var ok=[],bad=[],n=0,i;function no(s,r,d){bad.push({
source_text:s&&s.source_text!=null?String(s.source_text):"",reason:r,detail:d||null})}
for(i=0;i<(raw||[]).length;i++){var s=raw[i],src=s&&s.source_text!=null?String(s.source_text):""
;if(!src||rosterText.indexOf(src)===-1){no(s,"SOURCE_TEXT_NOT_FOUND",null);continue}
if(!s.person||!s.date||!s.start||!s.end){no(s,"MISSING_FIELD","person/date/start/end required");continue}
if(!nameOnLine(s.person,src)){no(s,"PERSON_NOT_IN_SOURCE",String(s.person));continue}var d=dayNum(s.date)
;if(d===null){no(s,"UNPARSEABLE_DATE",String(s.date));continue}if(src.indexOf(isoOf(d))===-1){
no(s,"DATE_NOT_IN_SOURCE",isoOf(d));continue}var a=mins(s.start),b=mins(s.end);if(a===null||b===null){
no(s,"UNPARSEABLE_TIME",String(s.start)+" / "+String(s.end));continue}
if(!timeOnLine(hhmm(a),src)||!timeOnLine(hhmm(b),src)){
no(s,"TIME_NOT_IN_SOURCE",String(s.start)+"/"+String(s.end));continue}var ed=b<=a?d+1:d;if(s.end_date){
var e2=dayNum(s.end_date);if(e2===null){no(s,"UNPARSEABLE_DATE",String(s.end_date));continue}
if(e2!==d&&e2!==d+1){no(s,"SHIFT_TOO_LONG","end_date must be the start date or the next day");continue}ed=e2}
var st=d*DAY+a,en=ed*DAY+b,hrs=(en-st)/60;if(hrs===0){no(s,"ZERO_LENGTH_SHIFT",null);continue}
if(hrs<0||hrs>24){no(s,"SHIFT_TOO_LONG",hrs+"h");continue}ok.push({id:"S"+ ++n,
person:String(s.person).trim().replace(/\s+/g," "),key:norm(s.person),date:isoOf(d),day:d,start_ts:st,
end_ts:en,hours:hrs,label:isoOf(d)+" "+hhmm(a)+"-"+hhmm(b),source_text:src})}return{ok:ok,bad:bad}}
function unclaimed(rosterText,claims){var want={},i,t;for(i=0;i<claims.length;i++){
t=String(claims[i].source_text==null?"":claims[i].source_text).trim();if(t)want[t]=(want[t]||0)+1}
var lines=rosterText.split("\n"),out=[];for(i=0;i<lines.length;i++){t=lines[i].trim();if(!t)continue
;if(want[t]>0){want[t]--;continue}out.push({line:i+1,text:lines[i]})}return out}
function readRules(raw,rulesText){var ok=[],bad=[],n=0,i;function no(r,c,d){bad.push({
source_text:r&&r.source_text!=null?String(r.source_text):"",reason:c,note:r&&r.note||null,detail:d||null})}
for(i=0;i<(raw||[]).length;i++){var r=raw[i],src=r&&r.source_text!=null?String(r.source_text):""
;if(!src||rulesText.indexOf(src)===-1){no(r,"SOURCE_TEXT_NOT_FOUND",null);continue}
var t=r&&r.type!=null?String(r.type):"";if(TYPES.indexOf(t)===-1){no(r,"UNSUPPORTED_RULE_TYPE",t||"(none)")
;continue}if(QUALIFIER.test(src)){no(r,"CONDITIONAL_RULE","qualifier the three predicates cannot express")
;continue}if(qty(src)>1){no(r,"COMPOUND_RULE","more than one quantity; split the rule");continue}
var v=typeof r.value==="number"?r.value:Number(r.value);if(!isFinite(v)||v<=0){
no(r,"NO_THRESHOLD","no usable number");continue}if(!numOnLine(v,src)){
no(r,"NO_THRESHOLD",v+" not in rule text");continue}ok.push({id:"R"+ ++n,type:t,value:v,source_text:src})}
return{ok:ok,bad:bad}}function vbase(rule){return{rule_id:rule.id,type:rule.type,rule_text:rule.source_text,
limit:rule.value}}function put(list,rule,extra){var v=vbase(rule);for(var k in extra)v[k]=extra[k]
;list.push(v)}function audit(input){var rosterText=String(input&&input.roster_text||"")
;var rulesText=String(input&&input.rules_text||"");var p=input&&input.parsed||{}
;var S=readShifts(p.shifts,rosterText),R=readRules(p.rules,rulesText);var i,j,k;var badShifts=[],badRules=[]
;for(i=0;i<(p.unparsed_shifts||[]).length;i++){var u=p.unparsed_shifts[i];badShifts.push({
source_text:String(u.source_text||""),reason:String(u.reason||"UNSPECIFIED"),detail:u.detail||null})}
for(i=0;i<S.bad.length;i++)badShifts.push(S.bad[i]);for(i=0;i<(p.unparsed_rules||[]).length;i++){
var q=p.unparsed_rules[i];badRules.push({source_text:String(q.source_text||""),
reason:String(q.reason||"UNSPECIFIED"),note:q.note||null,detail:q.detail||null})}
for(i=0;i<R.bad.length;i++)badRules.push(R.bad[i]);var shifts=S.ok
;var loose=unclaimed(rosterText,shifts.concat(badShifts));var by={},pmap={},people=[]
;for(i=0;i<shifts.length;i++){var s=shifts[i];if(!by[s.key]){by[s.key]=[];pmap[s.key]={person:s.person,
shifts:0,hours:0};people.push(pmap[s.key])}by[s.key].push(s);pmap[s.key].shifts++;pmap[s.key].hours+=s.hours}
for(k in by)by[k].sort(function(a,b){return a.start_ts-b.start_ts});var findings=[],skip={};for(k in by){
var L=by[k];for(i=0;i+1<L.length;i++)if(L[i].end_ts>L[i+1].start_ts){skip[L[i].id+"|"+L[i+1].id]=1
;findings.push({finding:"OVERLAPPING_SHIFTS",person:L[i].person,shift_ids:[L[i].id,L[i+1].id],
detail:L[i].label+" overlaps "+L[i+1].label})}}var V=[];for(j=0;j<R.ok.length;j++){var rule=R.ok[j]
;if(rule.type==="MAX_SHIFT_HOURS"){for(i=0;i<shifts.length;i++)if(shifts[i].hours>rule.value)put(V,rule,{
person:shifts[i].person,shift_ids:[shifts[i].id],actual_hours:shifts[i].hours,
excess_hours:shifts[i].hours-rule.value,detail:shifts[i].label+" is "+shifts[i].hours+"h"})
}else if(rule.type==="MIN_REST_HOURS"){for(k in by){var A=by[k];for(i=0;i+1<A.length;i++){
if(skip[A[i].id+"|"+A[i+1].id])continue;var rest=(A[i+1].start_ts-A[i].end_ts)/60
;if(rest<rule.value)put(V,rule,{person:A[i].person,shift_ids:[A[i].id,A[i+1].id],actual_rest_hours:rest,
shortfall_hours:rule.value-rest,detail:A[i].label+" then "+A[i+1].label+" leaves "+rest+"h rest"})}}}else{
for(k in by){var B=by[k],wk={},w;for(i=0;i<B.length;i++){w=weekOf(B[i].day);if(!wk[w])wk[w]={h:0,ids:[]}
;wk[w].h+=B[i].hours;wk[w].ids.push(B[i].id)}for(w in wk)if(wk[w].h>rule.value)put(V,rule,{person:B[0].person,
week_start:isoOf(+w),shift_ids:wk[w].ids,actual_hours:wk[w].h,excess_hours:wk[w].h-rule.value,
detail:wk[w].h+"h in the week of "+isoOf(+w)})}}}
var incomplete=badShifts.length>0||badRules.length>0||loose.length>0||findings.length>0;return{
status:V.length>0?"FAIL":incomplete?"INCOMPLETE":"PASS",incomplete:incomplete,violations:V,findings:findings,
people:people,shifts_parsed:shifts,unparsed_shifts:badShifts,rules_parsed:R.ok,unparsed_rules:badRules,
unclaimed_lines:loose,assumptions:{supported_rules:TYPES,
weeks:"Monday start; a shift counts wholly in the week of its start date",
overnight:"a shift belongs to its start date",thresholds:"inclusive; digits only, as written in the rule",
roster_dates:"YYYY-MM-DD, written on the line",timezones:"naive wall-clock; DST not modelled"}}}
/* ---- Lamatic integration ---- */
var rosterRaw = {{LLMNode_260.output}};
var rulesRaw = {{LLMNode_836.output}};
var request = {{triggerNode_1.output}};

/* Generate Text returns a string; tolerate an object and a fenced block so a
   formatting quirk cannot look like an evaluator bug. */
function asJson(v) {
  if (v && typeof v === "object") return v;
  var s = String(v == null ? "" : v).trim();
  if (s.slice(0, 3) === "```") s = s.replace(/^```[a-zA-Z]*\s*/, "").replace(/```\s*$/, "").trim();
  return JSON.parse(s);
}
function pick(x) { return x && x.generatedResponse != null ? x.generatedResponse : x; }

var roster = asJson(pick(rosterRaw)), rules = asJson(pick(rulesRaw));

/* The rules parser may emit {predicate, threshold} or {type, value}. Accept both. */
var normRules = (rules.rules || []).map(function (r) {
  return { type: r.type != null ? r.type : r.predicate,
           value: r.value != null ? r.value : r.threshold,
           note: r.note || null, source_text: r.source_text };
});

output = audit({
  roster_text: request.roster_text,
  rules_text: request.rules_text,
  parsed: { shifts: roster.shifts || [], unparsed_shifts: roster.unparsed_shifts || [],
            rules: normRules, unparsed_rules: rules.unparsed_rules || [] }
});
