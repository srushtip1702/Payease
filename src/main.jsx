import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc, addDoc, limit } from 'firebase/firestore';
import { Html5Qrcode } from 'html5-qrcode';
import { auth, db, firebaseConfigured } from './firebase';
import { Home, ScanLine, Send, History, UserRound, Bell, Eye, EyeOff, Copy, ShieldCheck, Menu, X, LogOut, ChevronRight, ArrowLeft, Receipt, Plus, Camera, CheckCircle2, AlertTriangle, LockKeyhole, WalletCards, RefreshCw } from 'lucide-react';
import './styles.css';

const demoTx = [
  { id:'demo1', name:'Aarav Mehta', type:'Sent', amount:450, status:'Success', date:'Today, 6:42 PM', icon:'AM' },
  { id:'demo2', name:'Cafe Aroma', type:'Paid', amount:280, status:'Success', date:'Today, 1:18 PM', icon:'CA' },
  { id:'demo3', name:'Riya Shah', type:'Received', amount:1200, status:'Success', date:'Yesterday, 8:04 PM', icon:'RS' },
  { id:'demo4', name:'Metro Recharge', type:'Paid', amount:300, status:'Success', date:'Yesterday, 11:25 AM', icon:'MR' },
];
const money = n => `₹${Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const initials = s => String(s||'PE').split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();

function App(){
  const [user,setUser]=useState(null), [profile,setProfile]=useState(null), [boot,setBoot]=useState(true);
  const [page,setPage]=useState('home'), [drawer,setDrawer]=useState(false), [modal,setModal]=useState(null), [toast,setToast]=useState('');
  const [transactions,setTransactions]=useState(demoTx), [showBalance,setShowBalance]=useState(true);
  const [authMode,setAuthMode]=useState('login');
  const notify=m=>{setToast(m);window.clearTimeout(window.__pe);window.__pe=window.setTimeout(()=>setToast(''),2800)};

  useEffect(()=>{
    if(!auth){setBoot(false);return;}
    return onAuthStateChanged(auth, async u=>{
      setUser(u); setBoot(false);
      if(u && db){
        const ref=doc(db,'users',u.uid); const snap=await getDoc(ref);
        if(snap.exists()) setProfile(snap.data());
        else { const p={name:u.email?.split('@')[0]||'PayEase User',email:u.email||'',upi:(u.email?.split('@')[0]||'user').toLowerCase().replace(/[^a-z0-9]/g,'')+'@payease',balance:10000,createdAt:serverTimestamp()}; await setDoc(ref,p); setProfile(p); }
      } else setProfile(null);
    });
  },[]);

  useEffect(()=>{
    if(!user||!db) return;
    const q=query(collection(db,'users',user.uid,'transactions'),orderBy('createdAt','desc'),limit(50));
    return onSnapshot(q,s=>{
      const rows=s.docs.map(d=>{const x=d.data(); return {id:d.id,name:x.counterparty||x.recipient||'Payment',type:x.direction==='in'?'Received':(x.category==='bill'?'Paid':'Sent'),amount:Number(x.amount||0),status:x.status||'Success',date:x.createdAt?.toDate?.().toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})||'Just now',icon:initials(x.counterparty||x.recipient||'TX')};});
      setTransactions(rows.length?rows:demoTx);
    },()=>setTransactions(demoTx));
  },[user]);

  if(boot) return <div className="splash"><img src="/payease-logo.png"/><span>Loading PayEase…</span></div>;
  if(!user) return <Auth mode={authMode} setMode={setAuthMode} notify={notify}/>;

  const balance=Number(profile?.balance ?? 10000);
  const spent=transactions.filter(t=>t.type!=='Received').reduce((a,t)=>a+t.amount,0);
  const logout=async()=>{await signOut(auth);setPage('home');notify('Logged out securely');};

  return <div className="app">
    <header className="topbar"><button className="iconBtn" onClick={()=>setDrawer(true)}><Menu/></button><img src="/payease-logo.png" className="topLogo"/><div className="topRight"><button className="iconBtn" onClick={async()=>{if(!('Notification'in window)){notify('Notifications are not supported');return} const p=await Notification.requestPermission();notify(p==='granted'?'Notifications enabled':'Notifications blocked')}}><Bell/></button><button className="avatar" onClick={()=>setPage('profile')}>{initials(profile?.name||user.email)}</button></div></header>
    {drawer&&<div className="overlay" onClick={()=>setDrawer(false)}><aside className="drawer" onClick={e=>e.stopPropagation()}><div className="drawerHead"><img src="/payease-logo.png"/><button className="iconBtn" onClick={()=>setDrawer(false)}><X/></button></div><div className="miniProfile"><div className="avatar big">{initials(profile?.name||user.email)}</div><div><b>{profile?.name||user.email}</b><span>{profile?.upi||'PayEase user'}</span></div></div>{[['home','Home',Home],['history','Transactions',History],['profile','Profile',UserRound]].map(([id,l,I])=><button className="drawerLink" key={id} onClick={()=>{setPage(id);setDrawer(false)}}><I/> {l}</button>)}<button className="drawerLink danger" onClick={logout}><LogOut/> Log out</button><div className="securityBox"><ShieldCheck/> <span>Firebase Authentication and Firestore are enabled for this app.</span></div></aside></div>}
    <main>
      {page==='home'&&<HomePage profile={profile} balance={balance} showBalance={showBalance} setShowBalance={setShowBalance} spent={spent} transactions={transactions} setPage={setPage} setModal={setModal} notify={notify}/>} 
      {page==='history'&&<HistoryPage transactions={transactions} setPage={setPage}/>} 
      {page==='profile'&&<ProfilePage profile={profile} user={user} setPage={setPage} notify={notify}/>} 
    </main>
    <nav className="bottomNav"><NavBtn active={page==='home'} icon={Home} label="Home" onClick={()=>setPage('home')}/><NavBtn icon={ScanLine} label="Scan" onClick={()=>setModal('scan')}/><button className="payBtn" onClick={()=>setModal('send')}><span><Send/></span><em>Pay</em></button><NavBtn active={page==='history'} icon={History} label="History" onClick={()=>setPage('history')}/><NavBtn active={page==='profile'} icon={UserRound} label="Profile" onClick={()=>setPage('profile')}/></nav>
    {modal==='send'&&<SendModal user={user} notify={notify} close={()=>setModal(null)}/>} {modal==='scan'&&<ScanModal notify={notify} close={()=>setModal(null)}/>} {toast&&<div className="toast">{toast}</div>}
  </div>
}
function NavBtn({active,icon:Icon,label,onClick}){return <button className={active?'active':''} onClick={onClick}><Icon/><span>{label}</span></button>}
function Auth({mode,setMode,notify}){const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false); const submit=async()=>{if(!firebaseConfigured)return notify('Firebase configuration is missing');if(!email||password.length<6)return notify('Enter a valid email and 6+ character password');setBusy(true);try{if(mode==='login')await signInWithEmailAndPassword(auth,email,password);else{const c=await createUserWithEmailAndPassword(auth,email,password);const nm=name.trim()||email.split('@')[0];await setDoc(doc(db,'users',c.user.uid),{name:nm,email,upi:nm.toLowerCase().replace(/[^a-z0-9]/g,'')+'@payease',balance:10000,createdAt:serverTimestamp()});}}catch(e){const map={'auth/invalid-credential':'Incorrect email or password','auth/email-already-in-use':'Email is already registered','auth/weak-password':'Password must be at least 6 characters','auth/invalid-email':'Enter a valid email'};notify(map[e.code]||e.message||'Authentication failed')}finally{setBusy(false)}};return <div className="authPage"><div className="authCard"><img src="/payease-logo.png" className="authLogo"/><span className="label">{mode==='login'?'WELCOME BACK':'CREATE ACCOUNT'}</span><h1>{mode==='login'?'Pay with ease.':'Join PayEase.'}</h1><p>Simple. Secure. Smart.</p>{mode==='signup'&&<Field label="Name" value={name} setValue={setName} placeholder="Your name"/>}<Field label="Email" value={email} setValue={setEmail} placeholder="you@example.com" type="email"/><Field label="Password" value={password} setValue={setPassword} placeholder="Minimum 6 characters" type="password"/><button className="primary" disabled={busy} onClick={submit}>{busy?'Please wait…':mode==='login'?'Sign in':'Create account'} <ChevronRight/></button><button className="switch" onClick={()=>setMode(mode==='login'?'signup':'login')}>{mode==='login'?'New here? Create an account':'Already have an account? Sign in'}</button><div className="authNote"><LockKeyhole/> Firebase Authentication protects your account.</div></div></div>}
function Field({label,value,setValue,placeholder,type='text'}){return <div className="field"><label>{label}</label><input type={type} value={value} onChange={e=>setValue(e.target.value)} placeholder={placeholder}/></div>}
function HomePage({profile,balance,showBalance,setShowBalance,spent,transactions,setPage,setModal,notify}){return <><section className="hero"><div><span className="eyebrow">Good evening</span><h1>Hi, {(profile?.name||'there').split(' ')[0]} 👋</h1><p>Simple payments, clear spending.</p></div><div className="protected"><ShieldCheck/> Protected</div></section><section className="balanceCard"><div className="balanceTop"><span>Available balance</span><button onClick={()=>setShowBalance(!showBalance)}>{showBalance?<EyeOff/>:<Eye/>}</button></div><strong>{showBalance?money(balance):'••••••••'}</strong><div className="upi"><span>{profile?.upi||'yourname@payease'}</span><button onClick={()=>{navigator.clipboard?.writeText(profile?.upi||'');notify('UPI ID copied')}}><Copy/></button></div></section><section className="quickGrid"><Quick icon={Send} label="Send" onClick={()=>setModal('send')}/><Quick icon={ScanLine} label="Scan & Pay" onClick={()=>setModal('scan')}/><Quick icon={Receipt} label="Bills" onClick={()=>notify('Bills module ready for integration')}/><Quick icon={Plus} label="Add Money" onClick={()=>notify('Demo wallet: add-money flow is simulated')}/></section><section className="section"><div className="sectionHead"><div><span className="label">THIS MONTH</span><h2>Spending</h2></div><b>{money(spent)}</b></div><div className="progress"><span style={{width:`${Math.min(100,spent/10000*100)}%`}}/></div><div className="mutedRow"><span>Tracked from transactions</span><span>Demo wallet ledger</span></div></section><section className="section"><div className="sectionHead"><h2>Recent activity</h2><button className="textBtn" onClick={()=>setPage('history')}>View all <ChevronRight/></button></div><div className="txList">{transactions.slice(0,5).map(t=><Transaction key={t.id} t={t}/>)}</div></section></>}
function Quick({icon:Icon,label,onClick}){return <button className="quick" onClick={onClick}><span><Icon/></span><b>{label}</b></button>}
function Transaction({t}){return <div className="tx"><div className="txAvatar">{t.icon}</div><div className="txMain"><b>{t.name}</b><span>{t.type} · {t.date}</span></div><div className="txAmt"><b className={t.type==='Received'?'green':''}>{t.type==='Received'?'+':'−'}{money(t.amount)}</b><span>{t.status}</span></div></div>}
function HistoryPage({transactions,setPage}){return <div className="page"><button className="back" onClick={()=>setPage('home')}><ArrowLeft/> Back</button><div className="title"><span className="label">PAYEASE</span><h1>Transactions</h1><p>Your recent payment activity.</p></div><div className="card txCard">{transactions.map(t=><Transaction key={t.id} t={t}/>)}</div></div>}
function ProfilePage({profile,user,setPage,notify}){return <div className="page"><button className="back" onClick={()=>setPage('home')}><ArrowLeft/> Back</button><div className="profileHero"><div className="avatar huge">{initials(profile?.name||user.email)}</div><h1>{profile?.name||'PayEase User'}</h1><p>{user.email}</p><div className="upiBadge">{profile?.upi}</div></div><div className="card settings"><Setting icon={ShieldCheck} title="Account security" sub="Firebase Authentication enabled"/><Setting icon={WalletCards} title="Wallet" sub="Demo wallet ledger"/><Setting icon={Bell} title="Notifications" sub="Use the bell icon to enable browser alerts"/><Setting icon={Camera} title="Camera & QR" sub="Camera permission is requested only when scanning"/></div><button className="secondary wide" onClick={async()=>{await signOut(auth);notify('Logged out securely')}}><LogOut/> Log out</button></div>}
function Setting({icon:Icon,title,sub}){return <div className="setting"><span className="settingIcon"><Icon/></span><span><b>{title}</b><small>{sub}</small></span><ChevronRight/></div>}
function SendModal({user,notify,close}){const [recipient,setRecipient]=useState(''),[amount,setAmount]=useState(''),[note,setNote]=useState(''),[busy,setBusy]=useState(false);const pay=async()=>{const a=Number(amount);if(!recipient||!a||a<=0)return notify('Enter recipient and amount');if(a>100000)return notify('Demo limit is ₹1,00,000');if(!db||!user)return notify('Database unavailable');setBusy(true);try{await addDoc(collection(db,'users',user.uid,'transactions'),{counterparty:recipient,direction:'out',amount:a,note,status:'Success',createdAt:serverTimestamp()});notify('Payment recorded securely');close()}catch(e){notify(e.message||'Could not record payment')}finally{setBusy(false)}};return <div className="modalOverlay" onClick={close}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modalHead"><h2>Send money</h2><button className="iconBtn" onClick={close}><X/></button></div><Field label="Recipient UPI / name" value={recipient} setValue={setRecipient} placeholder="name@upi"/><div className="field"><label>Amount</label><div className="moneyInput"><span>₹</span><input inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00"/></div></div><Field label="Note (optional)" value={note} setValue={setNote} placeholder="What is this for?"/><button className="primary" disabled={busy} onClick={pay}>{busy?'Saving…':'Confirm demo payment'} <CheckCircle2/></button><div className="modalNote"><ShieldCheck/> This records a demo wallet transaction; it does not move real bank money.</div></div></div>}
function ScanModal({notify,close}){const [scanning,setScanning]=useState(false),[result,setResult]=useState('');const reader=useRef(null);const start=async()=>{setScanning(true);setResult('');try{const qr=new Html5Qrcode('qr-reader');reader.current=qr;await qr.start({facingMode:'environment'},{fps:10,qrbox:{width:220,height:220}},txt=>{setResult(txt);qr.stop().catch(()=>{});setScanning(false)},()=>{});}catch(e){setScanning(false);notify('Camera permission was denied or unavailable')}};useEffect(()=>()=>{reader.current?.stop?.().catch(()=>{});reader.current?.clear?.().catch?.(()=>{})},[]);return <div className="modalOverlay" onClick={close}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modalHead"><h2>Scan & Pay</h2><button className="iconBtn" onClick={close}><X/></button></div><div id="qr-reader" className="qrReader">{!scanning&&!result&&<><Camera/><b>Camera is off</b><span>Tap below to allow camera access.</span></>}</div>{result&&<div className="scanResult"><CheckCircle2/> QR detected: {result}</div>}<button className="primary" onClick={start} disabled={scanning}>{scanning?'Scanning…':'Allow camera & scan'} <ScanLine/></button><div className="permissionNote"><LockKeyhole/> Camera is used only for QR scanning and is not uploaded.</div></div></div>}

createRoot(document.getElementById('root')).render(<App/>);
