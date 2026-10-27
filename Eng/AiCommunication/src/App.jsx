import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLines, BookOpen, ChartNoAxesCombined, Check, ChevronDown, CircleHelp,
  Clock3, Flame, Headphones, House, Languages, Lightbulb, Mic, MicOff,
  Pause, Play, RotateCcw, Search, Settings2, Sparkles, Target, Volume2,
  VolumeX, WandSparkles, Trophy, GraduationCap, MessageCircle, Star, Menu,
  X, Bookmark, ArrowRight, CheckCircle2, Circle, Zap, Brain, Waves
} from "lucide-react";

const lessons = [
  {
    id: 1, level: "Beginner", title: "A Fresh Start", topic: "Daily life", time: "2 min",
    text: "Every morning is a new chance to learn something useful. I like to wake up early, drink a glass of water, and plan my day. Small habits can make a big difference over time. When I practise English every day, I become more confident and express my ideas more clearly.",
    words: ["morning", "useful", "habits", "confident", "clearly"]
  },
  {
    id: 2, level: "Beginner", title: "My Favourite Place", topic: "Describing places", time: "3 min",
    text: "My favourite place is a quiet garden near my home. I enjoy watching the flowers and listening to the birds. The fresh air helps me feel calm after a busy day. I sometimes take a book with me and read under a tree. This simple place always makes me happy.",
    words: ["favourite", "quiet", "enjoy", "fresh", "sometimes"]
  },
  {
    id: 3, level: "Intermediate", title: "The Power of Practice", topic: "Self improvement", time: "3 min",
    text: "Learning a new skill takes patience, curiosity, and regular practice. At first, progress may feel slow, but every attempt teaches us something valuable. Instead of worrying about mistakes, we can treat them as helpful feedback. With consistent effort, difficult tasks gradually become easier and our confidence grows.",
    words: ["patience", "curiosity", "progress", "valuable", "consistent"]
  },
  {
    id: 4, level: "Intermediate", title: "A Better Conversation", topic: "Communication", time: "3 min",
    text: "Good communication is not only about speaking clearly; it is also about listening carefully. When we give others time to explain their thoughts, we build trust and understanding. Asking thoughtful questions can keep a conversation moving naturally. A friendly tone and simple words often make our message more effective.",
    words: ["communication", "carefully", "understanding", "thoughtful", "effective"]
  },
  {
    id: 5, level: "Advanced", title: "Ideas into Action", topic: "Work and goals", time: "4 min",
    text: "Turning an idea into reality requires planning, adaptability, and the willingness to learn from setbacks. Successful people rarely follow a perfectly straight path. They review their decisions, seek useful feedback, and make adjustments when circumstances change. Progress comes from combining a clear purpose with practical, consistent action.",
    words: ["adaptability", "reality", "setbacks", "circumstances", "consistent"]
  }
];

const vocab = [
  { word: "Confident", phonetic: "KON-fi-dent", meaning: "Feeling sure about your abilities.", example: "I feel confident when I practise every day." },
  { word: "Curiosity", phonetic: "kyoo-ree-OS-i-tee", meaning: "A strong desire to learn or know something.", example: "Curiosity helps us ask better questions." },
  { word: "Effective", phonetic: "ih-FEK-tiv", meaning: "Successful in producing the result you want.", example: "Clear words make communication effective." },
  { word: "Consistent", phonetic: "kun-SIS-tent", meaning: "Doing something regularly in a steady way.", example: "Consistent practice builds strong habits." },
  { word: "Thoughtful", phonetic: "THAWT-ful", meaning: "Showing careful thinking or consideration.", example: "She gave a thoughtful answer." },
  { word: "Opportunity", phonetic: "op-er-TOO-ni-tee", meaning: "A suitable chance to do something.", example: "This course is an opportunity to improve." }
];

const navItems = [
  { id: "home", label: "Overview", icon: House },
  { id: "reading", label: "Reading studio", icon: BookOpen },
  { id: "pronunciation", label: "Accent & audio", icon: AudioLines },
  { id: "vocabulary", label: "Vocabulary", icon: Languages },
  { id: "speaking", label: "Speaking score", icon: Mic },
  { id: "progress", label: "My progress", icon: ChartNoAxesCombined }
];

function getRecognition() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function App() {
  const [tab, setTab] = useState("home");
  const [lesson, setLesson] = useState(lessons[0]);
  const [level, setLevel] = useState("All levels");
  const [accent, setAccent] = useState("en-US");
  const [style90, setStyle90] = useState(false);
  const [rate, setRate] = useState(1);
  const [voiceList, setVoiceList] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [playing, setPlaying] = useState(false);
  const [currentWord, setCurrentWord] = useState("");
  const [query, setQuery] = useState("");
  const [recognized, setRecognized] = useState("");
  const [score, setScore] = useState(null);
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState("");
  const [saved, setSaved] = useState([]);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizDone, setQuizDone] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState("");
  const recognitionRef = useRef(null);
  const voicesRef = useRef([]);

  const availableLessons = useMemo(() => lessons.filter(l =>
    (level === "All levels" || l.level === level) &&
    `${l.title} ${l.topic} ${l.text}`.toLowerCase().includes(query.toLowerCase())
  ), [level, query]);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices?.() || [];
      voicesRef.current = voices;
      setVoiceList(voices);
    };
    loadVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis?.removeEventListener?.("voiceschanged", loadVoices);
      window.speechSynthesis?.cancel?.();
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (style90) setRate(0.78);
  }, [style90]);

  const voiceOptions = voiceList.filter(v => v.lang?.toLowerCase().startsWith(accent.toLowerCase().slice(0, 2)));
  const chosenVoice = voiceList.find(v => v.name === selectedVoice) || voiceOptions[0] || voiceList.find(v => v.lang === accent);

  function stopAudio() {
    window.speechSynthesis?.cancel?.();
    setPlaying(false);
    setCurrentWord("");
  }

  function speak(text, word = "") {
    if (!("speechSynthesis" in window)) {
      setToast("Speech playback is not supported in this browser.");
      return;
    }
    stopAudio();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = accent;
    utterance.rate = style90 ? Math.min(rate, 0.82) : rate;
    utterance.pitch = style90 ? 0.92 : 1;
    if (chosenVoice) utterance.voice = chosenVoice;
    utterance.onstart = () => { setPlaying(true); setCurrentWord(word); };
    utterance.onend = () => { setPlaying(false); setCurrentWord(""); };
    utterance.onerror = () => { setPlaying(false); setCurrentWord(""); };
    window.speechSynthesis.speak(utterance);
  }

  function startReading() {
    const Recognition = getRecognition();
    setMicError("");
    setScore(null);
    setRecognized("");
    if (!Recognition) {
      setMicError("Speech recognition is not available in this browser. Try the latest Google Chrome and allow microphone access.");
      return;
    }
    try {
      const rec = new Recognition();
      recognitionRef.current = rec;
      rec.lang = accent;
      rec.continuous = false;
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onstart = () => setListening(true);
      rec.onerror = (e) => {
        setListening(false);
        setMicError(e.error === "not-allowed"
          ? "Microphone permission was blocked. Allow microphone access in your browser settings."
          : `Speech recognition issue: ${e.error}. Please try again.`);
      };
      rec.onend = () => setListening(false);
      rec.onresult = (event) => {
        const transcript = Array.from(event.results).map(r => r[0].transcript).join(" ");
        setRecognized(transcript);
        const expected = lesson.text.toLowerCase().match(/[a-z']+/g) || [];
        const actual = transcript.toLowerCase().match(/[a-z']+/g) || [];
        const expectedNorm = expected.map(w => w.replace(/'s$/, ""));
        const actualNorm = actual.map(w => w.replace(/'s$/, ""));
        let hits = 0;
        const used = new Set();
        actualNorm.forEach((w, i) => {
          let best = -1;
          for (let j = Math.max(0, i - 3); j < Math.min(expectedNorm.length, i + 5); j++) {
            if (!used.has(j) && expectedNorm[j] === w) { best = j; break; }
          }
          if (best >= 0) { hits++; used.add(best); }
        });
        const accuracy = actualNorm.length ? Math.round((hits / Math.max(expectedNorm.length, actualNorm.length)) * 100) : 0;
        setScore(Math.min(100, accuracy));
      };
      rec.start();
    } catch {
      setListening(false);
      setMicError("Could not start the microphone. Check permissions and try again.");
    }
  }

  function toggleSaved(id) {
    setSaved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setToast(saved.includes(id) ? "Lesson removed from saved items" : "Lesson saved for later");
  }

  function renderParagraph(text) {
    return text.split(/(\s+)/).map((part, i) => {
      const clean = part.replace(/[.,!?;:]/g, "");
      if (!clean || /^\s+$/.test(part)) return part;
      return <button key={`${part}-${i}`} className={`word-token ${currentWord.toLowerCase() === clean.toLowerCase() ? "word-active" : ""}`} onClick={() => speak(clean, clean)} title={`Hear “${clean}”`}>{part}</button>;
    });
  }

  const activeTitle = navItems.find(n => n.id === tab)?.label || "Overview";
  const recognitionSupported = !!getRecognition();

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Waves size={23} /></div>
          <div><div className="brand-name">fluentflow<span>AI</span></div><div className="brand-sub">ENGLISH STUDIO</div></div>
          <button className="mobile-close icon-btn" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={18}/></button>
        </div>
        <div className="sidebar-label">LEARN</div>
        <nav className="nav-list">
          {navItems.map(item => {
            const Icon = item.icon;
            return <button key={item.id} className={`nav-item ${tab === item.id ? "nav-active" : ""}`} onClick={() => { setTab(item.id); setMobileNav(false); }}>
              <Icon size={18}/><span>{item.label}</span>{item.id === "speaking" && <span className="nav-dot"/>}
            </button>;
          })}
        </nav>
        <div className="sidebar-spacer"/>
        <div className="coach-card">
          <div className="coach-icon"><Sparkles size={18}/></div>
          <div className="coach-title">Your daily goal</div>
          <p>10 minutes a day can build a lasting habit.</p>
          <div className="goal-track"><span style={{width: "40%"}}/></div>
          <div className="goal-foot"><span>4 of 10 min</span><span>40%</span></div>
        </div>
        <div className="sidebar-profile">
          <div className="avatar">FF</div><div className="profile-copy"><strong>English learner</strong><span>Keep growing ✨</span></div><button className="icon-btn" onClick={() => setTab("progress")} aria-label="Open progress"><Settings2 size={17}/></button>
        </div>
      </aside>

      {mobileNav && <button className="mobile-overlay" onClick={() => setMobileNav(false)} aria-label="Close navigation"/>}

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu icon-btn" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={21}/></button>
            <div><div className="eyebrow">YOUR PERSONAL LANGUAGE COACH</div><h1>{activeTitle}</h1></div>
          </div>
          <div className="topbar-right">
            <div className="streak-chip"><Flame size={16} fill="currentColor"/> <strong>7</strong><span>day streak</span></div>
            <button className="top-avatar" title="Learner profile">L</button>
          </div>
        </header>

        {tab === "home" && <div className="page-content">
          <section className="hero-panel">
            <div className="hero-copy">
              <div className="hero-kicker"><Sparkles size={14}/> YOUR NEXT CHAPTER STARTS HERE</div>
              <h2>Find your voice.<br/><span>Speak with confidence.</span></h2>
              <p>Build real-world English skills, one small practice at a time. Your journey to fluent communication starts today.</p>
              <button className="primary-btn" onClick={() => setTab("reading")}>Start learning <ArrowRight size={17}/></button>
              <div className="hero-proof"><div className="mini-avatars"><span>A</span><span>M</span><span>J</span></div><span>Little steps. Real progress.</span><span className="proof-star"><Star size={13} fill="currentColor"/> Daily practice</span></div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="orbit orbit-one"/><div className="orbit orbit-two"/>
              <div className="float-card float-card-top"><Headphones size={17}/><span>Listen & repeat</span><CheckCircle2 size={16}/></div>
              <div className="hero-orb"><div className="orb-inner"><AudioLines size={66} strokeWidth={1.4}/><span>HELLO!</span></div></div>
              <div className="float-card float-card-bottom"><div className="tiny-bars"><i/><i/><i/><i/><i/></div><span>Speak naturally</span></div>
              <div className="sparkle sparkle-a">✦</div><div className="sparkle sparkle-b">✧</div>
            </div>
          </section>

          <section className="stats-grid">
            <div className="stat-card"><div className="stat-icon lilac"><BookOpen size={19}/></div><div><span className="stat-label">Lessons explored</span><div className="stat-value">12 <small>/ 30</small></div><div className="stat-note"><span className="up-note">+2</span> this week</div></div><div className="stat-sparkline"><i/><i/><i/><i/><i/><i/><i/></div></div>
            <div className="stat-card"><div className="stat-icon mint"><Target size={19}/></div><div><span className="stat-label">Reading accuracy</span><div className="stat-value">86<small>%</small></div><div className="stat-note"><span className="up-note">+8%</span> improvement</div></div><div className="ring-chart"><span>86%</span></div></div>
            <div className="stat-card"><div className="stat-icon peach"><Clock3 size={19}/></div><div><span className="stat-label">Practice time</span><div className="stat-value">2.4<small> hrs</small></div><div className="stat-note">Your weekly activity</div></div><div className="stat-sparkline warm"><i/><i/><i/><i/><i/><i/><i/></div></div>
          </section>

          <section className="section-heading"><div><div className="eyebrow">A LITTLE PRACTICE GOES A LONG WAY</div><h2>Pick up where you left off</h2></div><button className="text-btn" onClick={() => setTab("reading")}>View all lessons <ArrowRight size={15}/></button></section>
          <section className="lesson-grid">
            {lessons.slice(0,3).map((l, i) => <article className="lesson-card" key={l.id}>
              <div className={`lesson-art lesson-art-${i+1}`}><div className="lesson-art-label">{l.level}</div>{i===0 ? <BookOpen size={43}/> : i===1 ? <MessageCircle size={43}/> : <Brain size={43}/>}<div className="art-dots">✦　·　✧</div></div>
              <div className="lesson-card-body"><div className="lesson-meta"><span>{l.topic}</span><span><Clock3 size={13}/>{l.time}</span></div><h3>{l.title}</h3><p>{l.text.slice(0,90)}…</p><button className="lesson-open" onClick={() => {setLesson(l);setTab("reading");}}>Continue lesson <ArrowRight size={15}/></button></div>
            </article>)}
          </section>

          <section className="bottom-grid">
            <div className="panel practice-panel"><div className="panel-heading"><div><div className="eyebrow">SPEAK A LITTLE EVERY DAY</div><h3>Ready for a speaking check?</h3></div><div className="panel-icon"><Mic size={19}/></div></div><p>Read a short paragraph out loud and get an estimated word-match score.</p><button className="secondary-btn" onClick={() => setTab("speaking")}>Try reading score <ArrowRight size={15}/></button></div>
            <div className="panel word-panel"><div className="panel-heading"><div><div className="eyebrow">WORD OF THE DAY</div><h3>Confident</h3></div><div className="word-sound"><Volume2 size={17}/></div></div><div className="phonetic">KON-fi-dent <span>· adjective</span></div><p>Feeling sure about your abilities or yourself.</p><button className="text-btn" onClick={() => {setTab("vocabulary");speak("Confident");}}>Listen & learn <Volume2 size={14}/></button></div>
          </section>
        </div>}

        {tab === "reading" && <div className="page-content">
          <div className="page-intro"><div><div className="eyebrow">READ · LISTEN · REPEAT</div><h2>Reading studio</h2><p>Choose a short paragraph, listen to a model voice, then practise each word at your own pace.</p></div><div className="intro-badge"><BookOpen size={18}/> 5 guided lessons</div></div>
          <div className="reading-layout">
            <section className="panel lesson-browser">
              <div className="browser-heading"><h3>Choose a paragraph</h3><span className="count-pill">{availableLessons.length} lessons</span></div>
              <div className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search lessons..."/></div>
              <div className="filter-row">{["All levels","Beginner","Intermediate","Advanced"].map(v=><button key={v} onClick={()=>setLevel(v)} className={`filter-pill ${level===v?"filter-selected":""}`}>{v}</button>)}</div>
              <div className="lesson-list">{availableLessons.map(l=><button key={l.id} onClick={()=>{setLesson(l);setScore(null);setRecognized("");}} className={`lesson-list-item ${lesson.id===l.id?"lesson-list-active":""}`}><div className="list-item-icon"><BookOpen size={17}/></div><div className="list-item-copy"><strong>{l.title}</strong><span>{l.level} · {l.topic}</span></div><span className="list-time">{l.time}</span></button>)}
              {availableLessons.length===0 && <div className="empty-state">No lessons match. Try another search.</div>}</div>
            </section>
            <section className="panel reader-panel">
              <div className="reader-topline"><span className="level-badge">{lesson.level}</span><button className={`icon-btn ${saved.includes(lesson.id)?"saved-icon":""}`} onClick={()=>toggleSaved(lesson.id)} title="Save lesson"><Bookmark size={18} fill={saved.includes(lesson.id)?"currentColor":"none"}/></button></div>
              <div className="reader-title-row"><div><h2>{lesson.title}</h2><p>{lesson.topic} <span>·</span> {lesson.time} read</p></div><div className="reader-book-icon"><BookOpen size={25}/></div></div>
              <div className="reader-instructions"><Lightbulb size={16}/><span>Tip: Click any word to hear its pronunciation.</span></div>
              <div className="paragraph-box"><p>{renderParagraph(lesson.text)}</p></div>
              <div className="reader-controls"><button className="primary-btn" onClick={()=>playing?stopAudio():speak(lesson.text)}>{playing?<Pause size={16}/>:<Play size={16} fill="currentColor"/>}{playing?"Stop playback":"Listen to paragraph"}</button><button className="secondary-btn" onClick={()=>{setTab("speaking");setScore(null);}}>Read aloud <Mic size={16}/></button></div>
              <div className="reader-footer"><span><Volume2 size={14}/> Voice: {accent==="en-US"?"American English":accent==="en-GB"?"British English":"Australian English"}</span><button className="text-btn" onClick={()=>setTab("pronunciation")}>Voice settings <ArrowRight size={14}/></button></div>
              <div className="word-bank"><div className="word-bank-head"><h4>Words to practise</h4><span>Tap to hear</span></div><div className="word-chip-row">{lesson.words.map(w=><button key={w} className="word-chip" onClick={()=>speak(w,w)}>{w}<Volume2 size={13}/></button>)}</div></div>
            </section>
          </div>
        </div>}

        {tab === "pronunciation" && <div className="page-content">
          <div className="page-intro"><div><div className="eyebrow">HEAR THE DIFFERENCE</div><h2>Accent & audio lab</h2><p>Explore available English voices, slow down playback, and practise clear pronunciation.</p></div><div className="intro-badge"><Headphones size={18}/> Listening practice</div></div>
          <div className="audio-layout">
            <section className="panel accent-panel">
              <div className="panel-heading"><div><div className="eyebrow">CHOOSE YOUR SOUND</div><h3>Voice & accent</h3></div><div className="panel-icon"><AudioLines size={19}/></div></div>
              <div className="accent-options">
                <button className={`accent-option ${accent==="en-US"&&!style90?"accent-picked":""}`} onClick={()=>{setAccent("en-US");setSelectedVoice("");setStyle90(false);setRate(1);}}><span className="flag-emoji">🇺🇸</span><span><strong>American English</strong><small>US pronunciation</small></span>{accent==="en-US"&&!style90&&<CheckCircle2 size={18}/>}</button>
                <button className={`accent-option ${accent==="en-GB"&&!style90?"accent-picked":""}`} onClick={()=>{setAccent("en-GB");setSelectedVoice("");setStyle90(false);setRate(1);}}><span className="flag-emoji">🇬🇧</span><span><strong>British English</strong><small>UK pronunciation</small></span>{accent==="en-GB"&&!style90&&<CheckCircle2 size={18}/>}</button>
                <button className={`accent-option ${accent==="en-AU"&&!style90?"accent-picked":""}`} onClick={()=>{setAccent("en-AU");setSelectedVoice("");setStyle90(false);setRate(1);}}><span className="flag-emoji">🇦🇺</span><span><strong>Australian English</strong><small>Australian pronunciation</small></span>{accent==="en-AU"&&!style90&&<CheckCircle2 size={18}/>}</button>
                <button className={`accent-option ${style90?"accent-picked":""}`} onClick={()=>{setStyle90(true);setRate(0.78);}}><span className="retro-icon"><AudioLines size={19}/></span><span><strong>90s slow practice</strong><small>Slower, relaxed listening style</small></span>{style90&&<CheckCircle2 size={18}/>}</button>
              </div>
              <div className="voice-select-wrap"><label htmlFor="voice-select">Available device voice</label><div className="select-wrap"><select id="voice-select" value={selectedVoice} onChange={e=>setSelectedVoice(e.target.value)}><option value="">Automatic best match</option>{voiceOptions.map(v=><option value={v.name} key={`${v.name}-${v.lang}`}>{v.name} ({v.lang})</option>)}</select><ChevronDown size={15}/></div><small className="helper-text">Voice choices depend on your operating system and browser.</small></div>
              <div className="speed-control"><div className="speed-label"><label htmlFor="speed">Playback speed</label><strong>{rate.toFixed(2)}×</strong></div><input id="speed" type="range" min="0.55" max="1.25" step="0.05" value={rate} onChange={e=>{setRate(Number(e.target.value));if(Number(e.target.value)>0.85)setStyle90(false);}}/><div className="range-labels"><span>Slow</span><span>Natural</span><span>Fast</span></div></div>
            </section>
            <section className="panel audio-demo-panel">
              <div className="audio-wave-bg"><div className="wave-circle"><AudioLines size={39}/></div><div className="sound-wave">{Array.from({length:29},(_,i)=><i key={i} style={{height:`${15+Math.abs(Math.sin(i*.68))*48+(i%4)*3}px`}}/>)}</div></div>
              <div className="eyebrow">LISTEN & LEARN</div><h2>Practice with a model voice</h2><p>Listen to the sentence, then repeat it aloud. Try a slower speed when a word feels difficult.</p>
              <div className="sample-sentence">“Clear communication begins with careful listening.”</div>
              <button className="primary-btn audio-play-btn" onClick={()=>playing?stopAudio():speak("Clear communication begins with careful listening.")}>{playing?<Pause size={17}/>:<Play size={17} fill="currentColor"/>}{playing?"Stop listening":"Play sample sentence"}</button>
              <div className="audio-note"><CircleHelp size={15}/> This uses your browser's speech engine, not a cloned or historical recording.</div>
            </section>
          </div>
          <section className="panel word-pronunciation-panel"><div className="panel-heading"><div><div className="eyebrow">ONE WORD AT A TIME</div><h3>Word pronunciation practice</h3></div><div className="panel-icon"><Volume2 size={19}/></div></div><div className="quick-words">{["comfortable","thoughtful","world","usually","opportunity","communication"].map(w=><button key={w} onClick={()=>speak(w,w)}><span>{w}</span><Volume2 size={16}/></button>)}</div><p className="helper-text">Tap a word to hear it spoken in your selected voice. For exact IPA and phoneme-level scoring, connect a pronunciation service.</p></section>
        </div>}

        {tab === "vocabulary" && <div className="page-content">
          <div className="page-intro"><div><div className="eyebrow">GROW YOUR WORD POWER</div><h2>Vocabulary builder</h2><p>Learn useful words, hear how they sound, and practise them in a sentence.</p></div><div className="intro-badge"><Languages size={18}/> {vocab.length} starter words</div></div>
          <div className="vocab-grid">{vocab.map((v,i)=><article className="panel vocab-card" key={v.word}><div className={`vocab-number vocab-number-${i%4}`}>0{i+1}</div><button className="vocab-listen icon-btn" onClick={()=>speak(v.word)} aria-label={`Hear ${v.word}`}><Volume2 size={18}/></button><h3>{v.word}</h3><div className="phonetic">{v.phonetic}</div><p>{v.meaning}</p><div className="example-box"><span>EXAMPLE</span><p>“{v.example}”</p></div><button className={`save-word ${saved.includes(100+i)?"save-word-active":""}`} onClick={()=>toggleSaved(100+i)}>{saved.includes(100+i)?<Check size={15}/>:<Bookmark size={15}/>} {saved.includes(100+i)?"Saved":"Save word"}</button></article>)}</div>
          <section className="panel quiz-panel"><div className="panel-heading"><div><div className="eyebrow">QUICK CHECK</div><h3>Test your understanding</h3></div><div className="panel-icon"><Brain size={19}/></div></div><p>What does <strong>“consistent”</strong> mean?</p><div className="quiz-options">{["Doing something regularly","Feeling nervous","Moving very quickly","Speaking very loudly"].map(opt=><button key={opt} className={`quiz-option ${quizAnswer===opt?(opt==="Doing something regularly"?"quiz-correct":"quiz-wrong"):""}`} onClick={()=>{setQuizAnswer(opt);setQuizDone(true);}}>{opt}{quizDone&&opt==="Doing something regularly"&&<CheckCircle2 size={17}/>}</button>)}</div>{quizDone&&<div className={`quiz-feedback ${quizAnswer==="Doing something regularly"?"feedback-good":"feedback-try"}`}>{quizAnswer==="Doing something regularly"?"Exactly! Consistent means regular and steady.":"Not quite. Try again: consistent means doing something regularly."}<button onClick={()=>{setQuizAnswer("");setQuizDone(false);}}>Try again</button></div>}</section>
        </div>}

        {tab === "speaking" && <div className="page-content">
          <div className="page-intro"><div><div className="eyebrow">YOUR VOICE, YOUR PROGRESS</div><h2>Speaking score</h2><p>Read the selected paragraph into your microphone. Compare the recognized words with the original passage.</p></div><div className="intro-badge"><Mic size={18}/> {recognitionSupported?"Microphone practice":"Browser support varies"}</div></div>
          <div className="speaking-layout">
            <section className="panel speaking-main"><div className="speaking-header"><div><span className="level-badge">{lesson.level}</span><h3>{lesson.title}</h3></div><button className="text-btn" onClick={()=>setTab("reading")}>Change paragraph <ArrowRight size={14}/></button></div><div className="speaking-passage">{lesson.text}</div><div className="mic-stage"><div className={`mic-rings ${listening?"mic-listening":""}`}><div className="mic-core">{listening?<Waves size={28}/>:<Mic size={28}/>}</div></div><div className="mic-status">{listening?"Listening to your reading…":"Ready when you are"}</div><p>{listening?"Read the paragraph clearly at a comfortable pace.":"Allow microphone access, then read the paragraph aloud."}</p><button className={`primary-btn mic-button ${listening?"recording-btn":""}`} onClick={()=>listening?(recognitionRef.current?.stop(),setListening(false)):startReading()}>{listening?<><MicOff size={17}/> Stop reading</>:<><Mic size={17}/> Start reading</>}</button><button className="text-btn reset-btn" onClick={()=>{recognitionRef.current?.abort?.();setListening(false);setRecognized("");setScore(null);setMicError("");}}> <RotateCcw size={14}/> Reset attempt</button>{micError&&<div className="error-note">{micError}</div>}</div></section>
            <aside className="speaking-side">
              <section className="panel score-panel"><div className="panel-heading"><div><div className="eyebrow">YOUR RESULT</div><h3>Reading accuracy</h3></div><div className="panel-icon"><Target size={19}/></div></div><div className="score-gauge" style={{"--score":`${score??0}%`}}><div className="score-gauge-inner"><strong>{score===null?"—":`${score}%`}</strong><span>{score===null?"No attempt yet":"Word match"}</span></div></div><div className="score-feedback">{score===null?"Your score will appear after your reading is recognized.":score>=85?"Great work! Keep practising to make your reading even smoother.":score>=65?"Good start. Repeat the highlighted words and try again.":"Keep going! Listen to the model voice and read in shorter phrases."}</div><div className="score-legend"><span><i className="legend-green"/>Matched words</span><span><i className="legend-grey"/>Words to practise</span></div></section>
              <section className="panel transcript-panel"><div className="panel-heading"><div><div className="eyebrow">SPEECH RECOGNITION</div><h3>Your transcript</h3></div><button className="icon-btn" onClick={()=>speak(lesson.text)} title="Listen to model"><Volume2 size={17}/></button></div><div className="transcript-body">{recognized||"Your recognized speech will appear here after you finish reading."}</div>{recognized&&<div className="transcript-actions"><button className="text-btn" onClick={()=>speak(recognized)}>Listen to transcript <Play size={13}/></button></div>}</section>
            </aside>
          </div>
          <div className="disclaimer-note"><CircleHelp size={16}/><span>This is an estimated word-match score based on your browser's speech recognition. It is not a professional pronunciation, accent, fluency, or medical assessment. Results may vary with noise and microphone quality.</span></div>
        </div>}

        {tab === "progress" && <div className="page-content">
          <div className="page-intro"><div><div className="eyebrow">SMALL STEPS ADD UP</div><h2>Your learning progress</h2><p>Review your learning habits and celebrate each improvement.</p></div><div className="intro-badge"><Trophy size={18}/> Keep it up</div></div>
          <section className="stats-grid progress-stats"><div className="stat-card"><div className="stat-icon lilac"><BookOpen size={19}/></div><div><span className="stat-label">Lessons available</span><div className="stat-value">05</div><div className="stat-note">Starter library</div></div></div><div className="stat-card"><div className="stat-icon mint"><Bookmark size={19}/></div><div><span className="stat-label">Saved items</span><div className="stat-value">{saved.length}</div><div className="stat-note">Words and lessons</div></div></div><div className="stat-card"><div className="stat-icon peach"><Flame size={19}/></div><div><span className="stat-label">Practice streak</span><div className="stat-value">7<small> days*</small></div><div className="stat-note">Example dashboard value</div></div></div></section>
          <div className="progress-layout"><section className="panel weekly-panel"><div className="panel-heading"><div><div className="eyebrow">YOUR ROUTINE</div><h3>Weekly practice plan</h3></div><span className="count-pill">10 min/day</span></div><div className="week-bars">{["M","T","W","T","F","S","S"].map((d,i)=><div className="day-bar" key={`${d}-${i}`}><div className="bar-rail"><span style={{height:[72,48,91,38,65,18,12][i]+"%"}}/></div><span>{d}</span></div>)}</div><div className="chart-legend"><i/> Suggested practice activity <span>*Sample visualization, not tracked history.</span></div></section><section className="panel milestones-panel"><div className="panel-heading"><div><div className="eyebrow">CELEBRATE PROGRESS</div><h3>Milestones</h3></div><div className="panel-icon"><Trophy size={19}/></div></div><div className="milestone"><div className="milestone-icon"><Zap size={18}/></div><div><strong>First steps</strong><span>Open a lesson and start practising</span></div><CheckCircle2 size={17} className="milestone-check"/></div><div className="milestone"><div className="milestone-icon mint"><Mic size={18}/></div><div><strong>Brave voice</strong><span>Try your first speaking check</span></div>{score!==null?<CheckCircle2 size={17} className="milestone-check"/>:<Circle size={17} className="milestone-pending"/>}</div><div className="milestone"><div className="milestone-icon peach"><Bookmark size={18}/></div><div><strong>Word collector</strong><span>Save your first word or lesson</span></div>{saved.length>0?<CheckCircle2 size={17} className="milestone-check"/>:<Circle size={17} className="milestone-pending"/>}</div></section></div>
          <div className="disclaimer-note"><CircleHelp size={16}/><span>Some dashboard numbers are illustrative starter values. This demo stores saved items only in the current app session; it does not include a user account or cloud-synced learning history.</span></div>
        </div>}

        <footer className="app-footer"><span>© 2026 FluentFlow AI · Made for your next conversation</span><span><span className="online-dot"/> Practice at your own pace</span></footer>
      </main>
      {toast&&<div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
    </div>
  );
}

export default App;