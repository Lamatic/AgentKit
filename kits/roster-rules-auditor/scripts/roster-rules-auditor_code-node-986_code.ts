/*! Roster Rules Auditor — deterministic evaluator (Lamatic code node).
 * The two LLM nodes transcribe text into structured shifts and rules; this file
 * performs every calculation and every rule comparison, and re-checks that each
 * value it uses is actually written on the line it came from.
 * Supported predicates: MAX_SHIFT_HOURS, MIN_REST_HOURS, MAX_WEEKLY_HOURS.
 * Emitted minified because Lamatic caps code-node payload size; readable source
 * and the full test suite live with the contribution's documentation.
 */
"use strict";var DAY=1440;var TYPES=["MAX_SHIFT_HOURS","MIN_REST_HOURS","MAX_WEEKLY_HOURS"]
;var TZ=/\b(?:UTC|GMT|IST|PST|PDT|EST|EDT|CST|CDT|BST|CET|CEST|JST|AEST|AEDT)\b|\b(?:UTC|GMT)\s*[+-]\s*\d{1,2}(?::\d{2})?|\d{1,2}:\d{2}\s*Z\b/i
;var QUALIFIER=/\b(?:except|unless|only|if|when|same day|apart from|other than|but not)\b/i;
/** Two-digit zero-padded string. */function p2(v){v=String(v);return v.length<2?"0"+v:v}
/** Days since epoch for an ISO date, or null if not a real calendar date. */function dayNum(iso){
var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso==null?"":iso).trim());if(!m)return null
;var y=+m[1],mo=+m[2],d=+m[3],ms=Date.UTC(y,mo-1,d),b=new Date(ms)
;if(b.getUTCFullYear()!==y||b.getUTCMonth()!==mo-1||b.getUTCDate()!==d)return null;return Math.floor(ms/864e5)
}
/** ISO date string for a day number. */function isoOf(n){var d=new Date(n*864e5)
;return d.getUTCFullYear()+"-"+p2(d.getUTCMonth()+1)+"-"+p2(d.getUTCDate())}
/** Minutes past midnight for an HH:MM time, or null if unparseable. */function mins(t){
var m=/^(\d{1,2}):(\d{2})$/.exec(String(t==null?"":t).trim());if(!m)return null;var h=+m[1],i=+m[2]
;return h>23||i>59?null:h*60+i}
/** HH:MM string for a minutes-past-midnight value. */function hhmm(x){var w=(x%DAY+DAY)%DAY
;return p2(Math.floor(w/60))+":"+p2(w%60)}
/** Day number of the Monday on or before the given day. */function weekOf(n){return n-((n%7+7+4)%7+6)%7}
/** Case-folded, whitespace-collapsed form used to compare names. */function norm(s){
return String(s==null?"":s).trim().replace(/\s+/g," ").toLowerCase()}
/** Escape a string for literal use inside a RegExp. */function esc(x){
return String(x).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}
/** True when the name occurs as a whole word on the line. */function nameOnLine(name,line){var a=norm(name)
;return a?new RegExp("(?:^|[^a-z0-9])"+esc(a)+"(?:[^a-z0-9]|$)").test(norm(line)):false}
/** True when tok sits on the line as a whole token, not inside a longer numeric run. */
function tokenOnLine(tok,lc){var i=lc.indexOf(tok);while(i!==-1){var before=i===0?" ":lc.charAt(i-1)
;var after=i+tok.length>=lc.length?" ":lc.charAt(i+tok.length)
;if(!/[0-9:]/.test(before)&&!/[0-9:]/.test(after))return true;i=lc.indexOf(tok,i+1)}return false}
/** True when the 24-hour time is written on the line as HH:MM, H:MM or a simple am/pm form. */
function timeOnLine(t,line){var m=/^(\d{2}):(\d{2})$/.exec(t);if(!m)return false
;var h=+m[1],mm=m[2],lc=line.toLowerCase();var f=[t];if(h<10)f.push(h+":"+mm)
;var h12=h%12===0?12:h%12,mer=h<12?"am":"pm";f.push(h12+":"+mm+mer);f.push(h12+":"+mm+" "+mer);if(mm==="00"){
f.push(h12+mer);f.push(h12+" "+mer)}for(var k=0;k<f.length;k++)if(tokenOnLine(f[k],lc))return true
;return false}
/** True when the threshold is written in the rule text, in digits. */function numOnLine(v,txt){
return new RegExp("(?:^|[^\\d.])"+String(v).replace(".","\\.")+"(?![\\d.])").test(String(txt==null?"":txt))}
/** Count of bare quantities in the text, ignoring clock times and ISO dates. */function qty(t){
var s=String(t==null?"":t).replace(/\b\d{4}-\d{2}-\d{2}\b/g," ").replace(/\b\d{1,2}:\d{2}\b/g," ")
;var m=s.match(/\b\d+(?:\.\d+)?\b/g);return m?m.length:0}
/** Validate parser-supplied shifts against their source lines; returns accepted and refused sets. */
function readShifts(raw,rosterText){var ok=[],bad=[],n=0,i;
/** Record a refused roster line with its reason. */function no(s,r,d){bad.push({
source_text:s&&s.source_text!=null?String(s.source_text):"",reason:r,detail:d||null})}
for(i=0;i<(raw||[]).length;i++){var s=raw[i],src=s&&s.source_text!=null?String(s.source_text):""
;if(!src||rosterText.indexOf(src)===-1){no(s,"SOURCE_TEXT_NOT_FOUND",null);continue}if(TZ.test(src)){
no(s,"TIMEZONE_NOT_SUPPORTED","times are evaluated as naive wall-clock");continue}
if(!s.person||!s.date||!s.start||!s.end){no(s,"MISSING_FIELD","person/date/start/end required");continue}
if(!nameOnLine(s.person,src)){no(s,"PERSON_NOT_IN_SOURCE",String(s.person));continue}var d=dayNum(s.date)
;if(d===null){no(s,"UNPARSEABLE_DATE",String(s.date));continue}if(!tokenOnLine(isoOf(d),src)){
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
/** Non-blank input lines that no parsed or refused item claimed. */function unclaimed(rosterText,claims){
var want={},i,t;for(i=0;i<claims.length;i++){
t=String(claims[i].source_text==null?"":claims[i].source_text).trim();if(t)want[t]=(want[t]||0)+1}
var lines=rosterText.split("\n"),out=[];for(i=0;i<lines.length;i++){t=lines[i].trim();if(!t)continue
;if(want[t]>0){want[t]--;continue}out.push({line:i+1,text:lines[i]})}return out}
/** Validate parser-supplied rules against the closed predicate set and their source text. */
function readRules(raw,rulesText){var ok=[],bad=[],n=0,i;
/** Record a refused rule with its reason. */function no(r,c,d){bad.push({
source_text:r&&r.source_text!=null?String(r.source_text):"",reason:c,note:r&&r.note||null,detail:d||null})}
for(i=0;i<(raw||[]).length;i++){var r=raw[i],src=r&&r.source_text!=null?String(r.source_text):""
;if(!src||rulesText.indexOf(src)===-1){no(r,"SOURCE_TEXT_NOT_FOUND",null);continue}
var t=r&&r.type!=null?String(r.type):"";if(TYPES.indexOf(t)===-1){no(r,"UNSUPPORTED_RULE_TYPE",t||"(none)")
;continue}if(QUALIFIER.test(src)){no(r,"CONDITIONAL_RULE","qualifier the three predicates cannot express")
;continue}if(qty(src)>1){no(r,"COMPOUND_RULE","more than one quantity; split the rule");continue}
var v=typeof r.value==="number"?r.value:Number(r.value);if(!isFinite(v)||v<=0){
no(r,"NO_THRESHOLD","no usable number");continue}if(!numOnLine(v,src)){
no(r,"NO_THRESHOLD",v+" not in rule text");continue}ok.push({id:"R"+ ++n,type:t,value:v,source_text:src})}
return{ok:ok,bad:bad}}
/** Fields every violation carries, taken from the rule. */function vbase(rule){return{rule_id:rule.id,
type:rule.type,rule_text:rule.source_text,limit:rule.value}}
/** Push a violation built from the rule's shared fields plus the caller's specifics. */
function put(list,rule,extra){var v=vbase(rule);for(var k in extra)v[k]=extra[k];list.push(v)}
/** Evaluate parsed shifts and rules; returns PASS, FAIL or INCOMPLETE with full provenance. */
function audit(input){var rosterText=String(input&&input.roster_text||"")
;var rulesText=String(input&&input.rules_text||"");var p=input&&input.parsed||{}
;var S=readShifts(p.shifts,rosterText),R=readRules(p.rules,rulesText);var i,j,k,q;var badShifts=[],badRules=[]
;for(i=0;i<(p.unparsed_shifts||[]).length;i++){var u=p.unparsed_shifts[i];badShifts.push({
source_text:String(u.source_text||""),reason:String(u.reason||"UNSPECIFIED"),detail:u.detail||null})}
for(i=0;i<S.bad.length;i++)badShifts.push(S.bad[i]);for(i=0;i<(p.unparsed_rules||[]).length;i++){
var q=p.unparsed_rules[i];badRules.push({source_text:String(q.source_text||""),
reason:String(q.reason||"UNSPECIFIED"),note:q.note||null,detail:q.detail||null})}
for(i=0;i<R.bad.length;i++)badRules.push(R.bad[i]);var shifts=S.ok
;var loose=unclaimed(rosterText,shifts.concat(badShifts))
;var looseRules=unclaimed(rulesText,R.ok.concat(badRules));var by={},pmap={},people=[]
;for(i=0;i<shifts.length;i++){var s=shifts[i];if(!by[s.key]){by[s.key]=[];pmap[s.key]={person:s.person,
shifts:0,hours:0};people.push(pmap[s.key])}by[s.key].push(s);pmap[s.key].shifts++;pmap[s.key].hours+=s.hours}
for(k in by)by[k].sort(function(a,b){return a.start_ts-b.start_ts});var findings=[],skip={};for(k in by){
var L=by[k];for(i=0;i<L.length;i++){for(q=i+1;q<L.length&&L[q].start_ts<=L[i].end_ts;q++){
if(L[i].end_ts<=L[q].start_ts)continue;skip[L[i].id+"|"+L[q].id]=1;findings.push({
finding:"OVERLAPPING_SHIFTS",person:L[i].person,shift_ids:[L[i].id,L[q].id],
detail:L[i].label+" overlaps "+L[q].label})}}}var V=[];for(j=0;j<R.ok.length;j++){var rule=R.ok[j]
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
var incomplete=badShifts.length>0||badRules.length>0||loose.length>0||looseRules.length>0||findings.length>0
;return{status:V.length>0?"FAIL":incomplete?"INCOMPLETE":"PASS",incomplete:incomplete,violations:V,
findings:findings,people:people,shifts_parsed:shifts,unparsed_shifts:badShifts,rules_parsed:R.ok,
unparsed_rules:badRules,unclaimed_lines:loose,unclaimed_rule_lines:looseRules,assumptions:{
supported_rules:TYPES,weeks:"Monday start; a shift counts wholly in the week of its start date",
overnight:"a shift belongs to its start date",thresholds:"inclusive; digits only, as written in the rule",
roster_dates:"YYYY-MM-DD, written on the line",timezones:"naive wall-clock; DST not modelled"}}}
/* ---- Lamatic integration ---- */
var rosterRaw = {{LLMNode_260.output}};
var rulesRaw = {{LLMNode_836.output}};
var request = {{triggerNode_1.output}};

/** Decode a parser payload that may be an object, raw JSON, or a fenced block. */
function asJson(v) {
  if (v && typeof v === "object") return v;
  var s = String(v == null ? "" : v).trim();
  if (s.slice(0, 3) === "```") s = s.replace(/^```[a-zA-Z]*\s*/, "").replace(/```\s*$/, "").trim();
  return JSON.parse(s);
}
/** Unwrap a Generate Text node result to its payload. */
function pick(x) { return x && x.generatedResponse != null ? x.generatedResponse : x; }

/* A parser that returns prose, a truncated object, or nothing at all must end as
   INCOMPLETE with a stated reason. A thrown error here would not stop the flow —
   the response node still runs — so it would surface as a broken response body
   rather than an honest refusal. */
/** Parse a node's output, reporting unreadable JSON instead of throwing. */
function readParser(raw) {
  try {
    var v = asJson(pick(raw));
    if (!v || typeof v !== "object") return { ok: false };
    return { ok: true, value: v };
  } catch (e) {
    return { ok: false };
  }
}
var UNREADABLE = "PARSER_OUTPUT_UNREADABLE";

var rosterRead = readParser(rosterRaw), rulesRead = readParser(rulesRaw);
var roster = rosterRead.ok ? rosterRead.value : {};
var rules = rulesRead.ok ? rulesRead.value : {};

var unparsedShifts = roster.unparsed_shifts || [];
if (!rosterRead.ok) {
  unparsedShifts = unparsedShifts.concat([{ source_text: "", reason: UNREADABLE,
    detail: "the roster parser did not return usable JSON" }]);
}
var unparsedRules = rules.unparsed_rules || [];
if (!rulesRead.ok) {
  unparsedRules = unparsedRules.concat([{ source_text: "", reason: UNREADABLE,
    detail: "the rules parser did not return usable JSON" }]);
}

/* The rules parser may emit {predicate, threshold} or {type, value}. Accept both. */
var normRules = (rules.rules || []).map(function (r) {
  return { type: r.type != null ? r.type : r.predicate,
           value: r.value != null ? r.value : r.threshold,
           note: r.note || null, source_text: r.source_text };
});

output = audit({
  roster_text: request.roster_text,
  rules_text: request.rules_text,
  parsed: { shifts: roster.shifts || [], unparsed_shifts: unparsedShifts,
            rules: normRules, unparsed_rules: unparsedRules }
});
