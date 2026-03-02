import { useState, useEffect, useRef } from "react";

// ── THEMES ──────────────────────────────────────────────────────
const DARK = {
  bg:"#07071A", surface:"#0C0C24", card:"#10102C", cardBorder:"#1C1C42",
  nav:"#09091E", navBorder:"#161636",
  text:"#EAE4FF", textMuted:"#6A6890", textDim:"#252550",
  gold:"#C8A84B", goldBright:"#E0BC6A", goldGlow:"rgba(200,168,75,0.12)", goldBorder:"rgba(200,168,75,0.28)",
  purple:"#7B3FE4", purpleBright:"#9B6FF0", purpleGlow:"rgba(123,63,228,0.15)", purpleBorder:"rgba(123,63,228,0.32)",
  red:"#EF4444", redGlow:"rgba(239,68,68,0.13)", redBorder:"rgba(239,68,68,0.32)",
  green:"#10B981", greenGlow:"rgba(16,185,129,0.12)", greenBorder:"rgba(16,185,129,0.3)",
  blue:"#3B82F6", blueGlow:"rgba(59,130,246,0.12)", blueBorder:"rgba(59,130,246,0.3)",
  orange:"#F59E0B", orangeGlow:"rgba(245,158,11,0.12)", orangeBorder:"rgba(245,158,11,0.3)",
  inputBg:"#080818", inputBorder:"#1C1C3C",
  divider:"#13132A", scrollbar:"#1C1C42", gridLine:"rgba(123,63,228,0.04)",
  mode:"dark"
};
const LIGHT = {
  bg:"#EEE8F8", surface:"#FAFAFF", card:"#FFFFFF", cardBorder:"#DDD4F2",
  nav:"#FFFFFF", navBorder:"#DDD4F2",
  text:"#16083A", textMuted:"#675880", textDim:"#C4B8DA",
  gold:"#886000", goldBright:"#AA7A00", goldGlow:"rgba(136,96,0,0.09)", goldBorder:"rgba(136,96,0,0.22)",
  purple:"#6D28D9", purpleBright:"#7C3AED", purpleGlow:"rgba(109,40,217,0.09)", purpleBorder:"rgba(109,40,217,0.26)",
  red:"#DC2626", redGlow:"rgba(220,38,38,0.09)", redBorder:"rgba(220,38,38,0.26)",
  green:"#059669", greenGlow:"rgba(5,150,105,0.09)", greenBorder:"rgba(5,150,105,0.26)",
  blue:"#2563EB", blueGlow:"rgba(37,99,235,0.09)", blueBorder:"rgba(37,99,235,0.26)",
  orange:"#D97706", orangeGlow:"rgba(217,119,6,0.09)", orangeBorder:"rgba(217,119,6,0.28)",
  inputBg:"#F3EFFE", inputBorder:"#DAD0F0",
  divider:"#EAE0F5", scrollbar:"#DAD0F0", gridLine:"rgba(109,40,217,0.03)",
  mode:"light"
};

// ── DATA ────────────────────────────────────────────────────────
const INFLUENCERS = [
  {id:"i1",name:"Aria Vale",handle:"@ariavale",email:"aria@ariavale.com",followers:"4.2M",tier:"Enterprise",status:"active",platforms:["instagram","tiktok","youtube"],threats:12,resolved:43,initials:"AV",color:"#C8A84B",joined:"Jan 2025",bio:"✨ Lifestyle & Fashion | LA based | DMs open for collabs"},
  {id:"i2",name:"Marcus Obi",handle:"@marcusobi",email:"marcus@marcusobi.com",followers:"1.8M",tier:"Pro",status:"active",platforms:["instagram","twitter"],threats:3,resolved:18,initials:"MO",color:"#7B3FE4",joined:"Feb 2025",bio:"Tech reviews & lifestyle. New video every Tuesday."},
  {id:"i3",name:"Zoe Hartley",handle:"@zoehartley",email:"zoe@zoehartley.com",followers:"9.1M",tier:"Enterprise",status:"critical",platforms:["tiktok","instagram","youtube","twitter"],threats:27,resolved:91,initials:"ZH",color:"#EF4444",joined:"Dec 2024",bio:"Beauty creator 🌸 NYC | Press: zoe@zoehartley.io"},
  {id:"i4",name:"Kai Nakamura",handle:"@kainakamura",email:"kai@kainakamura.com",followers:"650K",tier:"Starter",status:"active",platforms:["instagram","youtube"],threats:1,resolved:7,initials:"KN",color:"#10B981",joined:"Mar 2025",bio:"Adventure & travel. Canon shooter. 📸"},
  {id:"i5",name:"Destiny Cruz",handle:"@destinycruz",email:"destiny@destinycruz.com",followers:"2.3M",tier:"Pro",status:"warning",platforms:["tiktok","instagram"],threats:8,resolved:29,initials:"DC",color:"#3B82F6",joined:"Jan 2025",bio:"Fitness & wellness coach. NASM certified. 💪"},
];

const THREATS = [
  {id:"t1",iId:"i3",name:"Zoe Hartley",fake:"@zoehart1ey_real",fakeDisplay:"Zoe Hartley ✓",platform:"instagram",type:"ACCOUNT_LOOKALIKE",ociScore:94,ioi:["HANDLE_TYPOSQUAT","AVATAR_CLONE","BIO_MIRROR","VERIFIED_SPOOF"],severity:"critical",status:"pending_review",detected:"3m ago",ttps:"Avatar Hijack + Handle Typosquat",actor:"TA-2841",posts:847,followers:"12.3K"},
  {id:"t2",iId:"i1",name:"Aria Vale",fake:"@aria.vale.official2",fakeDisplay:"Aria Vale Official",platform:"tiktok",type:"LIKENESS_CLONE",ociScore:89,ioi:["AVATAR_CLONE","DEEPFAKE_INDICATOR","COMMERCE_FRAUD"],severity:"critical",status:"analyst_review",detected:"18m ago",ttps:"Deepfake Profile + Badge Spoof",actor:"TA-1193",posts:23,followers:"4.1K"},
  {id:"t3",iId:"i3",name:"Zoe Hartley",fake:"@Zoe_Hartley_Backup",fakeDisplay:"Zoe Hartley (Backup)",platform:"twitter",type:"PERSISTENCE_ACCOUNT",ociScore:76,ioi:["DISPLAY_NAME_CLONE","BIO_MIRROR","ACTOR_LINKED"],severity:"high",status:"triaged",detected:"2h ago",ttps:"Identity Persistence Fallback",actor:"TA-2841",posts:112,followers:"890"},
  {id:"t4",iId:"i2",name:"Marcus Obi",fake:"Marcus Obi Official Channel",fakeDisplay:"Marcus Obi Official",platform:"youtube",type:"CHANNEL_IMPERSONATION",ociScore:71,ioi:["DISPLAY_NAME_CLONE","THUMBNAIL_CLONE","MONETISATION_FRAUD"],severity:"high",status:"pending_review",detected:"4h ago",ttps:"Channel Name Hijack",actor:"TA-3307",posts:34,followers:"2.1K"},
  {id:"t5",iId:"i1",name:"Aria Vale",fake:"@ariaval3_merch",fakeDisplay:"Aria Vale Merch",platform:"instagram",type:"PHISHING_ACCOUNT",ociScore:88,ioi:["HANDLE_VARIANT","AVATAR_CLONE","PHISHING_LINK","COMMERCE_FRAUD"],severity:"critical",status:"takedown_filed",detected:"8h ago",ttps:"Commerce Fraud + DM Phishing",actor:"TA-1193",posts:19,followers:"3.8K"},
  {id:"t6",iId:"i5",name:"Destiny Cruz",fake:"@destinycruz_official",fakeDisplay:"Destiny Cruz 🌟",platform:"tiktok",type:"ACCOUNT_LOOKALIKE",ociScore:63,ioi:["HANDLE_VARIANT","BIO_MIRROR"],severity:"medium",status:"dismissed",detected:"2d ago",ttps:"Handle Variant + Bio Clone",actor:"TA-4421",posts:204,followers:"567"},
  {id:"t7",iId:"i3",name:"Zoe Hartley",fake:"@zoe.hartley.2025",fakeDisplay:"Zoe Hartley 2025",platform:"instagram",type:"ACCOUNT_LOOKALIKE",ociScore:82,ioi:["HANDLE_VARIANT","AVATAR_CLONE","ENGAGEMENT_FARM"],severity:"high",status:"pending_review",detected:"1d ago",ttps:"Avatar Clone + Engagement Farm",actor:"TA-2841",posts:331,followers:"7.2K"},
  {id:"t8",iId:"i4",name:"Kai Nakamura",fake:"@kai_nakamura_real",fakeDisplay:"Kai Nakamura Real",platform:"instagram",type:"ACCOUNT_LOOKALIKE",ociScore:58,ioi:["HANDLE_VARIANT","BIO_MIRROR"],severity:"low",status:"triaged",detected:"3d ago",ttps:"Handle Clone",actor:"TA-5102",posts:88,followers:"241"},
];

const AGENTS = [
  {id:"SEN-01",name:"SENTINEL Alpha",type:"SENTINEL",platform:"all",status:"active",health:99,tasks:18821,cpu:14,mem:28,ping:"1s",approved:true,scanRate:"4,200/hr",alerts:7,scope:["READ_FEED","READ_PROFILE","COMPUTE_DELTA"],
   desc:"Continuous passive perimeter monitoring across all registered influencer handles. Performs real-time feed ingestion, handle variance enumeration, and profile delta detection. Operates 24/7 within approved read-only scopes."},
  {id:"SEN-02",name:"SENTINEL Beta",type:"SENTINEL",platform:"instagram",status:"active",health:97,tasks:8421,cpu:22,mem:35,ping:"2s",approved:true,scanRate:"2,100/hr",alerts:3,scope:["READ_FEED","READ_PROFILE","COMPUTE_DELTA"],
   desc:"Instagram-dedicated monitor. Specialises in Bio-IOI detection, handle typosquat enumeration via Levenshtein distance scoring, and Stories metadata analysis."},
  {id:"REC-01",name:"RECON Crawler",type:"RECON",platform:"tiktok",status:"active",health:94,tasks:6203,cpu:38,mem:44,ping:"1s",approved:true,scanRate:"890/hr",alerts:12,scope:["READ_FEED","READ_PROFILE","READ_POSTS","READ_FOLLOWERS","WRITE_INTEL_DB"],
   desc:"Deep-investigation agent. Once SENTINEL raises an IOI alert, RECON performs enriched reconnaissance — harvesting full profile metadata, post archives, follower graph overlap, and cross-linking to known actor TTPs."},
  {id:"VER-01",name:"VERITAS Vision",type:"VERITAS",platform:"all",status:"active",health:98,tasks:4104,cpu:71,mem:68,ping:"1s",approved:true,scanRate:"340/hr",alerts:9,scope:["READ_OCI_VAULT","WRITE_OCI_VAULT","COMPUTE_SIMILARITY","READ_PROFILE"],
   desc:"Multimodal likeness analysis engine. Runs perceptual hashing (pHash + dHash), CLIP-based facial similarity scoring, watermark extraction, and metadata forensics against the OCI Likeness Vault for OCI verification."},
  {id:"NEX-01",name:"NEXUS Correlator",type:"NEXUS",platform:"all",status:"active",health:96,tasks:2891,cpu:19,mem:31,ping:"3s",approved:true,scanRate:"180/hr",alerts:4,scope:["READ_INTEL_DB","WRITE_ACTOR_REGISTRY","COMPUTE_ATTRIBUTION"],
   desc:"Cross-platform threat actor attribution engine. Links disparate IOI signals to unified actor profiles using graph correlation, behavioural TTP clustering, and temporal analysis. Maintains the Threat Actor Registry."},
  {id:"ARB-01",name:"ARBITER Queue",type:"ARBITER",platform:"all",status:"standby",health:100,tasks:0,cpu:2,mem:14,ping:"5s",approved:false,scanRate:"N/A",alerts:0,scope:["READ_INTEL_DB","DRAFT_TAKEDOWN"],blockedScope:["SUBMIT_TAKEDOWN","CONTACT_PLATFORM"],
   desc:"⚠ HUMAN-IN-THE-LOOP ENFORCED. Takedown orchestration agent. Prepares platform Trust & Safety reports and DMCA notices but CANNOT submit without explicit authorisation from a credentialled SOC Analyst. All actions are audit-logged."},
  {id:"WDG-01",name:"WATCHDOG Compliance",type:"WATCHDOG",platform:"all",status:"active",health:100,tasks:1203,cpu:8,mem:19,ping:"2s",approved:true,scanRate:"continuous",alerts:1,scope:["AUDIT_ALL_AGENTS","WRITE_COMPLIANCE_LOG","READ_APPROVED_TTPS"],
   desc:"Agent behavioural auditor. Continuously monitors all agent actions against approved TTP boundaries, enforces data governance policies, and raises COMPLIANCE_ALERT if any agent attempts an action outside its approved scope."},
];

const OCI_PROFILES = [
  {id:"o1",iId:"i1",influencer:"Aria Vale",platform:"instagram",handle:"@ariavale",initials:"AV",color:"#C8A84B",bio:"✨ Lifestyle & Fashion | 4.2M fam",followers:"4.2M",verified:true,captured:"2025-01-15",fingerprint:"pHash:a3f8c1e9·dHash:2b4d8f1c",vectorId:"BIV-AV-001",isClone:false},
  {id:"o2",iId:"i3",influencer:"Zoe Hartley",platform:"tiktok",handle:"@zoehartley",initials:"ZH",color:"#7B3FE4",bio:"Beauty creator 🌸 NYC",followers:"9.1M",verified:true,captured:"2024-12-12",fingerprint:"pHash:f72a9e3c·dHash:1b8d4e7a",vectorId:"BIV-ZH-001",isClone:false},
  {id:"o3",iId:"i2",influencer:"Marcus Obi",platform:"youtube",handle:"@marcusobi",initials:"MO",color:"#10B981",bio:"Tech reviews & lifestyle",followers:"1.8M",verified:true,captured:"2025-02-01",fingerprint:"pHash:2c7f4a8e·dHash:5b9d3f2a",vectorId:"BIV-MO-001",isClone:false},
  {id:"o4",iId:"i3",influencer:"Zoe Hartley",platform:"instagram",handle:"@zoehartley",initials:"ZH",color:"#7B3FE4",bio:"Beauty creator 🌸 NYC",followers:"8.9M",verified:true,captured:"2025-01-20",fingerprint:"pHash:f72a9e3c·dHash:1b8d4e7a",vectorId:"BIV-ZH-002",isClone:false},
  {id:"o5",iId:"i3",influencer:"[THREAT] @zoehart1ey_real",platform:"instagram",handle:"@zoehart1ey_real",initials:"ZH",color:"#EF4444",bio:"Beauty creator 🌸 NYC | Press: zoe@zoehartley.io",followers:"12.3K",verified:false,captured:"2025-03-01",fingerprint:"pHash:f71a9e3c·dHash:1b8d4e7b",vectorId:"THR-ZH-001",similarity:94,threatId:"t1",isClone:true},
  {id:"o6",iId:"i1",influencer:"[THREAT] @aria.vale.official2",platform:"tiktok",handle:"@aria.vale.official2",initials:"AV",color:"#EF4444",bio:"✨ Lifestyle & Fashion | LA based",followers:"4.1K",verified:false,captured:"2025-03-01",fingerprint:"pHash:a3f8c1e8·dHash:2b4d8f1d",vectorId:"THR-AV-001",similarity:89,threatId:"t2",isClone:true},
];

const TAKEDOWNS = [
  {id:"td1",threatId:"t1",influencer:"Zoe Hartley",iId:"i3",fake:"@zoehart1ey_real",platform:"instagram",reportType:"PLATFORM_TRUST_SAFETY",ociScore:94,analyst:null,status:"awaiting_review",agent:"RECON-01",evidence:["Avatar match 94%","Handle typosquat (1 char diff)","Bio mirror (verbatim copy)","Follower overlap 2.1K"],notes:"",filedAt:null,priority:"critical"},
  {id:"td2",threatId:"t4",influencer:"Marcus Obi",iId:"i2",fake:"Marcus Obi Official Channel",platform:"youtube",reportType:"PLATFORM_TRUST_SAFETY",ociScore:71,analyst:null,status:"awaiting_review",agent:"SENTINEL-02",evidence:["Display name match","Thumbnail style clone","Monetisation fraud indicators"],notes:"",filedAt:null,priority:"high"},
  {id:"td3",threatId:"t7",influencer:"Zoe Hartley",iId:"i3",fake:"@zoe.hartley.2025",platform:"instagram",reportType:"DMCA_NOTICE",ociScore:82,analyst:"James Okonkwo",status:"under_review",agent:"VERITAS-01",evidence:["Avatar match 82%","Original image © 2024 Zoe Hartley","Engagement farming confirmed"],notes:"Confirmed likeness match. Drafting DMCA with OCI Vault evidence bundle.",filedAt:null,priority:"high"},
  {id:"td4",threatId:"t5",influencer:"Aria Vale",iId:"i1",fake:"@ariaval3_merch",platform:"instagram",reportType:"PLATFORM_TRUST_SAFETY",ociScore:88,analyst:"Maria Chen",status:"filed",agent:"NEXUS-01",evidence:["Handle variant","Avatar match 88%","Commerce fraud detected","Phishing DM logs (14 victims)"],notes:"Filed via Instagram T&S portal. Reference: #IG-2291847. Expect 72hr resolution.",filedAt:"2025-03-01 09:14",priority:"critical"},
];

const USERS = [
  {id:"u1",name:"Maria Chen",email:"maria@imprsn8.io",role:"admin",status:"active",mfa:true,lastLogin:"Just now",modules:["all"],iId:null},
  {id:"u2",name:"James Okonkwo",email:"james@imprsn8.io",role:"soc_analyst",status:"active",mfa:true,lastLogin:"2h ago",modules:["command_center","threat_intel","oci_vault","takedown_queue","agent_ops","knowledge_base"],iId:null},
  {id:"u3",name:"Tyler Reeves",email:"tyler@imprsn8.io",role:"soc_analyst",status:"invited",mfa:false,lastLogin:"Never",modules:["command_center","threat_intel","takedown_queue"],iId:null},
  {id:"u4",name:"Aria Vale",email:"aria@ariavale.com",role:"influencer",status:"active",mfa:true,lastLogin:"1d ago",modules:["my_dashboard","my_accounts","threat_alerts","takedown_status","knowledge_base"],iId:"i1"},
  {id:"u5",name:"Sophie Lee",email:"sophie@ariavale.com",role:"influencer_staff",status:"active",mfa:false,lastLogin:"3d ago",modules:["my_dashboard","threat_alerts"],iId:"i1"},
  {id:"u6",name:"Zoe Hartley",email:"zoe@zoehartley.com",role:"influencer",status:"active",mfa:true,lastLogin:"6h ago",modules:["my_dashboard","my_accounts","threat_alerts","takedown_status","knowledge_base"],iId:"i3"},
];

const KB = [
  {id:"kb1",cat:"Getting Started",icon:"⚡",title:"Onboarding your influencer tenant to imprsn8",views:2104,updated:"1d ago",tags:["setup","tenant"]},
  {id:"kb2",cat:"OCI Detection",icon:"🔬",title:"Understanding Indicators of Impersonation (IOI) — full taxonomy",views:1891,updated:"3d ago",tags:["oci","ioi","detection"]},
  {id:"kb3",cat:"OCI Detection",icon:"🖼️",title:"OCI Likeness Vault & perceptual fingerprinting explained",views:1204,updated:"5d ago",tags:["likeness","phash","fingerprint"]},
  {id:"kb4",cat:"Takedowns",icon:"🚩",title:"DMCA Notices vs Platform Trust & Safety Reports",views:987,updated:"2d ago",tags:["dmca","takedown"]},
  {id:"kb5",cat:"Takedowns",icon:"⚖️",title:"Human-in-the-Loop (HITL): mandatory analyst review protocol",views:876,updated:"4d ago",tags:["hitl","analyst","review"]},
  {id:"kb6",cat:"AI Agents",icon:"🤖",title:"Agent taxonomy: SENTINEL · RECON · VERITAS · NEXUS · ARBITER · WATCHDOG",views:1432,updated:"1w ago",tags:["agents","sentinel","recon"]},
  {id:"kb7",cat:"AI Agents",icon:"🛡️",title:"WATCHDOG: approved TTP boundaries and compliance enforcement",views:654,updated:"1w ago",tags:["watchdog","compliance","ttp"]},
  {id:"kb8",cat:"Threat Intel",icon:"🎯",title:"Threat actor profiling and cross-platform attribution chains",views:743,updated:"6d ago",tags:["attribution","nexus","actor"]},
  {id:"kb9",cat:"Access Mgmt",icon:"🔑",title:"RBAC, MFA enforcement, and module-level access configuration",views:521,updated:"1w ago",tags:["rbac","mfa","access"]},
  {id:"kb10",cat:"Integrations",icon:"🔗",title:"Connecting social media accounts — API keys and OAuth scopes",views:1109,updated:"2d ago",tags:["integration","social","api"]},
  {id:"kb11",cat:"OCI Detection",icon:"🧬",title:"VERITAS Vision: multimodal likeness analysis and scoring methodology",views:833,updated:"4d ago",tags:["veritas","similarity","ai"]},
  {id:"kb12",cat:"Threat Intel",icon:"🕸️",title:"NEXUS Correlator: building and reading attribution graphs",views:612,updated:"5d ago",tags:["nexus","graph","attribution"]},
];

// ── ICONS ────────────────────────────────────────────────────────
const P = {
  shield:"M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z",
  grid:"M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z",
  alert:"M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01",
  users:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  eye:"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  bot:"M9 3H6a3 3 0 00-3 3v10a2 2 0 002 2h14a2 2 0 002-2V6a3 3 0 00-3-3h-3m0 0a2 2 0 01-4 0m4 0h-4M8 14a1 1 0 102 0 1 1 0 00-2 0m5 0a1 1 0 102 0 1 1 0 00-2 0",
  key:"M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  database:"M12 2C7 2 3 3.34 3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5c0-1.66-4-3-9-3zm0 0c5 0 9 1.34 9 3M3 8c0 1.66 4 3 9 3s9-1.34 9-3M3 14c0 1.66 4 3 9 3s9-1.34 9-3",
  flag:"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7",
  book:"M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z",
  settings:"M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  search:"M21 21l-4.35-4.35M11 19A8 8 0 1011 3a8 8 0 000 16z",
  bell:"M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
  sun:"M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 17a5 5 0 100-10 5 5 0 000 10z",
  moon:"M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
  menu:"M3 12h18M3 6h18M3 18h18",
  plus:"M12 5v14M5 12h14",
  check:"M20 6L9 17l-5-5",
  x:"M18 6L6 18M6 6l12 12",
  logout:"M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  chevronR:"M9 18l6-6-6-6",
  chevronD:"M6 9l6 6 6-6",
  activity:"M22 12h-4l-3 9L9 3l-3 9H2",
  link:"M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
  target:"M12 22a10 10 0 100-20 10 10 0 000 20zM12 18a6 6 0 100-12 6 6 0 000 12zM12 14a2 2 0 100-4 2 2 0 000 4z",
  fingerprint:"M12 11c0 3.517-1.009 6.799-2.753 9.571M8.56 14.53A13.9 13.9 0 018 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4",
  download:"M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  upload:"M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
  lock:"M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4",
  mail:"M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  radar:"M12 2a10 10 0 100 20A10 10 0 0012 2zM12 6a6 6 0 100 12A6 6 0 0012 6zM12 10a2 2 0 100 4 2 2 0 000-4zM12 12l8-4",
  layers:"M2 7l10-5 10 5-10 5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  image:"M21 21H3V3h18v18zM3 15l5-5 4 4 3-3 6 6M8.5 8.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0",
  cpu:"M9 3H6a3 3 0 00-3 3v3M15 3h3a3 3 0 013 3v3M9 21H6a3 3 0 01-3-3v-3M15 21h3a3 3 0 003-3v-3M9 9h6v6H9z",
  filter:"M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  copy:"M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2M8 4a2 2 0 012-2h4a2 2 0 012 2M8 4h8",
  info:"M12 16v-4M12 8h.01M22 12a10 10 0 11-20 0 10 10 0 0120 0z",
  google:"M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z",
};
const Ic = ({n,s=16,c="currentColor"}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {P[n] && <path d={P[n]}/>}
  </svg>
);

// ── BASE COMPONENTS ──────────────────────────────────────────────
const Av = ({initials,size=38,color="#7B3FE4",gold,t}) => {
  const bg = gold ? `conic-gradient(from 120deg,${t.gold},${t.purple},${t.gold})` : `linear-gradient(135deg,${color}dd,${color}77)`;
  return <div style={{width:size,height:size,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:bg,fontSize:size*.34,fontWeight:800,color:"#fff",flexShrink:0,letterSpacing:.5,boxShadow:`0 2px 14px ${color}40`}}>{initials}</div>;
};

const Bdg = ({label,v="purple",dot,t}) => {
  const S = {
    purple:{bg:t.purpleGlow,border:t.purpleBorder,color:t.purpleBright},
    gold:{bg:t.goldGlow,border:t.goldBorder,color:t.goldBright},
    red:{bg:t.redGlow,border:t.redBorder,color:t.red},
    green:{bg:t.greenGlow,border:t.greenBorder,color:t.green},
    blue:{bg:t.blueGlow,border:t.blueBorder,color:t.blue},
    orange:{bg:t.orangeGlow,border:t.orangeBorder,color:t.orange},
    muted:{bg:t.mode==="dark"?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)",border:t.cardBorder,color:t.textMuted},
  };
  const s = S[v] || S.purple;
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 9px",borderRadius:999,fontSize:11,fontWeight:700,letterSpacing:.3,background:s.bg,border:`1px solid ${s.border}`,color:s.color,whiteSpace:"nowrap"}}>
    {dot && <span style={{width:5,height:5,borderRadius:"50%",background:s.color,flexShrink:0}}/>}
    {label}
  </span>;
};

const SevBdg = ({sev,t}) => {
  const m = {critical:["red","CRITICAL"],high:["gold","HIGH"],medium:["blue","MEDIUM"],low:["green","LOW"]};
  const [v,l] = m[sev] || ["muted",sev];
  return <Bdg label={l} v={v} t={t}/>;
};

const StsBdg = ({sts,t}) => {
  const m = {
    active:["green","ACTIVE"],critical:["red","CRITICAL"],warning:["orange","WARNING"],
    invited:["blue","INVITED"],standby:["blue","STANDBY"],
    pending_review:["orange","PENDING REVIEW"],analyst_review:["blue","IN REVIEW"],
    triaged:["purple","TRIAGED"],takedown_filed:["green","FILED"],dismissed:["muted","DISMISSED"],
    awaiting_review:["orange","AWAITING REVIEW"],under_review:["blue","UNDER REVIEW"],filed:["green","FILED"],
  };
  const [v,l] = m[sts] || ["muted",(sts||"").toUpperCase().replace(/_/g," ")];
  return <Bdg label={l} v={v} dot t={t}/>;
};

const Pulse = ({c="#10B981",sz=10}) => (
  <span style={{position:"relative",display:"inline-flex",width:sz,height:sz,flexShrink:0}}>
    <span style={{position:"absolute",inset:0,borderRadius:"50%",background:c,opacity:.35,animation:"ping 1.8s cubic-bezier(0,0,.2,1) infinite"}}/>
    <span style={{position:"relative",width:sz,height:sz,borderRadius:"50%",background:c}}/>
  </span>
);

const Bar = ({val,max=100,c,t}) => {
  const pct = Math.min(100,(val/max)*100);
  const col = c || (pct>75?t.red:pct>50?t.orange:t.purple);
  return <div style={{width:"100%",height:5,borderRadius:99,background:t.mode==="dark"?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)",overflow:"hidden"}}>
    <div style={{height:"100%",width:`${pct}%`,borderRadius:99,background:col,transition:"width .4s ease"}}/>
  </div>;
};

const Ring = ({score,size=52,t}) => {
  const r=(size-8)/2, circ=2*Math.PI*r, dash=(score/100)*circ;
  const c = score>=85?t.red:score>=70?t.orange:score>=50?t.gold:t.green;
  return <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={t.mode==="dark"?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)"} strokeWidth={5}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={5} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
    </svg>
    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:c}}>{score}</div>
  </div>;
};

const Crd = ({children,t,style,onClick,glow,danger}) => (
  <div onClick={onClick} style={{background:t.card,border:`1px solid ${danger?t.redBorder:glow?t.goldBorder:t.cardBorder}`,borderRadius:16,boxShadow:t.mode==="dark"?"0 4px 24px rgba(0,0,0,.3)":"0 2px 12px rgba(0,0,0,.06)",...(onClick?{cursor:"pointer"}:{}),...style}}
    onMouseEnter={onClick?e=>{e.currentTarget.style.borderColor=t.purpleBorder;e.currentTarget.style.transform="translateY(-1px)"}:undefined}
    onMouseLeave={onClick?e=>{e.currentTarget.style.borderColor=danger?t.redBorder:glow?t.goldBorder:t.cardBorder;e.currentTarget.style.transform=""}:undefined}>
    {children}
  </div>
);

const StatCrd = ({icon,label,value,sub,v="purple",t}) => (
  <Crd t={t} style={{padding:"20px 22px",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:-20,right:-20,width:90,height:90,borderRadius:"50%",background:v==="gold"?t.goldGlow:v==="red"?t.redGlow:v==="green"?t.greenGlow:v==="blue"?t.blueGlow:t.purpleGlow,filter:"blur(20px)"}}/>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
      <Ic n={icon} s={15} c={v==="gold"?t.gold:v==="red"?t.red:v==="green"?t.green:v==="blue"?t.blue:t.purple}/>
      <span style={{fontSize:11,color:t.textMuted,fontWeight:700,letterSpacing:.5,textTransform:"uppercase"}}>{label}</span>
    </div>
    <div style={{fontSize:34,fontWeight:800,color:t.text,letterSpacing:-1.5,lineHeight:1}}>{value}</div>
    {sub && <div style={{fontSize:12,color:t.textMuted,marginTop:6}}>{sub}</div>}
  </Crd>
);

const Btn = ({children,onClick,v="outline",sz="md",disabled,t,icon,full}) => {
  const sizes = {sm:{padding:"5px 12px",fontSize:12},md:{padding:"8px 16px",fontSize:13},lg:{padding:"11px 22px",fontSize:14}};
  const variants = {
    primary:{background:t.purple,color:"#fff",border:"none"},
    gold:{background:`linear-gradient(135deg,${t.gold}cc,${t.purple})`,color:"#fff",border:"none"},
    danger:{background:t.red,color:"#fff",border:"none"},
    success:{background:t.green,color:"#fff",border:"none"},
    outline:{background:"none",color:t.textMuted,border:`1px solid ${t.cardBorder}`},
    ghost:{background:"none",color:t.textMuted,border:"none"},
  };
  const vs = variants[v] || variants.outline;
  return <button onClick={onClick} disabled={disabled} style={{...sizes[sz],...vs,borderRadius:8,cursor:disabled?"not-allowed":"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,fontWeight:600,transition:"opacity .15s,transform .1s",opacity:disabled?.5:1,fontFamily:"inherit",width:full?"100%":"auto"}}
    onMouseEnter={e=>{if(!disabled){e.currentTarget.style.opacity=".82";e.currentTarget.style.transform="translateY(-1px)"}}}
    onMouseLeave={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.transform=""}}>
    {icon && <Ic n={icon} s={14} c="currentColor"/>}{children}
  </button>;
};

const TH = ({children,t}) => <th style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:t.textMuted,textTransform:"uppercase",letterSpacing:.5,borderBottom:`1px solid ${t.divider}`,whiteSpace:"nowrap",background:t.mode==="dark"?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.015)"}}>{children}</th>;
const TD = ({children,t,style}) => <td style={{padding:"12px 14px",borderBottom:`1px solid ${t.divider}`,verticalAlign:"middle",...style}}>{children}</td>;

const Inp = ({value,onChange,placeholder,t,icon,type="text",onKeyDown}) => (
  <div style={{position:"relative"}}>
    {icon && <div style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}><Ic n={icon} s={14} c={t.textMuted}/></div>}
    <input type={type} value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder}
      style={{width:"100%",padding:`9px ${icon?"9px 9px 36px":"12px"}`,paddingLeft:icon?36:12,borderRadius:8,border:`1px solid ${t.inputBorder}`,background:t.inputBg,color:t.text,fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box",transition:"border-color .15s"}}
      onFocus={e=>e.target.style.borderColor=t.purple} onBlur={e=>e.target.style.borderColor=t.inputBorder}/>
  </div>
);

const BackBtn = ({onClick,t}) => (
  <button onClick={onClick} style={{background:"none",border:`1px solid ${t.cardBorder}`,borderRadius:8,padding:"6px 14px",cursor:"pointer",color:t.textMuted,fontFamily:"inherit",fontSize:13,display:"flex",alignItems:"center",gap:6}}>
    <Ic n="chevronR" s={13} c={t.textMuted} style={{transform:"rotate(180deg)"}}/> Back
  </button>
);

// ── FEED DATA ────────────────────────────────────────────────────
const FEED_CONFIGS = [
  {
    id:"twitter", name:"X / Twitter", icon:"𝕏", color:"#1DA1F2",
    mode:"STREAM + POLL", status:"active", connected:true,
    auth:"OAuth 2.0 Bearer", tier:"Pro ($5,000/mo)",
    quota:{daily:null, monthly:1000000, unit:"tweets", used:182440, resetIn:"18d"},
    rateLimits:{stream:"3 concurrent", search:"1M/mo", userLookup:"100 users/call"},
    endpoints:[
      {name:"Filtered Stream",type:"STREAM",url:"/2/tweets/search/stream",interval:"persistent",cost:"N/A",status:"live"},
      {name:"User Lookup",type:"POLL",url:"/2/users/by",interval:"15 min",cost:"1 unit/100 users",status:"active"},
      {name:"Recent Search",type:"POLL",url:"/2/tweets/search/recent",interval:"5 min",cost:"1 unit",status:"active"},
    ],
    autoConfig:{backoff:"exponential",base:60,cap:900,jitter:5000,retries:"unlimited"},
    signals:["HANDLE_TYPOSQUAT","DISPLAY_NAME_CLONE","BIO_MIRROR","VERIFIED_SPOOF","IMPERSONATION_LABEL"],
    lastPoll:"12s ago", alertsToday:23, variantsWatched:847,
  },
  {
    id:"tiktok", name:"TikTok", icon:"♪", color:"#FF0050",
    mode:"POLL", status:"active", connected:true,
    auth:"OAuth 2.0 (Research API)", tier:"Research Approved",
    quota:{daily:1000, monthly:null, unit:"queries", used:342, resetIn:"14h 22m"},
    rateLimits:{userInfo:"1 query/request", videoQuery:"100 results/page"},
    endpoints:[
      {name:"User Info",type:"POLL",url:"/v2/research/user/info/",interval:"1 hr",cost:"1 query",status:"active"},
      {name:"Video Query",type:"POLL",url:"/v2/research/video/query/",interval:"2 hr",cost:"1 query",status:"active"},
      {name:"Hashtag Query",type:"POLL",url:"/v2/research/hashtag/query/",interval:"4 hr",cost:"1 query",status:"active"},
    ],
    autoConfig:{quotaReserve:"20%",resetStrategy:"midnight_utc",lanes:{sentinel:"40%",recon:"40%",reserve:"20%"}},
    signals:["HANDLE_VARIANT","AVATAR_CLONE","BIO_MIRROR","FOLLOWER_COUNT_SPOOF"],
    lastPoll:"38m ago", alertsToday:14, variantsWatched:623,
  },
  {
    id:"instagram", name:"Instagram", icon:"◈", color:"#E1306C",
    mode:"POLL", status:"active", connected:true,
    auth:"OAuth 2.0 (Business Graph API)", tier:"Business",
    quota:{daily:4800, monthly:null, unit:"calls", used:1204, resetIn:"9h 41m"},
    rateLimits:{perHour:200, perDay:4800, tokenRotation:"enabled (3 tokens)"},
    endpoints:[
      {name:"Business Discovery",type:"POLL",url:"/{user-id}/business_discovery",interval:"30 min",cost:"1 call",status:"active"},
      {name:"Hashtag Media",type:"POLL",url:"/{hashtag-id}/recent_media",interval:"1 hr",cost:"1 call",status:"active"},
      {name:"Mention Monitor",type:"POLL",url:"/{user-id}/mentioned_media",interval:"15 min",cost:"1 call",status:"active"},
    ],
    autoConfig:{tokenPool:3,rotateOn429:true,softThrottle:"80%"},
    signals:["HANDLE_VARIANT","AVATAR_CLONE","HASHTAG_ABUSE","MENTION_HIJACK","PHISHING_LINK"],
    lastPoll:"3m ago", alertsToday:31, variantsWatched:1204,
  },
  {
    id:"facebook", name:"Facebook", icon:"ƒ", color:"#1877F2",
    mode:"POLL", status:"active", connected:true,
    auth:"OAuth 2.0 Page Token (PPCA approved)", tier:"Business (PPCA)",
    quota:{daily:null, monthly:null, unit:"calls/hr", used:44, resetIn:"rolling"},
    rateLimits:{perHour:200, headerMonitor:"X-App-Usage"},
    endpoints:[
      {name:"Page Search",type:"POLL",url:"/search?type=page",interval:"1 hr",cost:"1 call",status:"active"},
      {name:"Page Details",type:"POLL",url:"/{page-id}",interval:"2 hr",cost:"1 call",status:"active"},
      {name:"Page Posts",type:"POLL",url:"/{page-id}/posts",interval:"4 hr",cost:"1 call",status:"active"},
    ],
    autoConfig:{softThrottle:"80% X-App-Usage header",backoff:"linear 60s on >80%"},
    signals:["PAGE_NAME_CLONE","FAKE_BRAND_PAGE","AVATAR_CLONE","IMPERSONATION_CONTENT"],
    lastPoll:"52m ago", alertsToday:6, variantsWatched:412,
  },
  {
    id:"youtube", name:"YouTube", icon:"▶", color:"#FF0000",
    mode:"POLL", status:"active", connected:true,
    auth:"API Key (pool of 4)", tier:"Free (10K units/day)",
    quota:{daily:10000, monthly:null, unit:"units", used:3840, resetIn:"11h 12m"},
    rateLimits:{search:"100 units/call", channelDetail:"1 unit/call", reserve:"2000 units"},
    endpoints:[
      {name:"Channel Search",type:"POLL",url:"/search?type=channel",interval:"1 hr",cost:"100 units",status:"active"},
      {name:"Channel Detail",type:"POLL",url:"/channels",interval:"30 min",cost:"1 unit/50",status:"active"},
      {name:"Video Search",type:"POLL",url:"/search?type=video",interval:"2 hr",cost:"100 units",status:"throttled"},
    ],
    autoConfig:{budgetStrategy:"unit_aware",keyPool:4,rotateKeys:true,reserveUnits:2000},
    signals:["CHANNEL_NAME_CLONE","THUMBNAIL_CLONE","DESCRIPTION_MIRROR","SUBSCRIBER_SPOOF"],
    lastPoll:"22m ago", alertsToday:9, variantsWatched:289,
  },
  {
    id:"linkedin", name:"LinkedIn", icon:"in", color:"#0A66C2",
    mode:"POLL", status:"active", connected:true,
    auth:"OAuth 2.0 (Partner Program)", tier:"Partner",
    quota:{daily:100, monthly:null, unit:"calls", used:12, resetIn:"22h 8m"},
    rateLimits:{perDay:100, minInterval:"15 min"},
    endpoints:[
      {name:"Company Search",type:"POLL",url:"/companies?q=companiesSearchFacet",interval:"24 hr",cost:"1 call",status:"active"},
      {name:"UGC Posts",type:"POLL",url:"/ugcPosts",interval:"12 hr",cost:"1 call",status:"active"},
    ],
    autoConfig:{conservative:true,minIntervalMs:900000},
    signals:["COMPANY_PAGE_CLONE","PROFILE_IMPERSONATION","HEADSHOT_THEFT"],
    lastPoll:"4h ago", alertsToday:2, variantsWatched:89,
  },
  {
    id:"threads", name:"Threads", icon:"@", color:"#000000",
    mode:"POLL", status:"active", connected:true,
    auth:"OAuth 2.0 (Meta / shared IG quota)", tier:"Graph API",
    quota:{daily:4800, monthly:null, unit:"calls", used:203, resetIn:"9h 41m"},
    rateLimits:{sharedWith:"instagram",perHour:200},
    endpoints:[
      {name:"User Posts",type:"POLL",url:"/{user-id}/threads",interval:"1 hr",cost:"1 call",status:"active"},
    ],
    autoConfig:{sharedQuotaPool:"instagram",tokenRotation:true},
    signals:["HANDLE_VARIANT","BIO_MIRROR","AVATAR_CLONE"],
    lastPoll:"1h ago", alertsToday:4, variantsWatched:341,
  },
  {
    id:"reddit", name:"Reddit", icon:"👽", color:"#FF4500",
    mode:"POLL", status:"active", connected:true,
    auth:"OAuth 2.0 App", tier:"Free",
    quota:{daily:null, monthly:null, unit:"req/min", used:8, resetIn:"rolling"},
    rateLimits:{perMinute:60},
    endpoints:[
      {name:"User Search",type:"POLL",url:"/search.json?type=user",interval:"1 hr",cost:"1 req",status:"active"},
      {name:"Subreddit Search",type:"POLL",url:"/search.json?type=sr",interval:"2 hr",cost:"1 req",status:"active"},
    ],
    autoConfig:{tokenBucket:{capacity:60,refillRate:"1/s"}},
    signals:["USERNAME_CLONE","SUBREDDIT_IMPERSONATION","FAKE_AMA"],
    lastPoll:"1h ago", alertsToday:1, variantsWatched:156,
  },
  {
    id:"snapchat", name:"Snapchat", icon:"👻", color:"#FFFC00",
    mode:"REACTIVE",status:"limited", connected:false,
    auth:"Snap Kit (partner only)", tier:"Not connected",
    quota:{daily:null, monthly:null, unit:"N/A", used:0, resetIn:"N/A"},
    rateLimits:{method:"HEAD /add/{username_variant}"},
    endpoints:[
      {name:"Profile Probe",type:"REACTIVE",url:"snapchat.com/add/{handle}",interval:"on-demand",cost:"N/A",status:"limited"},
    ],
    autoConfig:{method:"http_probe",concurrency:5},
    signals:["USERNAME_CLONE"],
    lastPoll:"N/A", alertsToday:0, variantsWatched:0,
  },
];

const SENTINEL_ASSIGNMENTS = [
  {id:"SEN-01",name:"SENTINEL Alpha",platforms:["twitter","instagram","tiktok","youtube","facebook","linkedin","threads","reddit"],role:"Global Monitor — all platforms, all influencers"},
  {id:"SEN-02",name:"SENTINEL Beta",platforms:["instagram","threads"],role:"IG/Threads dedicated — high-volume hashtag + mention monitor"},
];

// ── FEED CONFIG VIEW ─────────────────────────────────────────────
const FeedConfig = ({t}) => {
  const [sel, setSel] = useState(null);
  const [tab, setTab] = useState("feeds");

  const totalAlerts = FEED_CONFIGS.reduce((s,f)=>s+f.alertsToday,0);
  const totalVariants = FEED_CONFIGS.reduce((s,f)=>s+f.variantsWatched,0);
  const connected = FEED_CONFIGS.filter(f=>f.connected).length;

  if (sel) {
    const fc = sel;
    return (
      <div style={{display:"flex",flexDirection:"column",gap:20,animation:"fadeUp .3s ease-out"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <BackBtn onClick={()=>setSel(null)} t={t}/>
          <div style={{width:42,height:42,borderRadius:12,background:fc.color+"22",border:`1px solid ${fc.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:fc.color,flexShrink:0}}>{fc.icon}</div>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:t.text}}>{fc.name}</div>
          <Bdg label={fc.mode} v="purple" t={t}/>
          {fc.connected ? <Bdg label="CONNECTED" v="green" dot t={t}/> : <Bdg label="NOT CONNECTED" v="red" t={t}/>}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:14}}>
          <StatCrd icon="activity" label="Alerts Today" value={fc.alertsToday} v="red" t={t}/>
          <StatCrd icon="eye" label="Variants Watched" value={fc.variantsWatched.toLocaleString()} v="purple" t={t}/>
          <StatCrd icon="database" label="Quota Used" value={fc.quota.used.toLocaleString()} sub={fc.quota.daily?`of ${fc.quota.daily.toLocaleString()}/day`:fc.quota.monthly?`of ${(fc.quota.monthly/1000).toFixed(0)}K/mo`:"rolling"} v="gold" t={t}/>
          <StatCrd icon="clock" label="Last Poll" value={fc.lastPoll} v="green" t={t}/>
        </div>

        {/* Quota bar */}
        {fc.quota.daily && (
          <Crd t={t} style={{padding:"16px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontWeight:700,color:t.text,fontSize:14}}>Daily Quota</span>
              <span style={{fontSize:13,color:t.textMuted}}>{((fc.quota.used/fc.quota.daily)*100).toFixed(1)}% used · resets in {fc.quota.resetIn}</span>
            </div>
            <div style={{height:10,borderRadius:99,background:t.mode==="dark"?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)",overflow:"hidden",marginBottom:8}}>
              <div style={{height:"100%",borderRadius:99,width:`${Math.min(100,(fc.quota.used/fc.quota.daily)*100)}%`,background:fc.quota.used/fc.quota.daily>0.8?t.red:fc.quota.used/fc.quota.daily>0.5?t.orange:t.green,transition:"width .4s"}}/>
            </div>
            <div style={{display:"flex",gap:8,fontSize:12,color:t.textMuted,flexWrap:"wrap"}}>
              <span>SENTINEL 40%</span><span>·</span><span>RECON 40%</span><span>·</span><span style={{color:t.gold}}>RESERVE 20% ({Math.floor(fc.quota.daily*0.2).toLocaleString()} {fc.quota.unit})</span>
            </div>
          </Crd>
        )}

        {/* Endpoints */}
        <Crd t={t}>
          <div style={{padding:"14px 18px",borderBottom:`1px solid ${t.divider}`,fontWeight:700,color:t.text,fontSize:14,display:"flex",alignItems:"center",gap:8}}>
            <Ic n="activity" s={16} c={t.purple}/>Configured Endpoints
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>{["Endpoint","Type","URL","Interval","Cost/Call","Status"].map(h=><TH key={h} t={t}>{h}</TH>)}</tr></thead>
              <tbody>
                {fc.endpoints.map((ep,i)=>(
                  <tr key={i} style={{transition:"background .15s"}} onMouseEnter={e=>e.currentTarget.style.background=t.mode==="dark"?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.01)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <TD t={t}><span style={{fontWeight:600,color:t.text,fontSize:13}}>{ep.name}</span></TD>
                    <TD t={t}><Bdg label={ep.type} v={ep.type==="STREAM"?"blue":ep.type==="REACTIVE"?"orange":"purple"} t={t}/></TD>
                    <TD t={t}><span style={{fontFamily:"monospace",fontSize:11,color:t.textMuted}}>{ep.url}</span></TD>
                    <TD t={t}><Bdg label={ep.interval} v="muted" t={t}/></TD>
                    <TD t={t}><span style={{fontSize:12,color:t.text}}>{ep.cost}</span></TD>
                    <TD t={t}><StsBdg sts={ep.status==="live"?"active":ep.status==="throttled"?"warning":ep.status==="active"?"active":"dismissed"} t={t}/></TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Crd>

        {/* Auto config + signals */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <Crd t={t} style={{padding:20}}>
            <div style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:.5,marginBottom:12}}>AUTO RATE-LIMIT CONFIG</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {Object.entries(fc.autoConfig).map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${t.divider}`,fontSize:12}}>
                  <span style={{color:t.textMuted,textTransform:"capitalize",fontWeight:600}}>{k.replace(/([A-Z])/g," $1").replace(/_/g," ")}</span>
                  <span style={{color:t.text,fontFamily:"monospace"}}>{typeof v==="object"?JSON.stringify(v):String(v)}</span>
                </div>
              ))}
            </div>
          </Crd>
          <Crd t={t} style={{padding:20}}>
            <div style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:.5,marginBottom:12}}>IOI SIGNALS DETECTED</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {fc.signals.map(s=><Bdg key={s} label={s.replace(/_/g," ")} v="purple" t={t}/>)}
            </div>
            <div style={{marginTop:16}}>
              <div style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:.5,marginBottom:8}}>AUTH</div>
              <div style={{fontSize:12,color:t.text,padding:"8px 12px",background:t.greenGlow,border:`1px solid ${t.greenBorder}`,borderRadius:8}}>
                <div style={{fontWeight:600,marginBottom:3}}>{fc.auth}</div>
                <div style={{color:t.textMuted}}>{fc.tier}</div>
              </div>
            </div>
          </Crd>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontSize:26,fontWeight:800,color:t.text,margin:"0 0 4px",letterSpacing:-1,fontFamily:"'Syne',sans-serif"}}>Live Feed Configuration</h1>
          <div style={{fontSize:13,color:t.textMuted}}>Real-time ingestion · Auto rate-limit control · Platform API management</div>
        </div>
        <Btn t={t} v="gold" icon="plus">Add Platform</Btn>
      </div>

      {/* Summary stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:14}}>
        <StatCrd icon="activity" label="Alerts Today" value={totalAlerts} sub="Across all platforms" v="red" t={t}/>
        <StatCrd icon="eye" label="Variants Monitored" value={totalVariants.toLocaleString()} sub="Handle + display name" v="purple" t={t}/>
        <StatCrd icon="layers" label="Platforms Active" value={`${connected}/${FEED_CONFIGS.length}`} sub="1 limited (Snapchat)" v="green" t={t}/>
        <StatCrd icon="radar" label="Stream Active" value="X / Twitter" sub="Filtered stream live" v="blue" t={t}/>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
        {["feeds","architecture","quota","variants"].map(tb=>(
          <button key={tb} onClick={()=>setTab(tb)} style={{padding:"8px 16px",borderRadius:8,border:`1px solid ${tab===tb?t.purpleBorder:t.cardBorder}`,background:tab===tb?t.purpleGlow:"none",color:tab===tb?t.purpleBright:t.textMuted,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit",textTransform:"capitalize"}}>
            {tb==="feeds"?"Platform Feeds":tb==="architecture"?"Ingestion Flow":tb==="quota"?"Quota Dashboard":"Variant Watchlist"}
          </button>
        ))}
      </div>

      {tab==="feeds" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {FEED_CONFIGS.map(fc=>(
            <Crd key={fc.id} t={t} onClick={()=>setSel(fc)} style={{padding:"16px 20px"}}>
              <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                <div style={{width:44,height:44,borderRadius:12,background:fc.color+"22",border:`1px solid ${fc.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:fc.color,flexShrink:0}}>{fc.icon}</div>
                <div style={{minWidth:150}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                    <span style={{fontWeight:700,color:t.text,fontSize:15}}>{fc.name}</span>
                    {fc.connected ? <Bdg label="LIVE" v="green" dot t={t}/> : <Bdg label="OFFLINE" v="red" t={t}/>}
                  </div>
                  <div style={{fontSize:12,color:t.textMuted}}>{fc.mode} · {fc.endpoints.length} endpoint{fc.endpoints.length!==1?"s":""} · Last: {fc.lastPoll}</div>
                </div>
                <div style={{flex:1,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:10}}>
                  <div><div style={{fontSize:11,color:t.textMuted,marginBottom:3}}>ALERTS TODAY</div><div style={{fontWeight:700,color:fc.alertsToday>10?t.red:t.text,fontSize:16}}>{fc.alertsToday}</div></div>
                  <div><div style={{fontSize:11,color:t.textMuted,marginBottom:3}}>VARIANTS WATCHED</div><div style={{fontWeight:700,color:t.text,fontSize:16}}>{fc.variantsWatched.toLocaleString()}</div></div>
                  <div>
                    <div style={{fontSize:11,color:t.textMuted,marginBottom:3}}>QUOTA</div>
                    {fc.quota.daily ? (
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <Bar val={fc.quota.used} max={fc.quota.daily} t={t}/>
                        <span style={{fontSize:11,color:t.textMuted,whiteSpace:"nowrap"}}>{((fc.quota.used/fc.quota.daily)*100).toFixed(0)}%</span>
                      </div>
                    ) : <div style={{fontSize:12,fontWeight:600,color:t.green}}>Rolling</div>}
                  </div>
                </div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {fc.signals.slice(0,2).map(s=><Bdg key={s} label={s.replace(/_/g," ")} v="purple" t={t}/>)}
                  {fc.signals.length>2&&<Bdg label={`+${fc.signals.length-2}`} v="muted" t={t}/>}
                </div>
                <Ic n="chevronR" s={16} c={t.textMuted}/>
              </div>
            </Crd>
          ))}
        </div>
      )}

      {tab==="architecture" && (
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {/* Flow diagram */}
          <Crd t={t} style={{padding:24}}>
            <div style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:.5,marginBottom:16}}>INGESTION FLOW — PULL METHOD CLASSIFICATION</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
              {[
                {label:"STREAM (persistent)",color:t.blue,desc:"X/Twitter Filtered Stream\nWebSocket, rules-based, auto-reconnect, 20s heartbeat",platforms:["𝕏"]},
                {label:"POLL (scheduled)",color:t.purple,desc:"TikTok · Instagram · Facebook\nYouTube · LinkedIn · Reddit · Threads\nAuto rate-governed, priority lanes",platforms:["♪","◈","ƒ","▶","in","👽","@"]},
                {label:"REACTIVE (on-demand)",color:t.gold,desc:"VERITAS thumbnail analysis\nRECON deep investigation\nTriggered by IOI alert ≥ threshold",platforms:["🔍"]},
              ].map(lane=>(
                <div key={lane.label} style={{padding:16,background:lane.color+"14",border:`1px solid ${lane.color}33`,borderRadius:12}}>
                  <div style={{fontWeight:700,color:lane.color,fontSize:13,marginBottom:8}}>{lane.label}</div>
                  <div style={{fontSize:11,color:t.textMuted,lineHeight:1.6,whiteSpace:"pre-line",marginBottom:10}}>{lane.desc}</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{lane.platforms.map(p=><span key={p} style={{fontSize:16}}>{p}</span>)}</div>
                </div>
              ))}
            </div>
            <div style={{borderTop:`1px solid ${t.divider}`,paddingTop:16}}>
              <div style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:.5,marginBottom:12}}>SENTINEL AGENT PLATFORM ASSIGNMENTS</div>
              {SENTINEL_ASSIGNMENTS.map(sa=>(
                <div key={sa.id} style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12,padding:"12px 14px",background:t.purpleGlow,border:`1px solid ${t.purpleBorder}`,borderRadius:10}}>
                  <div style={{width:36,height:36,borderRadius:8,background:t.blueGlow,border:`1px solid ${t.blueBorder}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic n="radar" s={16} c={t.blue}/></div>
                  <div>
                    <div style={{fontWeight:700,color:t.text,fontSize:14,marginBottom:3}}>{sa.name} <span style={{fontSize:11,color:t.textMuted,fontWeight:400}}>({sa.id})</span></div>
                    <div style={{fontSize:12,color:t.textMuted,marginBottom:6}}>{sa.role}</div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{sa.platforms.map(p=>{const fc=FEED_CONFIGS.find(f=>f.id===p);return fc?<Bdg key={p} label={fc.name} v="blue" t={t}/>:null;})}</div>
                  </div>
                </div>
              ))}
            </div>
          </Crd>

          {/* Auto rate-limit strategy */}
          <Crd t={t} style={{padding:20}}>
            <div style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:.5,marginBottom:14}}>AUTO RATE-LIMIT GOVERNOR — STRATEGY</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[
                {label:"Exponential Backoff",v:"blue",desc:"On 429: base 60s → doubles each retry, caps at 900s, +5s random jitter. Unlimited retries, no dropped requests."},
                {label:"Token Bucket (per platform)",v:"purple",desc:"Each platform has a bucket sized to burst cap. Refills at the platform-specific rate. Prevents burst saturation."},
                {label:"Priority Lanes",v:"gold",desc:"HIGH (active IOI) → immediate. NORMAL (scheduled) → governed rate. LOW (background) → uses ≤30% of remaining budget."},
                {label:"Quota Reserve",v:"green",desc:"20% of each platform's daily quota is locked for RECON & VERITAS reactive scans. WATCHDOG alerts if reserve is breached."},
              ].map(s=>(
                <div key={s.label} style={{padding:14,background:t.mode==="dark"?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)",border:`1px solid ${t.cardBorder}`,borderRadius:10}}>
                  <div style={{marginBottom:6}}><Bdg label={s.label} v={s.v} t={t}/></div>
                  <div style={{fontSize:12,color:t.textMuted,lineHeight:1.6}}>{s.desc}</div>
                </div>
              ))}
            </div>
          </Crd>
        </div>
      )}

      {tab==="quota" && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {FEED_CONFIGS.filter(fc=>fc.quota.daily||fc.quota.monthly).map(fc=>{
            const max = fc.quota.daily||fc.quota.monthly;
            const pct = Math.min(100,(fc.quota.used/max)*100);
            return (
              <Crd key={fc.id} t={t} style={{padding:"16px 20px"}}>
                <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                  <div style={{width:36,height:36,borderRadius:10,background:fc.color+"22",border:`1px solid ${fc.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:fc.color,flexShrink:0}}>{fc.icon}</div>
                  <div style={{minWidth:130}}><div style={{fontWeight:700,color:t.text,fontSize:14}}>{fc.name}</div><div style={{fontSize:11,color:t.textMuted}}>{fc.quota.daily?"Daily":"Monthly"} · Resets {fc.quota.resetIn}</div></div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:12}}>
                      <span style={{color:t.textMuted}}>{fc.quota.used.toLocaleString()} / {max.toLocaleString()} {fc.quota.unit}</span>
                      <span style={{color:pct>80?t.red:pct>50?t.orange:t.green,fontWeight:700}}>{pct.toFixed(1)}%</span>
                    </div>
                    <div style={{height:8,borderRadius:99,background:t.mode==="dark"?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)",overflow:"hidden"}}>
                      <div style={{height:"100%",borderRadius:99,width:`${pct}%`,background:pct>80?t.red:pct>50?t.orange:t.green,transition:"width .4s"}}/>
                    </div>
                    <div style={{display:"flex",gap:12,marginTop:5,fontSize:11,color:t.textMuted}}>
                      <span>SENTINEL: {Math.floor(max*.4).toLocaleString()}</span>
                      <span>RECON: {Math.floor(max*.4).toLocaleString()}</span>
                      <span style={{color:t.gold}}>RESERVE: {Math.floor(max*.2).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </Crd>
            );
          })}
          <Crd t={t} style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:10}}>
            <Ic n="info" s={16} c={t.gold}/>
            <span style={{fontSize:13,color:t.textMuted}}>Platforms with rolling limits (X stream, Facebook, Reddit) are governed by the token bucket governor. WATCHDOG monitors burn rates and alerts if any platform hits 90% within the first 75% of its reset window.</span>
          </Crd>
        </div>
      )}

      {tab==="variants" && (
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Crd t={t} style={{padding:20}}>
            <div style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:.5,marginBottom:14}}>HANDLE VARIANT WATCHLIST — GENERATION STRATEGY</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
              {[
                {label:"Character Substitution",count:"12–18 per handle",examples:"@ar1avale · @aria_val3 · @4riavale",v:"purple"},
                {label:"Separator Insertion",count:"3 per handle",examples:"@aria.vale · @aria_vale · @aria-vale",v:"blue"},
                {label:"Suffix / Prefix",count:"16 per handle",examples:"@ariavalereal · @officialariavale · @ariavalehq",v:"gold"},
                {label:"Homoglyph Substitution",count:"8–24 per handle",examples:"@аriavale (Cyrillic а) · @arıavale (Turkish ı)",v:"orange"},
                {label:"Display Name Variants",count:"4–8 per influencer",examples:"\"Aria Vale\" · \"Aria Vale Official\" · \"Aria Vale ✓\"",v:"green"},
                {label:"Truncation",count:"1–2 per handle",examples:"Handles over 20 chars truncated to platform limit",v:"muted"},
              ].map(s=>(
                <div key={s.label} style={{padding:14,background:t.mode==="dark"?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)",border:`1px solid ${t.cardBorder}`,borderRadius:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><Bdg label={s.label} v={s.v} t={t}/></div>
                  <div style={{fontSize:11,color:t.textMuted,marginBottom:5}}>{s.count}</div>
                  <div style={{fontSize:11,color:t.text,fontFamily:"monospace",lineHeight:1.6}}>{s.examples}</div>
                </div>
              ))}
            </div>
          </Crd>
          <Crd t={t} style={{padding:20}}>
            <div style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:.5,marginBottom:14}}>VARIANT COVERAGE PER INFLUENCER</div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr>{["Influencer","Handle","Variants Generated","Platforms Monitored","Alerts This Week"].map(h=><TH key={h} t={t}>{h}</TH>)}</tr></thead>
                <tbody>
                  {INFLUENCERS.map(inf=>(
                    <tr key={inf.id} style={{transition:"background .15s"}} onMouseEnter={e=>e.currentTarget.style.background=t.mode==="dark"?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.01)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <TD t={t}><div style={{display:"flex",alignItems:"center",gap:8}}><Av initials={inf.initials} color={inf.color} size={30} t={t}/><span style={{fontWeight:600,color:t.text,fontSize:13}}>{inf.name}</span></div></TD>
                      <TD t={t}><span style={{fontFamily:"monospace",fontSize:12,color:t.purpleBright}}>{inf.handle}</span></TD>
                      <TD t={t}><Bdg label={`~${40+inf.threats*3} variants`} v="purple" t={t}/></TD>
                      <TD t={t}><div style={{display:"flex",gap:3}}>{inf.platforms.map(p=><Bdg key={p} label={p} v="muted" t={t}/>)}</div></TD>
                      <TD t={t}><span style={{fontWeight:700,color:inf.threats>10?t.red:t.text,fontSize:14}}>{inf.threats}</span></TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Crd>
        </div>
      )}
    </div>
  );
};

// ── AUTH ────────────────────────────────────────────────────────
const AuthScreen = ({t, onLogin}) => {
  const [step, setStep] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [code, setCode] = useState(["","","","","",""]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [hint, setHint] = useState(false);
  const refs = useRef([]);

  const ACCS = [
    {email:"admin@imprsn8.io",password:"admin123",role:"admin",name:"Maria Chen"},
    {email:"soc@imprsn8.io",password:"soc1234",role:"soc_analyst",name:"James Okonkwo"},
    {email:"aria@ariavale.com",password:"influencer1",role:"influencer",name:"Aria Vale",iId:"i1"},
    {email:"zoe@zoehartley.com",password:"influencer2",role:"influencer",name:"Zoe Hartley",iId:"i3"},
  ];

  const doLogin = () => {
    setErr("");
    const acc = ACCS.find(a => a.email===email && a.password===pass);
    if (!acc) { setErr("Invalid credentials. See demo accounts below."); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep("mfa"); }, 1100);
  };

  const doMFA = () => {
    if (code.join("").length < 6) { setErr("Enter all 6 digits"); return; }
    setLoading(true);
    setTimeout(() => { onLogin(ACCS.find(a => a.email===email)); }, 900);
  };

  const mfaKey = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const n = [...code]; n[i] = val.slice(-1); setCode(n);
    if (val && i < 5) refs.current[i+1]?.focus();
    if (!val && i > 0) refs.current[i-1]?.focus();
  };

  return (
    <div style={{minHeight:"100vh",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(${t.gridLine} 1px,transparent 1px),linear-gradient(90deg,${t.gridLine} 1px,transparent 1px)`,backgroundSize:"44px 44px"}}/>
      <div style={{position:"absolute",top:"15%",left:"8%",width:500,height:500,borderRadius:"50%",background:t.purpleGlow,filter:"blur(100px)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"15%",right:"8%",width:400,height:400,borderRadius:"50%",background:t.goldGlow,filter:"blur(80px)",pointerEvents:"none"}}/>
      <div style={{width:"100%",maxWidth:420,animation:"fadeUp .5s ease-out",position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:62,height:62,borderRadius:18,background:`linear-gradient(135deg,${t.gold},${t.purple})`,marginBottom:16,boxShadow:`0 8px 32px ${t.purpleGlow}`}}>
            <Ic n="shield" s={28} c="#fff"/>
          </div>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:30,fontWeight:800,color:t.text,letterSpacing:-1}}>imprsn<span style={{color:t.gold}}>8</span></div>
          <div style={{color:t.textMuted,fontSize:13,marginTop:4}}>Influencer Identity Protection Platform</div>
        </div>

        <Crd t={t} style={{padding:"30px 28px"}}>
          {step === "login" ? (
            <div style={{animation:"slideIn .3s ease-out"}}>
              <div style={{marginBottom:22}}>
                <div style={{fontSize:20,fontWeight:800,color:t.text,marginBottom:4}}>Secure Sign In</div>
                <div style={{fontSize:13,color:t.textMuted}}>All sessions require MFA verification</div>
              </div>

              <button onClick={()=>{setEmail("admin@imprsn8.io");setPass("admin123");setLoading(true);setTimeout(()=>{setLoading(false);setStep("mfa");},800);}}
                style={{width:"100%",padding:"11px 16px",borderRadius:10,border:`1px solid ${t.cardBorder}`,background:t.inputBg,color:t.text,cursor:"pointer",fontSize:14,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:20,fontFamily:"inherit",transition:"border-color .15s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=t.purpleBorder}
                onMouseLeave={e=>e.currentTarget.style.borderColor=t.cardBorder}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill={t.mode==="dark"?"#aaa":"#555"}><path d={P.google}/></svg>
                Continue with Google
              </button>

              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
                <div style={{flex:1,height:1,background:t.divider}}/><span style={{color:t.textMuted,fontSize:12}}>or email</span><div style={{flex:1,height:1,background:t.divider}}/>
              </div>

              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:t.textMuted,display:"block",marginBottom:6,letterSpacing:.5}}>EMAIL</label>
                  <Inp value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@imprsn8.io" icon="mail" t={t} onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:t.textMuted,display:"block",marginBottom:6,letterSpacing:.5}}>PASSWORD</label>
                  <Inp value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" icon="lock" type="password" t={t} onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
                </div>
                {err && <div style={{color:t.red,fontSize:13,padding:"8px 12px",background:t.redGlow,border:`1px solid ${t.redBorder}`,borderRadius:8}}>{err}</div>}
                <button onClick={doLogin} disabled={loading}
                  style={{width:"100%",padding:"12px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${t.gold}bb,${t.purple})`,color:"#fff",fontSize:14,fontWeight:700,cursor:loading?"wait":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  {loading ? <div style={{width:18,height:18,borderRadius:"50%",border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",animation:"spin .7s linear infinite"}}/> : <><Ic n="lock" s={14} c="#fff"/>Sign In Securely</>}
                </button>
              </div>

              <div style={{marginTop:18,borderRadius:10,overflow:"hidden",border:`1px solid ${t.purpleBorder}`}}>
                <button onClick={()=>setHint(!hint)} style={{width:"100%",padding:"9px 14px",background:t.purpleGlow,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",color:t.purpleBright,fontSize:12,fontWeight:700,fontFamily:"inherit"}}>
                  <span>🔑 Demo Accounts</span><Ic n={hint?"chevronD":"chevronR"} s={14} c={t.purpleBright}/>
                </button>
                {hint && (
                  <div style={{padding:"10px 14px",background:t.purpleGlow,borderTop:`1px solid ${t.purpleBorder}`,display:"flex",flexDirection:"column",gap:8}}>
                    {[["admin@imprsn8.io","admin123","Admin"],["soc@imprsn8.io","soc1234","SOC Analyst"],["aria@ariavale.com","influencer1","Influencer (Aria)"],["zoe@zoehartley.com","influencer2","Influencer (Zoe)"]].map(([e,p,r])=>(
                      <button key={e} onClick={()=>{setEmail(e);setPass(p);}} style={{background:"none",border:"none",cursor:"pointer",textAlign:"left",padding:"3px 0",fontFamily:"inherit"}}>
                        <div style={{fontSize:11,color:t.purpleBright,fontWeight:700}}>{r}</div>
                        <div style={{fontSize:12,color:t.textMuted}}>{e} / {p}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{animation:"slideIn .3s ease-out"}}>
              <div style={{marginBottom:24}}>
                <div style={{fontSize:20,fontWeight:800,color:t.text,marginBottom:4}}>Two-Factor Auth</div>
                <div style={{fontSize:13,color:t.textMuted}}>Enter the 6-digit code from your authenticator app</div>
              </div>
              <div style={{display:"flex",gap:8,marginBottom:16,justifyContent:"center"}}>
                {code.map((d,i) => (
                  <input key={i} ref={el=>refs.current[i]=el} value={d} onChange={e=>mfaKey(i,e.target.value)} onKeyDown={e=>{if(e.key==="Backspace"&&!code[i]&&i>0)refs.current[i-1]?.focus();}} maxLength={1}
                    style={{width:46,height:54,textAlign:"center",fontSize:22,fontWeight:800,borderRadius:10,border:`2px solid ${d?t.purpleBorder:t.inputBorder}`,background:t.inputBg,color:t.text,outline:"none",fontFamily:"'Syne',sans-serif",transition:"border-color .15s"}}
                    onFocus={e=>e.target.style.borderColor=t.purple} onBlur={e=>e.target.style.borderColor=d?t.purpleBorder:t.inputBorder}/>
                ))}
              </div>
              <div style={{textAlign:"center",marginBottom:14,padding:"8px 12px",background:t.goldGlow,border:`1px solid ${t.goldBorder}`,borderRadius:8}}>
                <span style={{fontSize:12,color:t.gold}}>Demo: enter any 6 digits — e.g. <strong>123456</strong></span>
              </div>
              {err && <div style={{color:t.red,fontSize:13,marginBottom:12,padding:"8px 12px",background:t.redGlow,border:`1px solid ${t.redBorder}`,borderRadius:8}}>{err}</div>}
              <button onClick={doMFA} disabled={loading}
                style={{width:"100%",padding:"12px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${t.gold}bb,${t.purple})`,color:"#fff",fontSize:14,fontWeight:700,cursor:loading?"wait":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                {loading ? <div style={{width:18,height:18,borderRadius:"50%",border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",animation:"spin .7s linear infinite"}}/> : <><Ic n="check" s={14} c="#fff"/>Verify & Enter Platform</>}
              </button>
              <button onClick={()=>{setStep("login");setErr("");setCode(["","","","","",""]);}} style={{width:"100%",marginTop:10,padding:"8px",background:"none",border:"none",cursor:"pointer",color:t.textMuted,fontSize:13,fontFamily:"inherit"}}>← Back to login</button>
            </div>
          )}
        </Crd>
      </div>
    </div>
  );
};

// ── COMMAND CENTER ───────────────────────────────────────────────
const CommandCenter = ({t, role, user}) => {
  const myThreats = role==="influencer" ? THREATS.filter(th=>th.iId===user.iId) : THREATS;
  const active = myThreats.filter(x=>!["dismissed","takedown_filed"].includes(x.status));
  const pendingTd = TAKEDOWNS.filter(x=>x.status==="awaiting_review").length;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:22}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontSize:26,fontWeight:800,color:t.text,margin:"0 0 4px",letterSpacing:-1,fontFamily:"'Syne',sans-serif"}}>
            {role==="influencer" ? "My Protection Dashboard" : "SOC Command Center"}
          </h1>
          <div style={{color:t.textMuted,fontSize:13,display:"flex",alignItems:"center",gap:8}}>
            <Pulse c={t.green}/>
            {role==="influencer"
              ? `Monitoring ${INFLUENCERS.find(i=>i.id===user.iId)?.handle} · ${INFLUENCERS.find(i=>i.id===user.iId)?.platforms.length} platforms`
              : `${INFLUENCERS.length} influencer tenants · ${AGENTS.filter(a=>a.status==="active").length} agents active`}
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn t={t} v="outline" icon="download" sz="sm">Export</Btn>
          <Btn t={t} v="gold" icon="radar" sz="sm">Run Scan</Btn>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:14}}>
        <StatCrd icon="alert" label="Active Threats" value={active.length} sub={`${myThreats.filter(x=>x.severity==="critical").length} critical`} v="red" t={t}/>
        <StatCrd icon="radar" label="Scans Today" value={role==="influencer"?"1,204":"18.8K"} sub="Across all platforms" v="purple" t={t}/>
        <StatCrd icon="flag" label="Takedowns Filed" value={role==="influencer"?"7":"34"} sub="5 resolved this week" v="gold" t={t}/>
        <StatCrd icon="check" label="Total Resolved" value={role==="influencer"?INFLUENCERS.find(i=>i.id===user.iId)?.resolved||0:INFLUENCERS.reduce((s,i)=>s+i.resolved,0)} sub="All-time" v="green" t={t}/>
      </div>

      {role!=="influencer" && pendingTd > 0 && (
        <Crd t={t} danger style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
          <div style={{width:40,height:40,borderRadius:10,background:t.redGlow,border:`1px solid ${t.redBorder}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Ic n="lock" s={20} c={t.red}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,color:t.red,fontSize:14}}>HITL Gate — {pendingTd} takedown(s) awaiting analyst authorisation</div>
            <div style={{fontSize:13,color:t.textMuted,marginTop:2}}>ARBITER is on standby. No takedown submits without SOC analyst sign-off.</div>
          </div>
          <Btn t={t} v="danger" sz="sm">Review Queue</Btn>
        </Crd>
      )}

      <Crd t={t}>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${t.divider}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Ic n="target" s={18} c={t.gold}/>
            <span style={{fontWeight:700,color:t.text,fontSize:15}}>IOI Alert Feed</span>
            <Bdg label={`${active.filter(x=>x.status==="pending_review").length} PENDING`} v="orange" t={t}/>
          </div>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["Threat Account","Platform","IOI Indicators","OCI Score","Severity","Status","Detected"].map(h=><TH key={h} t={t}>{h}</TH>)}</tr></thead>
            <tbody>
              {myThreats.slice(0,6).map(th => (
                <tr key={th.id} style={{transition:"background .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=t.mode==="dark"?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.01)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <TD t={t}><div style={{fontWeight:700,color:t.text,fontSize:13}}>{th.fake}</div><div style={{fontSize:11,color:t.textMuted}}>{th.ttps}</div></TD>
                  <TD t={t}><Bdg label={th.platform} v="muted" t={t}/></TD>
                  <TD t={t}><div style={{display:"flex",flexWrap:"wrap",gap:3}}>{th.ioi.slice(0,2).map(x=><Bdg key={x} label={x.replace(/_/g," ")} v="purple" t={t}/>)}{th.ioi.length>2&&<Bdg label={`+${th.ioi.length-2}`} v="muted" t={t}/>}</div></TD>
                  <TD t={t}><Ring score={th.ociScore} size={42} t={t}/></TD>
                  <TD t={t}><SevBdg sev={th.severity} t={t}/></TD>
                  <TD t={t}><StsBdg sts={th.status} t={t}/></TD>
                  <TD t={t}><span style={{color:t.textMuted,fontSize:12}}>{th.detected}</span></TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Crd>

      {role !== "influencer" && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:14}}>
          {[{p:"instagram",s:8421,a:18},{p:"tiktok",s:6203,a:22},{p:"youtube",s:2104,a:5},{p:"twitter",s:3891,a:6}].map(x => (
            <Crd key={x.p} t={t} style={{padding:"18px 20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontWeight:700,color:t.text,fontSize:14,textTransform:"capitalize"}}>{x.p}</div>
                <Pulse c={t.green} sz={9}/>
              </div>
              <div style={{fontSize:11,color:t.textMuted,marginBottom:4}}>SCANS TODAY</div>
              <div style={{fontSize:22,fontWeight:800,color:t.text,marginBottom:12}}>{x.s.toLocaleString()}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:12,color:t.textMuted}}>Threats</span>
                <Bdg label={x.a.toString()} v="red" t={t}/>
              </div>
            </Crd>
          ))}
        </div>
      )}
    </div>
  );
};

// ── THREAT INTEL ─────────────────────────────────────────────────
const ThreatIntel = ({t, role, user}) => {
  const [sel, setSel] = useState(null);
  const [filter, setFilter] = useState("all");
  const myThreats = role==="influencer" ? THREATS.filter(th=>th.iId===user.iId) : THREATS;
  const filtered = filter==="all" ? myThreats : myThreats.filter(x=>x.severity===filter||x.status===filter);

  if (sel) {
    const th = sel;
    const inf = INFLUENCERS.find(i=>i.id===th.iId);
    return (
      <div style={{display:"flex",flexDirection:"column",gap:20,animation:"fadeUp .3s ease-out"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <BackBtn onClick={()=>setSel(null)} t={t}/>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:t.text}}>IOI Detail Report</div>
          <SevBdg sev={th.severity} t={t}/><StsBdg sts={th.status} t={t}/>
        </div>
        <Crd t={t} danger style={{padding:"14px 18px",display:"flex",gap:12}}>
          <Ic n="lock" s={18} c={t.red}/>
          <div><div style={{fontWeight:700,color:t.red,fontSize:14,marginBottom:2}}>HITL Active</div><div style={{fontSize:13,color:t.textMuted}}>ARBITER cannot submit takedowns autonomously. Use Takedown Queue to initiate a human-reviewed submission.</div></div>
        </Crd>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <Crd t={t} danger style={{padding:20}}>
            <div style={{fontSize:11,fontWeight:700,color:t.red,letterSpacing:.5,marginBottom:12}}>⚠ THREAT ACCOUNT</div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
              <div style={{width:52,height:52,borderRadius:"50%",background:`linear-gradient(135deg,${t.red}66,${t.red}33)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#fff",border:`2px solid ${t.redBorder}`,flexShrink:0}}>?</div>
              <div><div style={{fontWeight:800,color:t.text,fontSize:16}}>{th.fake}</div><div style={{color:t.red,fontSize:12,marginTop:2}}>{th.fakeDisplay}</div></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13}}>
              {[["Platform",th.platform],["Type",th.type],["Posts",th.posts],["Followers",th.followers]].map(([l,v])=>(
                <div key={l}><div style={{color:t.textMuted,fontSize:11}}>{l.toUpperCase()}</div><div style={{color:t.text,fontWeight:600,fontSize:12}}>{v}</div></div>
              ))}
            </div>
            <div style={{marginTop:12}}><div style={{color:t.textMuted,fontSize:11,marginBottom:3}}>TTPs OBSERVED</div><div style={{color:t.red,fontWeight:700,fontSize:13}}>{th.ttps}</div></div>
          </Crd>
          <Crd t={t} glow style={{padding:20}}>
            <div style={{fontSize:11,fontWeight:700,color:t.gold,letterSpacing:.5,marginBottom:12}}>✓ PROTECTED INFLUENCER</div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}><Av initials={inf?.initials} color={inf?.color} size={52} t={t}/><div><div style={{fontWeight:800,color:t.text,fontSize:16}}>{inf?.name}</div><div style={{color:t.gold,fontSize:12,marginTop:2}}>{inf?.handle}</div></div></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[["Followers",inf?.followers],["Tier",inf?.tier]].map(([l,v])=>(
                <div key={l}><div style={{color:t.textMuted,fontSize:11}}>{l.toUpperCase()}</div><div style={{color:t.text,fontWeight:600,fontSize:13}}>{v}</div></div>
              ))}
            </div>
          </Crd>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:16}}>
          <Crd t={t} style={{padding:20,minWidth:160}}>
            <div style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:.5,marginBottom:16}}>OCI SCORE</div>
            <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Ring score={th.ociScore} size={80} t={t}/></div>
            <div style={{textAlign:"center",fontSize:12,color:t.textMuted}}>{th.ociScore>=85?"High confidence match":th.ociScore>=70?"Likely match":"Possible match"}</div>
          </Crd>
          <Crd t={t} style={{padding:20}}>
            <div style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:.5,marginBottom:12}}>INDICATORS OF IMPERSONATION (IOI)</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {th.ioi.map(i=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:t.redGlow,border:`1px solid ${t.redBorder}`,borderRadius:8}}>
                  <Ic n="alert" s={14} c={t.red}/><span style={{color:t.text,fontSize:13,fontWeight:600}}>{i.replace(/_/g," ")}</span>
                </div>
              ))}
            </div>
          </Crd>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <Crd t={t} style={{padding:20}}>
            <div style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:.5,marginBottom:12}}>THREAT ACTOR (NEXUS)</div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{width:38,height:38,borderRadius:10,background:t.purpleGlow,border:`1px solid ${t.purpleBorder}`,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="target" s={18} c={t.purple}/></div>
              <div><div style={{fontWeight:800,color:t.text,fontSize:15}}>{th.actor}</div><div style={{fontSize:12,color:t.textMuted}}>NEXUS Attribution</div></div>
            </div>
            <div style={{fontSize:12,color:t.textMuted,padding:"8px 12px",background:t.purpleGlow,borderRadius:8,border:`1px solid ${t.purpleBorder}`}}>
              Linked to {THREATS.filter(x=>x.actor===th.actor).length} threat account(s) across platforms.
            </div>
          </Crd>
          <Crd t={t} style={{padding:20}}>
            <div style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:.5,marginBottom:12}}>ANALYST ACTIONS</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <Btn t={t} v="danger" full icon="flag">Initiate Takedown (HITL)</Btn>
              <Btn t={t} v="primary" full icon="fingerprint">VERITAS Likeness Scan</Btn>
              <Btn t={t} v="outline" full icon="copy">Copy Evidence Bundle</Btn>
              <Btn t={t} v="ghost" full icon="x">Dismiss Threat</Btn>
            </div>
          </Crd>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontSize:26,fontWeight:800,color:t.text,margin:"0 0 4px",letterSpacing:-1,fontFamily:"'Syne',sans-serif"}}>Threat Intelligence</h1>
          <div style={{fontSize:13,color:t.textMuted}}>IOI Feed · Actor Registry · Attribution Analysis</div>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {["all","critical","high","medium","pending_review"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${filter===f?t.purpleBorder:t.cardBorder}`,background:filter===f?t.purpleGlow:"none",color:filter===f?t.purpleBright:t.textMuted,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit"}}>
              {f.replace(/_/g," ").toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.map(th => {
          const inf = INFLUENCERS.find(i=>i.id===th.iId);
          return (
            <Crd key={th.id} t={t} onClick={()=>setSel(th)} style={{padding:"16px 20px"}}>
              <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                <Ring score={th.ociScore} size={48} t={t}/>
                <div style={{flex:1,minWidth:180}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                    <span style={{fontWeight:800,color:t.text,fontSize:15}}>{th.fake}</span>
                    <Bdg label={th.platform} v="muted" t={t}/>
                    <SevBdg sev={th.severity} t={t}/>
                  </div>
                  <div style={{fontSize:12,color:t.textMuted}}>{th.ttps} · Actor {th.actor} · {th.detected}</div>
                </div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{th.ioi.slice(0,2).map(x=><Bdg key={x} label={x.replace(/_/g," ")} v="purple" t={t}/>)}</div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <Av initials={inf?.initials} color={inf?.color} size={28} t={t}/>
                  <StsBdg sts={th.status} t={t}/>
                  <Ic n="chevronR" s={16} c={t.textMuted}/>
                </div>
              </div>
            </Crd>
          );
        })}
        {filtered.length===0 && <div style={{textAlign:"center",padding:60,color:t.textMuted}}><div style={{fontSize:36,marginBottom:12}}>🔍</div><div>No threats match this filter</div></div>}
      </div>
    </div>
  );
};

// ── OCI VAULT ────────────────────────────────────────────────────
const OCIVault = ({t, role, user}) => {
  const [tab, setTab] = useState("vault");
  const profiles = role==="influencer" ? OCI_PROFILES.filter(p=>p.iId===user.iId) : OCI_PROFILES;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontSize:26,fontWeight:800,color:t.text,margin:"0 0 4px",letterSpacing:-1,fontFamily:"'Syne',sans-serif"}}>OCI Likeness Vault</h1>
          <div style={{fontSize:13,color:t.textMuted}}>Biometric Identity Vectors · Perceptual Fingerprints · Clone Detection</div>
        </div>
        <Btn t={t} v="gold" icon="upload">Capture Profile</Btn>
      </div>

      <Crd t={t} style={{padding:"14px 18px",display:"flex",alignItems:"flex-start",gap:12}}>
        <Ic n="info" s={18} c={t.gold}/>
        <div>
          <div style={{fontWeight:700,color:t.goldBright,fontSize:14,marginBottom:3}}>OCI Verification — How It Works</div>
          <div style={{fontSize:13,color:t.textMuted,lineHeight:1.65}}>The OCI Likeness Vault stores perceptual fingerprints of verified influencer profile images. VERITAS Vision compares inbound account imagery using pHash, dHash, and CLIP embeddings — detecting avatar cloning, deepfake derivatives, and likeness theft even when attackers modify or re-watermark images. Used for OCI (On-Chain Identity) verification across platforms.</div>
        </div>
      </Crd>

      <div style={{display:"flex",gap:4}}>
        {["vault","clones","scan"].map(tb=>(
          <button key={tb} onClick={()=>setTab(tb)} style={{padding:"8px 18px",borderRadius:8,border:`1px solid ${tab===tb?t.purpleBorder:t.cardBorder}`,background:tab===tb?t.purpleGlow:"none",color:tab===tb?t.purpleBright:t.textMuted,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit"}}>
            {tb==="vault"?"Likeness Vault":tb==="clones"?"Detected Clones":"Run Scan"}
          </button>
        ))}
      </div>

      {tab==="vault" && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(285px,1fr))",gap:14}}>
          {profiles.filter(p=>!p.isClone).map(p => (
            <Crd key={p.id} t={t} style={{padding:20}}>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
                <div style={{position:"relative"}}>
                  <div style={{width:60,height:60,borderRadius:"50%",background:`radial-gradient(ellipse at 30% 30%,${p.color}dd,${p.color}55)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color:"#fff",border:`2.5px solid ${p.color}88`,boxShadow:`0 4px 20px ${p.color}40`}}>{p.initials}</div>
                  {p.verified && <div style={{position:"absolute",bottom:-1,right:-1,width:18,height:18,borderRadius:"50%",background:t.blue,border:`2px solid ${t.card}`,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="check" s={9} c="#fff"/></div>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,color:t.text,fontSize:15}}>{p.influencer}</div>
                  <div style={{color:t.textMuted,fontSize:12}}>{p.handle} · {p.platform}</div>
                  <div style={{color:t.textMuted,fontSize:11}}>{p.followers} followers</div>
                </div>
              </div>
              <div style={{fontSize:11,background:t.mode==="dark"?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)",border:`1px solid ${t.cardBorder}`,borderRadius:8,padding:"10px 12px"}}>
                <div style={{marginBottom:3}}><span style={{color:t.textDim}}>VECTOR ID: </span><span style={{color:t.purpleBright,fontFamily:"monospace"}}>{p.vectorId}</span></div>
                <div style={{marginBottom:3}}><span style={{color:t.textDim}}>FINGERPRINT: </span><span style={{color:t.text,fontFamily:"monospace",fontSize:10}}>{p.fingerprint}</span></div>
                <div><span style={{color:t.textDim}}>CAPTURED: </span><span style={{color:t.text}}>{p.captured}</span></div>
              </div>
              <div style={{marginTop:12,display:"flex",gap:8}}>
                <Btn t={t} v="outline" sz="sm" icon="radar" full>Compare</Btn>
                <Btn t={t} v="ghost" sz="sm" icon="download">Export</Btn>
              </div>
            </Crd>
          ))}
        </div>
      )}

      {tab==="clones" && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {(role==="influencer" ? profiles : OCI_PROFILES).filter(p=>p.isClone).map(p => (
            <Crd key={p.id} t={t} danger style={{padding:18}}>
              <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                <div style={{position:"relative"}}>
                  <div style={{width:54,height:54,borderRadius:"50%",background:`radial-gradient(${t.red}66,${t.red}33)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#fff",border:`2px solid ${t.redBorder}`}}>{p.initials}</div>
                  <div style={{position:"absolute",top:-3,right:-3,width:18,height:18,borderRadius:"50%",background:t.red,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="alert" s={9} c="#fff"/></div>
                </div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}><span style={{fontWeight:800,color:t.text,fontSize:15}}>{p.handle}</span><Bdg label={`${p.similarity}% MATCH`} v="red" t={t}/></div>
                  <div style={{fontSize:12,color:t.textMuted}}>{p.influencer} · {p.platform} · Captured {p.captured}</div>
                  <div style={{fontFamily:"monospace",fontSize:10,color:t.red,marginTop:3}}>{p.fingerprint}</div>
                </div>
                <Ring score={p.similarity} size={48} t={t}/>
                <div style={{display:"flex",gap:8}}><Btn t={t} v="danger" sz="sm" icon="flag">Takedown</Btn><Btn t={t} v="outline" sz="sm">View Threat</Btn></div>
              </div>
            </Crd>
          ))}
          {(role==="influencer" ? profiles : OCI_PROFILES).filter(p=>p.isClone).length===0 && (
            <div style={{textAlign:"center",padding:60,color:t.green}}><div style={{fontSize:40,marginBottom:12}}>✓</div><div style={{fontWeight:700}}>No clones detected</div></div>
          )}
        </div>
      )}

      {tab==="scan" && (
        <Crd t={t} style={{padding:40,textAlign:"center"}}>
          <div style={{width:80,height:80,borderRadius:"50%",background:t.purpleGlow,border:`1px solid ${t.purpleBorder}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><Ic n="fingerprint" s={36} c={t.purple}/></div>
          <div style={{fontSize:20,fontWeight:800,color:t.text,marginBottom:8}}>Run VERITAS Likeness Scan</div>
          <div style={{fontSize:14,color:t.textMuted,maxWidth:420,margin:"0 auto 24px",lineHeight:1.65}}>VERITAS Vision will compare all registered OCI profiles against live platform data and flag matches with similarity ≥ 60% for analyst review. Results feed directly into the Threat Intel module.</div>
          <Btn t={t} v="gold" sz="lg" icon="radar">Launch VERITAS Scan</Btn>
          <div style={{marginTop:20,padding:"12px 16px",background:t.goldGlow,border:`1px solid ${t.goldBorder}`,borderRadius:10,fontSize:13,color:t.gold}}>
            Last scan: 4h ago · {OCI_PROFILES.filter(p=>p.isClone).length} clones found
          </div>
        </Crd>
      )}
    </div>
  );
};

// ── AGENT OPS ────────────────────────────────────────────────────
const AgentOps = ({t}) => {
  const [sel, setSel] = useState(null);
  const typeColor = {SENTINEL:t.blue,RECON:t.purple,VERITAS:t.gold,NEXUS:t.orange,ARBITER:t.red,WATCHDOG:t.green};
  const typeIcon  = {SENTINEL:"radar",RECON:"eye",VERITAS:"fingerprint",NEXUS:"layers",ARBITER:"lock",WATCHDOG:"shield"};
  const typeBadge = {SENTINEL:"blue",RECON:"purple",VERITAS:"gold",NEXUS:"orange",ARBITER:"red",WATCHDOG:"green"};

  if (sel) {
    const ag = sel;
    return (
      <div style={{display:"flex",flexDirection:"column",gap:20,animation:"fadeUp .3s ease-out"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <BackBtn onClick={()=>setSel(null)} t={t}/>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:t.text}}>{ag.name}</div>
          <Bdg label={ag.type} v={typeBadge[ag.type]} t={t}/>
          <Bdg label={ag.status==="active"?"ACTIVE":ag.status==="standby"?"STANDBY":"PAUSED"} v={ag.status==="active"?"green":ag.status==="standby"?"blue":"red"} dot t={t}/>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"200px 1fr",gap:16}}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <StatCrd icon="activity" label="Tasks Today" value={ag.tasks.toLocaleString()} v="purple" t={t}/>
            <StatCrd icon="cpu" label="CPU" value={`${ag.cpu}%`} v={ag.cpu>60?"red":"green"} t={t}/>
            <StatCrd icon="database" label="Memory" value={`${ag.mem}%`} v={ag.mem>70?"orange":"green"} t={t}/>
            <StatCrd icon="alert" label="Alerts Raised" value={ag.alerts} v="gold" t={t}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Crd t={t} style={{padding:20}}>
              <div style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:.5,marginBottom:10}}>AGENT DESCRIPTION</div>
              <div style={{fontSize:14,color:t.text,lineHeight:1.75}}>{ag.desc}</div>
            </Crd>
            <Crd t={t} style={{padding:20}}>
              <div style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:.5,marginBottom:10}}>APPROVED SCOPES</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:ag.blockedScope?14:0}}>{ag.scope.map(s=><Bdg key={s} label={s} v="green" t={t}/>)}</div>
              {ag.blockedScope && <>
                <div style={{fontSize:11,fontWeight:700,color:t.red,letterSpacing:.5,marginBottom:8}}>BLOCKED — REQUIRES HUMAN AUTHORISATION</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{ag.blockedScope.map(s=><Bdg key={s} label={s} v="red" t={t}/>)}</div>
              </>}
            </Crd>
            {ag.type==="ARBITER" && (
              <Crd t={t} danger style={{padding:18}}>
                <div style={{display:"flex",gap:12}}>
                  <Ic n="lock" s={20} c={t.red}/>
                  <div>
                    <div style={{fontWeight:700,color:t.red,fontSize:14,marginBottom:4}}>HUMAN-IN-THE-LOOP — PERMANENTLY ENFORCED</div>
                    <div style={{fontSize:13,color:t.textMuted,lineHeight:1.65}}>ARBITER cannot submit any takedown request without explicit authorisation from a credentialled SOC Analyst. All pending requests queue in the Takedown Queue module. This restriction cannot be overridden by any agent, process, or API call. Every action is audit-logged and attributed to the authorising analyst.</div>
                  </div>
                </div>
              </Crd>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div>
        <h1 style={{fontSize:26,fontWeight:800,color:t.text,margin:"0 0 4px",letterSpacing:-1,fontFamily:"'Syne',sans-serif"}}>Agent Operations</h1>
        <div style={{fontSize:13,color:t.textMuted}}>SENTINEL · RECON · VERITAS · NEXUS · ARBITER · WATCHDOG</div>
      </div>
      <Crd t={t} danger style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
        <Ic n="lock" s={18} c={t.red}/>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,color:t.red,fontSize:14}}>ARBITER — Standby · HITL Gate Active</div>
          <div style={{fontSize:12,color:t.textMuted}}>{TAKEDOWNS.filter(x=>x.status==="awaiting_review").length} takedown package(s) queued · No submission until SOC Analyst sign-off</div>
        </div>
        <Bdg label="HITL ENFORCED" v="red" t={t}/>
      </Crd>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {AGENTS.map(ag => (
          <Crd key={ag.id} t={t} onClick={()=>setSel(ag)} style={{padding:"18px 20px"}}>
            <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
              <div style={{width:44,height:44,borderRadius:12,background:typeColor[ag.type]+"22",border:`1px solid ${typeColor[ag.type]}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Ic n={typeIcon[ag.type]} s={20} c={typeColor[ag.type]}/>
              </div>
              <div style={{minWidth:170}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                  <span style={{fontWeight:700,color:t.text,fontSize:14}}>{ag.name}</span>
                  <Bdg label={ag.type} v={typeBadge[ag.type]} t={t}/>
                </div>
                <div style={{fontSize:12,color:t.textMuted}}>ID: {ag.id} · Ping: {ag.ping} · Alerts: {ag.alerts}</div>
              </div>
              <div style={{flex:1,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(90px,1fr))",gap:12}}>
                <div><div style={{fontSize:11,color:t.textMuted,marginBottom:4}}>CPU</div><Bar val={ag.cpu} t={t}/><div style={{fontSize:11,color:t.text,marginTop:2}}>{ag.cpu}%</div></div>
                <div><div style={{fontSize:11,color:t.textMuted,marginBottom:4}}>MEM</div><Bar val={ag.mem} t={t}/><div style={{fontSize:11,color:t.text,marginTop:2}}>{ag.mem}%</div></div>
                <div><div style={{fontSize:11,color:t.textMuted}}>TASKS</div><div style={{fontSize:15,fontWeight:700,color:t.text}}>{ag.tasks.toLocaleString()}</div></div>
                <div><div style={{fontSize:11,color:t.textMuted}}>SCAN RATE</div><div style={{fontSize:12,fontWeight:600,color:t.text}}>{ag.scanRate}</div></div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <Bdg label={ag.status==="active"?"ACTIVE":ag.status==="standby"?"STANDBY":"PAUSED"} v={ag.status==="active"?"green":ag.status==="standby"?"blue":"red"} dot t={t}/>
                {!ag.approved && <Bdg label="HITL GATE" v="red" t={t}/>}
                <Ic n="chevronR" s={16} c={t.textMuted}/>
              </div>
            </div>
          </Crd>
        ))}
      </div>
    </div>
  );
};

// ── TAKEDOWN QUEUE ───────────────────────────────────────────────
const TakedownQueue = ({t, role}) => {
  const [tds, setTds] = useState(TAKEDOWNS);
  const [sel, setSel] = useState(null);
  const [notes, setNotes] = useState("");
  const [confirm, setConfirm] = useState(false);

  const authorise = (id) => {
    setTds(prev => prev.map(x => x.id===id ? {...x,status:"filed",analyst:"James Okonkwo",filedAt:new Date().toISOString().slice(0,16).replace("T"," ")} : x));
    setSel(null); setNotes(""); setConfirm(false);
  };
  const dismiss = (id) => {
    setTds(prev => prev.map(x => x.id===id ? {...x,status:"dismissed"} : x));
    setSel(null); setConfirm(false);
  };

  if (sel) {
    const td = tds.find(x=>x.id===sel.id) || sel;
    const done = td.status==="filed" || td.status==="dismissed";
    return (
      <div style={{display:"flex",flexDirection:"column",gap:20,animation:"fadeUp .3s ease-out"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <BackBtn onClick={()=>{setSel(null);setConfirm(false);}} t={t}/>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:t.text}}>Takedown Review</div>
          <Bdg label={td.reportType.replace(/_/g," ")} v="purple" t={t}/>
          <StsBdg sts={td.status} t={t}/>
        </div>

        <Crd t={t} danger style={{padding:"16px 20px"}}>
          <div style={{display:"flex",gap:12}}>
            <Ic n="lock" s={20} c={t.red}/>
            <div>
              <div style={{fontWeight:700,color:t.red,fontSize:14,marginBottom:4}}>HUMAN-IN-THE-LOOP CHECKPOINT</div>
              <div style={{fontSize:13,color:t.textMuted,lineHeight:1.65}}>ARBITER prepared this package but cannot submit it. Review all evidence, add your analyst assessment, then explicitly authorise. This action is permanently audit-logged and attributed to your account ({role==="admin"?"Maria Chen":"James Okonkwo"}).</div>
            </div>
          </div>
        </Crd>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <Crd t={t} style={{padding:20}}>
            <div style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:.5,marginBottom:14}}>PACKAGE DETAILS</div>
            <div style={{display:"flex",flexDirection:"column",gap:0}}>
              {[["Target Account",td.fake],["Platform",td.platform],["Report Type",td.reportType.replace(/_/g," ")],["OCI Match Score",`${td.ociScore}%`],["Prepared By",`ARBITER (${td.agent})`],["Priority",(td.priority||"high").toUpperCase()],["Influencer",td.influencer]].map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${t.divider}`,fontSize:13}}>
                  <span style={{color:t.textMuted}}>{l}</span><span style={{fontWeight:600,color:t.text}}>{v}</span>
                </div>
              ))}
            </div>
          </Crd>
          <Crd t={t} style={{padding:20}}>
            <div style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:.5,marginBottom:14}}>EVIDENCE BUNDLE ({td.evidence.length} items)</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {td.evidence.map((e,i) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:t.greenGlow,border:`1px solid ${t.greenBorder}`,borderRadius:8}}>
                  <Ic n="check" s={14} c={t.green}/><span style={{fontSize:13,color:t.text}}>{e}</span>
                </div>
              ))}
            </div>
          </Crd>
        </div>

        {!done && (
          <Crd t={t} style={{padding:20}}>
            <div style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:.5,marginBottom:10}}>ANALYST ASSESSMENT (required)</div>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Add your assessment, additional findings, or caveats before authorising..."
              style={{width:"100%",minHeight:90,padding:12,borderRadius:8,border:`1px solid ${t.inputBorder}`,background:t.inputBg,color:t.text,fontSize:13,outline:"none",fontFamily:"inherit",resize:"vertical",boxSizing:"border-box",lineHeight:1.6,transition:"border-color .15s"}}
              onFocus={e=>e.target.style.borderColor=t.purple} onBlur={e=>e.target.style.borderColor=t.inputBorder}/>
          </Crd>
        )}

        {done ? (
          <Crd t={t} style={{padding:24,textAlign:"center"}}>
            <div style={{fontSize:20,marginBottom:8}}>{td.status==="filed"?"✅":"❌"}</div>
            <div style={{color:td.status==="filed"?t.green:t.textMuted,fontWeight:700,fontSize:16}}>{td.status==="filed"?"Takedown submitted successfully":"Dismissed"}</div>
            {td.filedAt && <div style={{color:t.textMuted,fontSize:13,marginTop:6}}>Filed {td.filedAt} · Analyst: {td.analyst}</div>}
          </Crd>
        ) : !confirm ? (
          <div style={{display:"flex",gap:10}}>
            <Btn t={t} v="success" sz="lg" icon="check" onClick={()=>setConfirm(true)} full>Authorise & Submit Takedown</Btn>
            <Btn t={t} v="outline" sz="lg" icon="x" onClick={()=>dismiss(td.id)}>Dismiss</Btn>
          </div>
        ) : (
          <Crd t={t} danger style={{padding:22}}>
            <div style={{fontWeight:700,color:t.red,fontSize:17,marginBottom:8}}>⚠ Final Confirmation</div>
            <div style={{color:t.textMuted,fontSize:13,marginBottom:18,lineHeight:1.65}}>You are authorising ARBITER to submit a <strong style={{color:t.text}}>{td.reportType.replace(/_/g," ")}</strong> to <strong style={{color:t.text}}>{td.platform}</strong> against <strong style={{color:t.text}}>{td.fake}</strong>. This is irreversible and will be permanently logged.</div>
            <div style={{display:"flex",gap:10}}>
              <Btn t={t} v="danger" sz="lg" icon="flag" onClick={()=>authorise(td.id)} full>CONFIRM — Authorise Takedown</Btn>
              <Btn t={t} v="outline" sz="lg" onClick={()=>setConfirm(false)}>Cancel</Btn>
            </div>
          </Crd>
        )}
      </div>
    );
  }

  const pending = tds.filter(x=>x.status==="awaiting_review"||x.status==="under_review");
  const done = tds.filter(x=>x.status==="filed"||x.status==="dismissed");

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontSize:26,fontWeight:800,color:t.text,margin:"0 0 4px",letterSpacing:-1,fontFamily:"'Syne',sans-serif"}}>Takedown Queue</h1>
          <div style={{fontSize:13,color:t.textMuted}}>ARBITER-Prepared · Human Authorisation Required · Audit-Logged</div>
        </div>
        <Bdg label={`${pending.length} AWAITING REVIEW`} v={pending.length>0?"orange":"green"} dot t={t}/>
      </div>

      <Crd t={t} danger style={{padding:"14px 20px",display:"flex",alignItems:"center",gap:12}}>
        <Ic n="lock" s={20} c={t.red}/>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,color:t.red,fontSize:14}}>HITL Gate Active — ARBITER cannot submit without analyst authorisation</div>
          <div style={{fontSize:12,color:t.textMuted}}>All takedown actions require explicit SOC Analyst review and sign-off. No exceptions. No overrides.</div>
        </div>
      </Crd>

      {pending.length > 0 && (
        <div>
          <div style={{fontSize:13,fontWeight:700,color:t.text,marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
            Pending Review <Bdg label={pending.length.toString()} v="orange" t={t}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {pending.map(td => (
              <Crd key={td.id} t={t} onClick={()=>setSel(td)} style={{padding:"18px 20px"}}>
                <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                  <Ring score={td.ociScore} size={50} t={t}/>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,color:t.text,fontSize:15,marginBottom:3}}>{td.fake}</div>
                    <div style={{fontSize:12,color:t.textMuted}}>{td.influencer} · {td.platform} · {td.reportType.replace(/_/g," ")} · {td.agent}</div>
                    <div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}}>{td.evidence.slice(0,2).map(e=><Bdg key={e} label={e} v="muted" t={t}/>)}{td.evidence.length>2&&<Bdg label={`+${td.evidence.length-2} more`} v="muted" t={t}/>}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <StsBdg sts={td.status} t={t}/>
                    <Bdg label={(td.priority||"high").toUpperCase()} v={td.priority==="critical"?"red":"gold"} t={t}/>
                    <Ic n="chevronR" s={16} c={t.textMuted}/>
                  </div>
                </div>
              </Crd>
            ))}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div>
          <div style={{fontSize:13,fontWeight:700,color:t.textMuted,marginBottom:10}}>Completed</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {done.map(td => (
              <Crd key={td.id} t={t} onClick={()=>setSel(td)} style={{padding:"14px 20px",opacity:.8}}>
                <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,color:t.text,fontSize:14}}>{td.fake}</div>
                    <div style={{fontSize:12,color:t.textMuted}}>{td.influencer} · {td.platform}{td.filedAt?` · Filed ${td.filedAt}`:""}</div>
                  </div>
                  <StsBdg sts={td.status} t={t}/><Ic n="chevronR" s={16} c={t.textMuted}/>
                </div>
              </Crd>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── INFLUENCER MANAGEMENT ────────────────────────────────────────
const InfluencerMgmt = ({t}) => {
  const [sel, setSel] = useState(null);

  if (sel) {
    const inf = sel;
    const myThreats = THREATS.filter(x=>x.iId===inf.id);
    return (
      <div style={{display:"flex",flexDirection:"column",gap:20,animation:"fadeUp .3s ease-out"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <BackBtn onClick={()=>setSel(null)} t={t}/>
          <Av initials={inf.initials} color={inf.color} size={40} t={t}/>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:t.text}}>{inf.name}</div>
            <div style={{fontSize:13,color:t.textMuted}}>{inf.handle} · {inf.tier}</div>
          </div>
          <StsBdg sts={inf.status} t={t}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14}}>
          <StatCrd icon="users" label="Followers" value={inf.followers} v="purple" t={t}/>
          <StatCrd icon="alert" label="Threats" value={inf.threats} v="red" t={t}/>
          <StatCrd icon="check" label="Resolved" value={inf.resolved} v="green" t={t}/>
          <StatCrd icon="layers" label="Platforms" value={inf.platforms.length} v="gold" t={t}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <Crd t={t} style={{padding:20}}>
            <div style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:.5,marginBottom:12}}>PROFILE</div>
            <div style={{fontSize:13,color:t.text,lineHeight:1.7,marginBottom:14,padding:"10px 12px",background:t.mode==="dark"?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)",borderRadius:8,border:`1px solid ${t.cardBorder}`}}>{inf.bio}</div>
            {[["Email",inf.email],["Joined",inf.joined],["Tier",inf.tier]].map(([l,v])=>(
              <div key={l} style={{display:"flex",gap:8,marginBottom:7,fontSize:13}}><span style={{color:t.textMuted,minWidth:50}}>{l}:</span><span style={{color:t.text,fontWeight:600}}>{v}</span></div>
            ))}
          </Crd>
          <Crd t={t} style={{padding:20}}>
            <div style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:.5,marginBottom:12}}>MONITORED PLATFORMS</div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
              {inf.platforms.map(p=>(
                <div key={p} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",background:t.mode==="dark"?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)",borderRadius:8,border:`1px solid ${t.cardBorder}`}}>
                  <span style={{fontWeight:600,color:t.text,textTransform:"capitalize",fontSize:13}}>{p}</span>
                  <Pulse c={t.green} sz={8}/>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn t={t} v="outline" full sz="sm" icon="plus">Add Platform</Btn>
            </div>
          </Crd>
        </div>
        {myThreats.length > 0 && (
          <div>
            <div style={{fontSize:14,fontWeight:700,color:t.text,marginBottom:10}}>Recent IOI Alerts ({myThreats.length})</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {myThreats.slice(0,5).map(th=>(
                <div key={th.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:t.card,border:`1px solid ${t.cardBorder}`,borderRadius:10}}>
                  <Ring score={th.ociScore} size={38} t={t}/>
                  <div style={{flex:1}}><div style={{fontWeight:600,color:t.text,fontSize:13}}>{th.fake}</div><div style={{fontSize:11,color:t.textMuted}}>{th.ttps} · {th.platform} · {th.detected}</div></div>
                  <SevBdg sev={th.severity} t={t}/><StsBdg sts={th.status} t={t}/>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontSize:26,fontWeight:800,color:t.text,margin:"0 0 4px",letterSpacing:-1,fontFamily:"'Syne',sans-serif"}}>Influencer Tenants</h1>
          <div style={{fontSize:13,color:t.textMuted}}>Manage registered tenants and monitoring scope</div>
        </div>
        <Btn t={t} v="gold" icon="plus">Add Influencer</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(295px,1fr))",gap:14}}>
        {INFLUENCERS.map(inf => (
          <Crd key={inf.id} t={t} onClick={()=>setSel(inf)} danger={inf.status==="critical"} glow={inf.threats>5&&inf.status!=="critical"}>
            <div style={{padding:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <Av initials={inf.initials} color={inf.color} size={42} t={t}/>
                  <div><div style={{fontWeight:800,color:t.text,fontSize:15}}>{inf.name}</div><div style={{color:t.textMuted,fontSize:12}}>{inf.handle}</div></div>
                </div>
                <StsBdg sts={inf.status} t={t}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
                <div><div style={{fontSize:10,color:t.textMuted,fontWeight:700}}>FOLLOWERS</div><div style={{color:t.text,fontWeight:700,fontSize:14}}>{inf.followers}</div></div>
                <div><div style={{fontSize:10,color:t.textMuted,fontWeight:700}}>THREATS</div><div style={{color:inf.threats>10?t.red:t.text,fontWeight:700,fontSize:14}}>{inf.threats}</div></div>
                <div><div style={{fontSize:10,color:t.textMuted,fontWeight:700}}>TIER</div><div style={{color:t.gold,fontWeight:700,fontSize:14}}>{inf.tier}</div></div>
              </div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
                {inf.platforms.map(p=><Bdg key={p} label={p} v="muted" t={t}/>)}
                <div style={{flex:1}}/><span style={{fontSize:11,color:t.textMuted}}>{inf.joined}</span>
              </div>
            </div>
          </Crd>
        ))}
      </div>
    </div>
  );
};

// ── ACCESS MANAGEMENT ────────────────────────────────────────────
const AccessMgmt = ({t}) => {
  const roleLabel = {admin:"Admin",soc_analyst:"SOC Analyst",influencer:"Influencer",influencer_staff:"Infl. Staff"};
  const roleBadge = {admin:"gold",soc_analyst:"purple",influencer:"blue",influencer_staff:"green"};

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontSize:26,fontWeight:800,color:t.text,margin:"0 0 4px",letterSpacing:-1,fontFamily:"'Syne',sans-serif"}}>Access Management</h1>
          <div style={{fontSize:13,color:t.textMuted}}>RBAC · MFA Enforcement · Module-level Permissions</div>
        </div>
        <Btn t={t} v="gold" icon="plus">Invite User</Btn>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(195px,1fr))",gap:12}}>
        {[
          {role:"Admin",icon:"key",desc:"Full platform access, admin console, agent management",badge:"gold"},
          {role:"SOC Analyst",icon:"shield",desc:"Threat review, OCI vault, takedown authorisation (HITL)",badge:"purple"},
          {role:"Influencer",icon:"users",desc:"Own tenant dashboard, accounts, alerts, takedown status",badge:"blue"},
          {role:"Infl. Staff",icon:"eye",desc:"Read-only access to assigned influencer dashboard",badge:"green"},
        ].map(r=>(
          <Crd key={r.role} t={t} style={{padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><Ic n={r.icon} s={14} c={t.purple}/><Bdg label={r.role} v={r.badge} t={t}/></div>
            <div style={{fontSize:12,color:t.textMuted,lineHeight:1.55}}>{r.desc}</div>
          </Crd>
        ))}
      </div>

      <Crd t={t}>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${t.divider}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
          <span style={{fontWeight:700,color:t.text,fontSize:15}}>Platform Users ({USERS.length})</span>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["User","Role","Email","MFA","Status","Modules","Actions"].map(h=><TH key={h} t={t}>{h}</TH>)}</tr></thead>
            <tbody>
              {USERS.map(u=>(
                <tr key={u.id} style={{transition:"background .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=t.mode==="dark"?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.01)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <TD t={t}><div style={{display:"flex",alignItems:"center",gap:10}}><Av initials={u.name.split(" ").map(n=>n[0]).join("").slice(0,2)} size={32} t={t}/><span style={{fontWeight:600,color:t.text,fontSize:13}}>{u.name}</span></div></TD>
                  <TD t={t}><Bdg label={roleLabel[u.role]||u.role} v={roleBadge[u.role]||"muted"} t={t}/></TD>
                  <TD t={t}><span style={{color:t.textMuted,fontSize:12}}>{u.email}</span></TD>
                  <TD t={t}>{u.mfa?<Bdg label="MFA ON" v="green" t={t}/>:<Bdg label="NO MFA" v="red" t={t}/>}</TD>
                  <TD t={t}><StsBdg sts={u.status} t={t}/></TD>
                  <TD t={t}>{u.modules[0]==="all"?<Bdg label="All Modules" v="gold" t={t}/>:<div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{u.modules.slice(0,2).map(m=><Bdg key={m} label={m.replace(/_/g," ")} v="muted" t={t}/>)}{u.modules.length>2&&<Bdg label={`+${u.modules.length-2}`} v="muted" t={t}/>}</div>}</TD>
                  <TD t={t}><div style={{display:"flex",gap:6}}><Btn t={t} v="outline" sz="sm">Edit</Btn><Btn t={t} v="ghost" sz="sm">Revoke</Btn></div></TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Crd>
    </div>
  );
};

// ── KNOWLEDGE BASE ───────────────────────────────────────────────
const KnowledgeBase = ({t}) => {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const cats = ["All", ...[...new Set(KB.map(a=>a.cat))]];
  const filtered = KB.filter(a =>
    (cat==="All" || a.cat===cat) &&
    (q==="" || a.title.toLowerCase().includes(q.toLowerCase()) || a.tags.some(tg=>tg.includes(q.toLowerCase())))
  );
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div>
        <h1 style={{fontSize:26,fontWeight:800,color:t.text,margin:"0 0 4px",letterSpacing:-1,fontFamily:"'Syne',sans-serif"}}>Knowledge Base</h1>
        <div style={{fontSize:13,color:t.textMuted}}>Guides, protocols, and reference documentation</div>
      </div>
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:220}}><Inp value={q} onChange={e=>setQ(e.target.value)} placeholder="Search articles, tags..." icon="search" t={t}/></div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {cats.map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{padding:"8px 13px",borderRadius:8,border:`1px solid ${cat===c?t.purpleBorder:t.cardBorder}`,background:cat===c?t.purpleGlow:"none",color:cat===c?t.purpleBright:t.textMuted,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit"}}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
        {filtered.map(a=>(
          <Crd key={a.id} t={t} onClick={()=>{}} style={{padding:18}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span style={{fontSize:18}}>{a.icon}</span>
              <Bdg label={a.cat} v="purple" t={t}/>
            </div>
            <div style={{fontWeight:700,color:t.text,fontSize:14,lineHeight:1.4,marginBottom:10}}>{a.title}</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
              {a.tags.map(tg=><Bdg key={tg} label={tg} v="muted" t={t}/>)}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",color:t.textMuted,fontSize:11}}>
              <span>{a.views.toLocaleString()} views</span>
              <span>Updated {a.updated}</span>
            </div>
          </Crd>
        ))}
        {filtered.length===0 && (
          <div style={{gridColumn:"1/-1",textAlign:"center",padding:60,color:t.textMuted}}>
            <div style={{fontSize:40,marginBottom:12}}>🔍</div>
            <div>No articles match your search</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── ADMIN CONSOLE ────────────────────────────────────────────────
const AdminConsole = ({t}) => {
  const [tab, setTab] = useState("overview");

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div>
        <h1 style={{fontSize:26,fontWeight:800,color:t.text,margin:"0 0 4px",letterSpacing:-1,fontFamily:"'Syne',sans-serif"}}>Admin Console</h1>
        <div style={{fontSize:13,color:t.textMuted}}>System health · Licenses · Database · Configuration</div>
      </div>

      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
        {["overview","licenses","database","settings"].map(tb=>(
          <button key={tb} onClick={()=>setTab(tb)} style={{padding:"8px 18px",borderRadius:8,border:`1px solid ${tab===tb?t.goldBorder:t.cardBorder}`,background:tab===tb?t.goldGlow:"none",color:tab===tb?t.goldBright:t.textMuted,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit",textTransform:"capitalize"}}>
            {tb}
          </button>
        ))}
      </div>

      {tab==="overview" && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(165px,1fr))",gap:14}}>
            <StatCrd icon="users" label="Total Tenants" value={INFLUENCERS.length} sub="1 critical alert" v="purple" t={t}/>
            <StatCrd icon="bot" label="Active Agents" value={AGENTS.filter(a=>a.status==="active").length} sub="1 standby (ARBITER)" v="gold" t={t}/>
            <StatCrd icon="database" label="DB Health" value="99.8%" sub="0 failed queries" v="green" t={t}/>
            <StatCrd icon="activity" label="API Calls Today" value="142K" sub="↑12% vs yesterday" v="blue" t={t}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <Crd t={t} style={{padding:20}}>
              <div style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:.5,marginBottom:14}}>AGENT HEALTH</div>
              {AGENTS.map(ag=>(
                <div key={ag.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:11}}>
                  <Pulse c={ag.status==="active"?t.green:ag.status==="standby"?t.blue:t.red} sz={7}/>
                  <span style={{fontSize:13,color:t.text,fontWeight:600,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ag.name}</span>
                  <div style={{width:72}}><Bar val={ag.cpu} t={t}/></div>
                  <span style={{fontSize:11,color:t.textMuted,minWidth:32,textAlign:"right"}}>{ag.cpu}%</span>
                </div>
              ))}
            </Crd>
            <Crd t={t} style={{padding:20}}>
              <div style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:.5,marginBottom:14}}>PLATFORM AUDIT LOG</div>
              {[
                {msg:"ARBITER: Takedown package prepared — @zoehart1ey_real",time:"3m",c:t.orange},
                {msg:"WATCHDOG: All agents within approved TTP bounds",time:"1m",c:t.green},
                {msg:"VERITAS: Likeness match 94% — OCI alert raised",time:"5m",c:t.red},
                {msg:"NEXUS: Actor TA-2841 linked to 3 threat accounts",time:"12m",c:t.purple},
                {msg:"SENTINEL-Alpha: 18,821 feeds scanned · 7 alerts",time:"1h",c:t.blue},
                {msg:"WATCHDOG: Agent scope audit passed — no violations",time:"2h",c:t.green},
              ].map((l,i)=>(
                <div key={i} style={{display:"flex",gap:10,marginBottom:8,paddingBottom:8,borderBottom:i<5?`1px solid ${t.divider}`:"none"}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:l.c,marginTop:5,flexShrink:0}}/>
                  <div style={{flex:1,fontSize:12,color:t.text,lineHeight:1.4}}>{l.msg}</div>
                  <div style={{fontSize:11,color:t.textMuted,whiteSpace:"nowrap"}}>{l.time} ago</div>
                </div>
              ))}
            </Crd>
          </div>
        </div>
      )}

      {tab==="licenses" && (
        <Crd t={t}>
          <div style={{padding:"16px 20px",borderBottom:`1px solid ${t.divider}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
            <span style={{fontWeight:700,color:t.text,fontSize:15}}>License Registry</span>
            <Btn t={t} v="gold" icon="plus" sz="sm">Issue License</Btn>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>{["Influencer","Tier","Platforms","Joined","Status","Actions"].map(h=><TH key={h} t={t}>{h}</TH>)}</tr></thead>
              <tbody>
                {INFLUENCERS.map(inf=>(
                  <tr key={inf.id} style={{transition:"background .15s"}}
                    onMouseEnter={e=>e.currentTarget.style.background=t.mode==="dark"?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.01)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <TD t={t}><div style={{display:"flex",alignItems:"center",gap:10}}><Av initials={inf.initials} color={inf.color} size={30} t={t}/><div><div style={{fontWeight:600,color:t.text,fontSize:13}}>{inf.name}</div><div style={{fontSize:11,color:t.textMuted}}>{inf.handle}</div></div></div></TD>
                    <TD t={t}><Bdg label={inf.tier} v={inf.tier==="Enterprise"?"gold":inf.tier==="Pro"?"purple":"muted"} t={t}/></TD>
                    <TD t={t}><span style={{color:t.text,fontSize:13}}>{inf.platforms.length} platforms</span></TD>
                    <TD t={t}><span style={{color:t.textMuted,fontSize:13}}>{inf.joined}</span></TD>
                    <TD t={t}><StsBdg sts={inf.status==="critical"?"warning":"active"} t={t}/></TD>
                    <TD t={t}><div style={{display:"flex",gap:6}}><Btn t={t} v="outline" sz="sm">Manage</Btn><Btn t={t} v="ghost" sz="sm">Revoke</Btn></div></TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Crd>
      )}

      {tab==="database" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {[
            {name:"Threat Intelligence DB",size:"4.2 GB",records:"142,881",health:99.8,rate:"2,341/min",color:t.purple},
            {name:"OCI Likeness Vault",size:"18.7 GB",records:"4,320",health:100,rate:"340/min",color:t.gold},
            {name:"Actor Registry",size:"1.1 GB",records:"891",health:99.9,rate:"180/min",color:t.orange},
            {name:"Audit Log Store",size:"8.4 GB",records:"2.1M",health:100,rate:"continuous",color:t.green},
          ].map(db=>(
            <Crd key={db.name} t={t} style={{padding:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{fontWeight:700,color:t.text,fontSize:14}}>{db.name}</div>
                <Bdg label={`${db.health}%`} v="green" t={t}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14,fontSize:13}}>
                {[["Size",db.size],["Records",db.records],["Health",`${db.health}%`],["Query Rate",db.rate]].map(([l,v])=>(
                  <div key={l}><div style={{color:t.textMuted,fontSize:11}}>{l.toUpperCase()}</div><div style={{color:t.text,fontWeight:600}}>{v}</div></div>
                ))}
              </div>
              <Bar val={db.health} t={t} c={db.color}/>
            </Crd>
          ))}
        </div>
      )}

      {tab==="settings" && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[
            {label:"OCI Similarity Threshold",desc:"Minimum OCI score to raise an IOI alert",value:"60%",editable:true},
            {label:"HITL Enforcement",desc:"Human authorisation required for all ARBITER takedown actions",value:"Enabled (mandatory)",editable:false},
            {label:"MFA Policy",desc:"Require MFA for all platform users",value:"Enforced",editable:false},
            {label:"Data Retention",desc:"Threat intelligence and audit log retention period",value:"365 days",editable:true},
            {label:"Scan Frequency",desc:"Default platform crawl interval for SENTINEL agents",value:"Every 15 min",editable:true},
            {label:"WATCHDOG Alerts",desc:"Notify admins on agent scope violations",value:"Enabled",editable:true},
          ].map(s=>(
            <Crd key={s.label} t={t} style={{padding:"16px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,color:t.text,fontSize:14}}>{s.label}</div>
                <div style={{fontSize:12,color:t.textMuted,marginTop:3}}>{s.desc}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <Bdg label={s.value} v={!s.editable?"red":"purple"} t={t}/>
                {s.editable ? <Btn t={t} v="outline" sz="sm">Edit</Btn> : <Bdg label="LOCKED" v="muted" t={t}/>}
              </div>
            </Crd>
          ))}
        </div>
      )}
    </div>
  );
};

// ── MY DASHBOARD (influencer view) ───────────────────────────────
const MyDashboard = ({t, user}) => {
  const inf = INFLUENCERS.find(i=>i.id===user.iId) || INFLUENCERS[0];
  const myThreats = THREATS.filter(x=>x.iId===inf.id);
  const activeThr = myThreats.filter(x=>!["dismissed","takedown_filed"].includes(x.status));
  const myTd = TAKEDOWNS.filter(x=>myThreats.map(th=>th.id).includes(x.threatId));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:22}}>
      <Crd t={t} glow style={{padding:"20px 24px",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
        <Av initials={inf.initials} color={inf.color} size={54} gold t={t}/>
        <div style={{flex:1}}>
          <div style={{fontSize:22,fontWeight:800,color:t.text,fontFamily:"'Syne',sans-serif",letterSpacing:-.5}}>{inf.name}</div>
          <div style={{color:t.textMuted,fontSize:13,marginTop:2}}>{inf.handle} · {inf.tier} Protection Plan</div>
        </div>
        <Bdg label={`${activeThr.length} ACTIVE THREAT${activeThr.length!==1?"S":""}`} v={myThreats.filter(x=>x.severity==="critical").length?"red":"orange"} dot t={t}/>
      </Crd>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:14}}>
        <StatCrd icon="alert" label="Active Threats" value={activeThr.length} sub={`${myThreats.filter(x=>x.severity==="critical").length} critical`} v="red" t={t}/>
        <StatCrd icon="radar" label="Scans Today" value="1,204" sub="All your platforms" v="purple" t={t}/>
        <StatCrd icon="flag" label="Takedowns" value={myTd.length} sub={`${myTd.filter(x=>x.status==="filed").length} resolved`} v="gold" t={t}/>
        <StatCrd icon="check" label="Total Resolved" value={inf.resolved} sub="All-time" v="green" t={t}/>
      </div>

      <Crd t={t} style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:12,background:t.greenGlow,border:`1px solid ${t.greenBorder}`}}>
        <Pulse c={t.green}/>
        <div style={{fontSize:13,color:t.green,fontWeight:600}}>All {inf.platforms.length} platforms actively monitored — {AGENTS.filter(a=>a.status==="active").length} AI agents running</div>
      </Crd>

      <div>
        <div style={{fontSize:15,fontWeight:700,color:t.text,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
          <Ic n="alert" s={16} c={t.red}/>Your IOI Alerts
          <Bdg label={activeThr.length.toString()} v={activeThr.length?"red":"green"} t={t}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {myThreats.map(th=>(
            <Crd key={th.id} t={t} style={{padding:"16px 20px"}}>
              <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                <Ring score={th.ociScore} size={46} t={t}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,color:t.text,fontSize:14,marginBottom:3}}>{th.fake}</div>
                  <div style={{fontSize:12,color:t.textMuted}}>{th.ttps} · {th.platform} · {th.detected}</div>
                  <div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}}>
                    {th.ioi.slice(0,2).map(x=><Bdg key={x} label={x.replace(/_/g," ")} v="purple" t={t}/>)}
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <SevBdg sev={th.severity} t={t}/>
                  <StsBdg sts={th.status} t={t}/>
                </div>
              </div>
            </Crd>
          ))}
          {myThreats.length===0 && (
            <div style={{textAlign:"center",padding:60,color:t.green}}>
              <div style={{fontSize:40,marginBottom:12}}>✓</div>
              <div style={{fontWeight:700,fontSize:16}}>No active threats detected</div>
              <div style={{color:t.textMuted,fontSize:13,marginTop:6}}>Your accounts are clean. Monitoring continues 24/7.</div>
            </div>
          )}
        </div>
      </div>

      {myTd.length > 0 && (
        <div>
          <div style={{fontSize:15,fontWeight:700,color:t.text,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
            <Ic n="flag" s={16} c={t.gold}/>Takedown Status
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {myTd.map(td=>(
              <Crd key={td.id} t={t} style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                <Ring score={td.ociScore} size={40} t={t}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,color:t.text,fontSize:14}}>{td.fake}</div>
                  <div style={{fontSize:12,color:t.textMuted}}>{td.platform} · {td.reportType.replace(/_/g," ")}{td.filedAt?` · Filed ${td.filedAt}`:""}</div>
                </div>
                <StsBdg sts={td.status} t={t}/>
              </Crd>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── NAV CONFIG ───────────────────────────────────────────────────
const NAV = {
  admin:[
    {id:"dashboard",icon:"grid",label:"Command Center"},
    {id:"threats",icon:"target",label:"Threat Intel"},
    {id:"oci",icon:"fingerprint",label:"OCI Vault"},
    {id:"agents",icon:"bot",label:"Agent Ops"},
    {id:"takedowns",icon:"flag",label:"Takedown Queue",badge:true},
    {id:"feeds",icon:"radar",label:"Live Feeds"},
    {id:"influencers",icon:"users",label:"Influencer Tenants"},
    {id:"access",icon:"key",label:"Access Mgmt"},
    {id:"knowledge",icon:"book",label:"Knowledge Base"},
    {id:"admin",icon:"settings",label:"Admin Console"},
  ],
  soc_analyst:[
    {id:"dashboard",icon:"grid",label:"Command Center"},
    {id:"threats",icon:"target",label:"Threat Intel"},
    {id:"oci",icon:"fingerprint",label:"OCI Vault"},
    {id:"agents",icon:"bot",label:"Agent Ops"},
    {id:"takedowns",icon:"flag",label:"Takedown Queue",badge:true},
    {id:"feeds",icon:"radar",label:"Live Feeds"},
    {id:"influencers",icon:"users",label:"Influencer Tenants"},
    {id:"knowledge",icon:"book",label:"Knowledge Base"},
  ],
  influencer:[
    {id:"dashboard",icon:"grid",label:"My Dashboard"},
    {id:"oci",icon:"fingerprint",label:"My Likeness Vault"},
    {id:"threats",icon:"alert",label:"My Alerts"},
    {id:"takedowns",icon:"flag",label:"Takedown Status"},
    {id:"knowledge",icon:"book",label:"Knowledge Base"},
  ],
  influencer_staff:[
    {id:"dashboard",icon:"grid",label:"Dashboard"},
    {id:"threats",icon:"alert",label:"Alerts"},
    {id:"knowledge",icon:"book",label:"Knowledge Base"},
  ],
};

// ── CSS ──────────────────────────────────────────────────────────
const CSS = (t) => `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Syne:wght@700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', system-ui, sans-serif; }
  input, button, textarea, select { font-family: inherit; }
  input::placeholder, textarea::placeholder { color: ${t.textMuted}; opacity: .65; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${t.scrollbar}; border-radius: 99px; }
  @keyframes ping { 75%,100% { transform: scale(2.2); opacity: 0; } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideIn { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }
  @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
`;

// ── MAIN APP ─────────────────────────────────────────────────────
export default function App() {
  const [theme, setTheme] = useState("dark");
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [sidebar, setSidebar] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef();
  const t = theme==="dark" ? DARK : LIGHT;

  useEffect(() => {
    const h = e => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  if (!user) return (
    <>
      <style>{CSS(t)}</style>
      <AuthScreen t={t} onLogin={acc => { setUser(acc); setView("dashboard"); }}/>
    </>
  );

  const role = user.role;
  const nav = NAV[role] || NAV.soc_analyst;
  const pendingTd = TAKEDOWNS.filter(x => x.status==="awaiting_review").length;

  const renderView = () => {
    switch (view) {
      case "dashboard":    return (role==="influencer"||role==="influencer_staff") ? <MyDashboard t={t} user={user}/> : <CommandCenter t={t} role={role} user={user}/>;
      case "threats":      return <ThreatIntel t={t} role={role} user={user}/>;
      case "oci":          return <OCIVault t={t} role={role} user={user}/>;
      case "agents":       return <AgentOps t={t}/>;
      case "takedowns":    return <TakedownQueue t={t} role={role}/>;
      case "feeds":        return <FeedConfig t={t}/>;
      case "influencers":  return <InfluencerMgmt t={t}/>;
      case "access":       return <AccessMgmt t={t}/>;
      case "knowledge":    return <KnowledgeBase t={t}/>;
      case "admin":        return <AdminConsole t={t}/>;
      default:             return <CommandCenter t={t} role={role} user={user}/>;
    }
  };

  const roleLabel = {admin:"Admin",soc_analyst:"SOC Analyst",influencer:"Influencer",influencer_staff:"Infl. Staff"};
  const roleIcon  = {admin:"key",soc_analyst:"shield",influencer:"users",influencer_staff:"eye"};

  return (
    <div style={{display:"flex",height:"100vh",background:t.bg,color:t.text,overflow:"hidden"}}>
      <style>{CSS(t)}</style>

      {/* ── SIDEBAR ── */}
      <div style={{width:sidebar?240:64,flexShrink:0,background:t.nav,borderRight:`1px solid ${t.navBorder}`,display:"flex",flexDirection:"column",transition:"width .22s cubic-bezier(.4,0,.2,1)",overflow:"hidden",zIndex:10}}>
        {/* Logo */}
        <div style={{padding:"16px 12px",borderBottom:`1px solid ${t.navBorder}`,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <div style={{width:36,height:36,borderRadius:10,flexShrink:0,background:`linear-gradient(135deg,${t.gold},${t.purple})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 16px ${t.purpleGlow}`}}>
            <Ic n="shield" s={18} c="#fff"/>
          </div>
          {sidebar && <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,color:t.text,letterSpacing:-.5,whiteSpace:"nowrap"}}>imprsn<span style={{color:t.gold}}>8</span></div>}
          <button onClick={()=>setSidebar(!sidebar)} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:t.textMuted,padding:4,flexShrink:0,display:"flex"}}>
            <Ic n="menu" s={16} c={t.textMuted}/>
          </button>
        </div>

        {/* Role badge */}
        {sidebar && (
          <div style={{padding:"10px 12px",borderBottom:`1px solid ${t.navBorder}`}}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:t.purpleGlow,border:`1px solid ${t.purpleBorder}`,borderRadius:8}}>
              <Ic n={roleIcon[role]||"users"} s={13} c={t.purpleBright}/>
              <span style={{fontSize:12,fontWeight:700,color:t.purpleBright,whiteSpace:"nowrap"}}>{roleLabel[role]||role}</span>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav style={{flex:1,padding:"8px 8px",overflowY:"auto",display:"flex",flexDirection:"column",gap:2}}>
          {nav.map(item => {
            const active = view===item.id;
            const hasBadge = item.badge && pendingTd > 0;
            return (
              <button key={item.id} onClick={()=>setView(item.id)}
                style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:10,border:"none",cursor:"pointer",width:"100%",textAlign:"left",background:active?t.purpleGlow:"none",color:active?t.purpleBright:t.textMuted,transition:"all .15s",whiteSpace:"nowrap",position:"relative"}}
                onMouseEnter={e=>{if(!active)e.currentTarget.style.background=t.mode==="dark"?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)";}}
                onMouseLeave={e=>{if(!active)e.currentTarget.style.background="none";}}>
                <div style={{position:"relative",flexShrink:0}}>
                  <Ic n={item.icon} s={17} c={active?t.purpleBright:t.textMuted}/>
                  {hasBadge && <span style={{position:"absolute",top:-4,right:-4,width:8,height:8,borderRadius:"50%",background:t.red,border:`2px solid ${t.nav}`}}/>}
                </div>
                {sidebar && <span style={{fontSize:13,fontWeight:active?700:400,overflow:"hidden",textOverflow:"ellipsis"}}>{item.label}</span>}
                {sidebar && active && <div style={{marginLeft:"auto",width:5,height:5,borderRadius:"50%",background:t.purpleBright,flexShrink:0}}/>}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={{padding:"10px 8px",borderTop:`1px solid ${t.navBorder}`,display:"flex",alignItems:"center",gap:10}}>
          <Av initials={user.name.split(" ").map(n=>n[0]).join("").slice(0,2)} size={32} gold t={t}/>
          {sidebar && <>
            <div style={{flex:1,overflow:"hidden"}}>
              <div style={{fontSize:13,fontWeight:700,color:t.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</div>
              <div style={{fontSize:11,color:t.textMuted}}>{roleLabel[role]||role}</div>
            </div>
            <button onClick={()=>setUser(null)} style={{background:"none",border:"none",cursor:"pointer",color:t.textMuted,padding:4,flexShrink:0,display:"flex"}} title="Sign out">
              <Ic n="logout" s={15} c={t.textMuted}/>
            </button>
          </>}
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Topbar */}
        <div style={{height:58,background:t.nav,borderBottom:`1px solid ${t.navBorder}`,display:"flex",alignItems:"center",padding:"0 20px",gap:12,flexShrink:0}}>
          <div style={{flex:1,maxWidth:340}}>
            <Inp value="" onChange={()=>{}} placeholder="Search threats, influencers, agents..." icon="search" t={t}/>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",background:t.greenGlow,border:`1px solid ${t.greenBorder}`,borderRadius:8}}>
            <Pulse c={t.green} sz={7}/><span style={{fontSize:12,color:t.green,fontWeight:700}}>LIVE</span>
          </div>

          {pendingTd > 0 && (
            <button onClick={()=>setView("takedowns")} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",background:t.redGlow,border:`1px solid ${t.redBorder}`,borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:12,color:t.red,fontWeight:700}}>
              <Ic n="lock" s={13} c={t.red}/>{pendingTd} takedown{pendingTd>1?"s":""} need review
            </button>
          )}

          {/* Notifications */}
          <div ref={notifRef} style={{position:"relative"}}>
            <button onClick={()=>setNotifOpen(!notifOpen)} style={{position:"relative",background:"none",border:`1px solid ${t.cardBorder}`,borderRadius:8,padding:"7px 8px",cursor:"pointer",color:t.textMuted,display:"flex"}}>
              <Ic n="bell" s={16} c={t.textMuted}/>
              <span style={{position:"absolute",top:5,right:5,width:7,height:7,borderRadius:"50%",background:t.red,border:`2px solid ${t.nav}`}}/>
            </button>
            {notifOpen && (
              <div style={{position:"absolute",right:0,top:"calc(100% + 8px)",width:320,background:t.card,border:`1px solid ${t.cardBorder}`,borderRadius:14,boxShadow:`0 12px 40px rgba(0,0,0,.28)`,zIndex:100}}>
                <div style={{padding:"14px 16px",borderBottom:`1px solid ${t.divider}`,fontWeight:700,color:t.text,fontSize:14}}>Notifications</div>
                {[
                  {msg:"CRITICAL: @zoehart1ey_real detected — 94% OCI match",time:"3m ago",c:t.red},
                  {msg:"ARBITER: Takedown package ready — analyst review required",time:"5m ago",c:t.orange},
                  {msg:"VERITAS: Likeness scan complete — 2 clones found",time:"12m ago",c:t.gold},
                  {msg:"NEXUS: New actor TA-2841 profile created",time:"1h ago",c:t.purple},
                  {msg:"WATCHDOG: All agent scopes validated — no violations",time:"2h ago",c:t.green},
                ].map((n,i)=>(
                  <div key={i} style={{padding:"11px 16px",borderBottom:i<4?`1px solid ${t.divider}`:"none",display:"flex",gap:10}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:n.c,marginTop:4,flexShrink:0}}/>
                    <div style={{flex:1}}><div style={{fontSize:13,color:t.text,lineHeight:1.4}}>{n.msg}</div><div style={{fontSize:11,color:t.textMuted,marginTop:2}}>{n.time}</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button onClick={()=>setTheme(theme==="dark"?"light":"dark")} style={{background:"none",border:`1px solid ${t.cardBorder}`,borderRadius:8,padding:"7px 8px",cursor:"pointer",display:"flex"}}>
            <Ic n={theme==="dark"?"sun":"moon"} s={16} c={t.textMuted}/>
          </button>
        </div>

        {/* Content */}
        <div key={view} style={{flex:1,overflowY:"auto",padding:24,animation:"fadeUp .2s ease-out"}}>
          {renderView()}
        </div>
      </div>
    </div>
  );
}
