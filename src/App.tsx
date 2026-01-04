import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Globe, Play, Pause, Radio, AlertCircle, SkipForward, RefreshCw, Zap, Clock } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- IMPORTS ---
import { STATION_DATABASE } from './stations_db';
import type { RadioStation } from './stations_db';

// --- CONFIGURATION ---

const CORS_PROXY = "https://corsproxy.io/?";

const RADIO_BROWSER_MIRRORS = [
  "https://de1.api.radio-browser.info",
  "https://at1.api.radio-browser.info",
  "https://nl1.api.radio-browser.info",
  "https://us1.api.radio-browser.info",
  "https://all.api.radio-browser.info"
];

const RADIO_GARDEN_BASE = "https://radio.garden/api";

const RadioGardenClone: React.FC = () => {
  // --- STATE ---
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Initializing...");
  
  // Refresh Logic
  const [viewMode, setViewMode] = useState<'global' | 'local'>('global');
  const [lastCoords, setLastCoords] = useState<{lat: number, lon: number} | null>(null);
  const [timeUntilRefresh, setTimeUntilRefresh] = useState<number>(60);

  // Refs
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  
  // BLACKLIST REF: Tracks failed IDs to prevent repeating dead stations
  const failedStationsRef = useRef<Set<string>>(new Set());

  // --- LIFECYCLE ---

  useEffect(() => {
    initMap();
    fetchHybridGlobal();
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  // 60-Second Auto-Refresh Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilRefresh((prev) => {
        if (prev <= 1) {
          handleAutoRefresh();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [viewMode, lastCoords]);

  const handleAutoRefresh = () => {
    console.log("Auto-refreshing station list...");
    if (viewMode === 'global') fetchHybridGlobal(true);
    else if (viewMode === 'local' && lastCoords) fetchHybridLocal(lastCoords.lat, lastCoords.lon, true);
  };

  // --- MAP LOGIC ---
  const initMap = () => {
    if (!mapContainerRef.current || mapRef.current) return;
    try {
      const map = L.map(mapContainerRef.current, {
        center: [20, 0], zoom: 3, zoomControl: false, attributionControl: false 
      });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO', subdomains: 'abcd', maxZoom: 19
      }).addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      
      map.on('click', (e: L.LeafletMouseEvent) => {
        fetchHybridLocal(e.latlng.lat, e.latlng.lng);
      });
      mapRef.current = map;
    } catch (err) { console.error(err); }
  };

  // --- HYBRID FETCHER ADAPTERS ---
  
  const fetchRadioBrowser = async (endpoint: string): Promise<RadioStation[]> => {
    for (const mirror of RADIO_BROWSER_MIRRORS) {
      try {
        let res;
        try {
          res = await fetch(`${mirror}${endpoint}`);
        } catch {
          res = await fetch(`${CORS_PROXY}${encodeURIComponent(mirror + endpoint)}`);
        }
        
        if (res.ok) {
          const data = await res.json();
          if (!Array.isArray(data)) return [];

          return data.filter((s: any) => s.geo_lat && s.geo_long).map((s: any) => ({
            id: s.stationuuid,
            name: s.name,
            url: s.url_resolved,
            country: s.countrycode,
            lat: s.geo_lat,
            lon: s.geo_long,
            source: 'browser'
          }));
        }
      } catch (e) { continue; }
    }
    return [];
  };

  const fetchRadioGarden = async (lat: number, lon: number): Promise<RadioStation[]> => {
    try {
      const searchUrl = `${RADIO_GARDEN_BASE}/ara/content/places?lat=${lat}&lon=${lon}`;
      const res = await fetch(`${CORS_PROXY}${encodeURIComponent(searchUrl)}`);
      if (!res.ok) return [];
      
      const data = await res.json();
      const place = data.data?.list?.[0];
      
      if (!place) return [];

      const channelsUrl = `${RADIO_GARDEN_BASE}/ara/content/page/${place.id}/channels`;
      const chRes = await fetch(`${CORS_PROXY}${encodeURIComponent(channelsUrl)}`);
      const chData = await chRes.json();
      
      const items = chData.data?.content?.[0]?.items || [];
      
      return items.map((item: any) => {
         if (!item || !item.href) return null;

         const idParts = item.href.split('/');
         const id = idParts[idParts.length - 1];
         
         return {
           id: `rg-${id}`,
           name: item.title,
           url: `${RADIO_GARDEN_BASE}/ara/content/listen/${id}/channel.mp3`,
           country: place.country,
           lat: place.geo[1],
           lon: place.geo[0],
           source: 'garden'
         };
      }).filter((s: any) => s !== null);

    } catch (e) {
      console.warn("Radio Garden API blocked or failed:", e);
      return [];
    }
  };

  // --- DATA PROCESSING & DEDUPLICATION ---

  const processAndSetStations = (mergedList: RadioStation[], silent: boolean) => {
    const urlMap = new Map();
    mergedList.forEach(s => {
        urlMap.set(s.url, s); 
    });

    const uniqueStations: RadioStation[] = [];
    const seenIds = new Set<string>();

    Array.from(urlMap.values()).forEach((s: any) => {
        let finalId = s.id;
        if (seenIds.has(finalId)) {
            finalId = `${s.id}_${Math.random().toString(36).substr(2, 5)}`;
        }
        seenIds.add(finalId);
        uniqueStations.push({ ...s, id: finalId });
    });

    setStations(uniqueStations);
    plotStations(uniqueStations);

    if (!silent) {
        if (uniqueStations.length === 0) setStatus("No signals found.");
        else setStatus(`Active: ${uniqueStations.length} Stations`);
    }
  };

  // --- AGGREGATORS ---

  const fetchHybridGlobal = async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setStatus("Connecting to Global Network...");
    setViewMode('global');

    try {
      const [browserData] = await Promise.all([
        fetchRadioBrowser('/json/stations/topclick/500')
      ]);

      const merged = [...STATION_DATABASE, ...browserData];
      processAndSetStations(merged, silent);

    } catch (err) {
      if (!silent) setError("Network error. Using Offline Database.");
      processAndSetStations(STATION_DATABASE, silent);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchHybridLocal = async (lat: number, lon: number, silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setStatus("Scanning Local Frequencies...");
    
    setViewMode('local');
    setLastCoords({ lat, lon });
    if (!silent && mapRef.current) mapRef.current.flyTo([lat, lon], 9, { duration: 1 });

    try {
      const [browserStations, gardenStations] = await Promise.all([
        fetchRadioBrowser(`/json/stations/bygeolatlong/${lat}/${lon}/100`),
        fetchRadioGarden(lat, lon)
      ]);

      let merged = [...browserStations, ...gardenStations];

      if (merged.length === 0) {
        merged = STATION_DATABASE.filter(s => {
            const d = Math.sqrt(Math.pow(s.lat - lat, 2) + Math.pow(s.lon - lon, 2));
            return d < 10; 
        });
      }

      processAndSetStations(merged, silent);

    } catch (err) {
       console.warn(err);
       processAndSetStations([], silent);
    } finally {
       if (!silent) setLoading(false);
    }
  };

  const plotStations = (list: RadioStation[]) => {
    if (!mapRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    list.forEach(s => {
      // Check if station is in blacklist, show as red if failed (optional visual cue), or just normal
      const isFailed = failedStationsRef.current.has(s.id);
      const color = isFailed ? '#555' : (s.source === 'garden' ? '#00ffff' : (s.source === 'backup' ? '#ffd700' : '#32cd32'));
      
      const marker = L.circleMarker([s.lat, s.lon], {
        radius: isFailed ? 4 : 6, 
        fillColor: color, 
        color: '#fff', 
        weight: 1, 
        opacity: isFailed ? 0.5 : 0.9, 
        fillOpacity: isFailed ? 0.3 : 0.7
      });
      marker.bindTooltip(`${s.name} (${s.country})`);
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        playStation(s);
      });
      markersLayerRef.current?.addLayer(marker);
    });
  };

  // --- AUDIO ENGINE & ERROR HANDLING ---

  const findNearestStation = (dead: RadioStation): RadioStation | null => {
    if (stations.length < 2) return null;
    let nearest: RadioStation | null = null;
    let minDist = Infinity;
    
    stations.forEach(cand => {
      // Skip the dead station itself AND any station in the blacklist
      if (cand.id === dead.id || failedStationsRef.current.has(cand.id)) return;
      
      const d = (cand.lat - dead.lat) ** 2 + (cand.lon - dead.lon) ** 2;
      if (d < minDist) { 
        minDist = d; 
        nearest = cand; 
      }
    });
    return nearest;
  };

  // Handles "Dead Air" / Error Events
  const handleDeadStream = (dead: RadioStation, reason: string = "Unknown Error") => {
    // 1. Log to Console
    console.error(`❌ [DEAD AIR] Resetting: ${dead.name}`);
    console.error(`   - ID: ${dead.id}`);
    console.error(`   - URL: ${dead.url}`);
    console.error(`   - Reason: ${reason}`);

    // 2. Add to Blacklist (prevent repeat)
    failedStationsRef.current.add(dead.id);

    // 3. Reset Audio
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src'); // Hard reset
        audioRef.current.load();
    }

    // 4. Find & Play Next
    const next = findNearestStation(dead);
    
    if (next) {
        setError(`Signal died. Rerouting to ${next.name}...`);
        console.log(`➡️ Auto-switching to nearest neighbor: ${next.name}`);
        
        // Short delay to allow UI to show error state briefly
        setTimeout(() => {
            playStation(next);
        }, 1000);
    } else {
        setError("Connection lost. No valid nearby signals.");
        console.error("❌ No valid stations found nearby to switch to.");
        setIsPlaying(false);
    }
  };

  const playStation = (s: RadioStation) => {
    if (!audioRef.current) return;
    
    // Reset failed blacklist if user manually selects a station? 
    // No, keep it per session to avoid frustration.
    
    setCurrentStation(s);
    setIsPlaying(true);
    setError(null);
    setStatus(`Tuning: ${s.name}`);
    
    // Check if it's a Garden stream and proxy it
    let playUrl = s.url;
    if (s.source === 'garden' || s.url.includes('radio.garden')) {
        playUrl = `${CORS_PROXY}${encodeURIComponent(s.url)}`;
    }
    
    audioRef.current.src = playUrl;
    
    const p = audioRef.current.play();
    if (p !== undefined) {
      p.catch(err => {
        if (err.name !== 'AbortError') {
           // If direct play failed and we haven't proxied yet, try proxy
           if (!playUrl.includes(CORS_PROXY)) {
               console.warn(`⚠️ Direct stream failed for ${s.name}. Attempting CORS proxy...`);
               const proxyUrl = `${CORS_PROXY}${encodeURIComponent(s.url)}`;
               audioRef.current!.src = proxyUrl;
               audioRef.current!.play().catch((e) => handleDeadStream(s, e.message));
           } else {
               handleDeadStream(s, err.message);
           }
        }
      });
    }
  };

  // Audio Event Handlers
  const onAudioError = (e: any) => {
      // Native audio element error event
      const errCode = e.currentTarget.error?.code;
      const errMsg = e.currentTarget.error?.message || "Stream Error";
      if (currentStation) handleDeadStream(currentStation, `Code ${errCode}: ${errMsg}`);
  };

  const onAudioEnded = () => {
      // Stream stopped sending data (Dead Air)
      if (currentStation) handleDeadStream(currentStation, "Stream Ended / Dead Air");
  };

  // --- STYLES ---
  const styles = {
    container: { position: 'relative' as const, width: '100vw', height: '100vh', background: '#0a0a0a', fontFamily: 'sans-serif', overflow: 'hidden' },
    map: { position: 'absolute' as const, inset: 0, zIndex: 0 },
    topBar: { position: 'absolute' as const, top: 0, left: 0, right: 0, zIndex: 10, padding: '15px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)', pointerEvents: 'none' as const, display: 'flex', justifyContent: 'space-between' },
    sidebar: { position: 'absolute' as const, top: '80px', right: '20px', width: '300px', maxHeight: '60vh', background: 'rgba(15,15,15,0.95)', borderRadius: '12px', border: '1px solid #333', zIndex: 20, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' },
    player: { position: 'absolute' as const, bottom: 0, left: 0, right: 0, height: '100px', background: 'rgba(10,10,10,0.95)', borderTop: '1px solid #333', zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' },
    playBtn: { width: '56px', height: '56px', borderRadius: '50%', background: '#32cd32', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 15px', cursor: 'pointer', boxShadow: '0 0 15px rgba(50,205,50,0.3)' },
    btn: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '10px' },
    err: { position: 'absolute' as const, top: '80px', left: '50%', transform: 'translateX(-50%)', background: '#7f1d1d', color: '#fecaca', padding: '8px 16px', borderRadius: '20px', zIndex: 50, border: '1px solid #991b1b', fontSize: '0.8rem' }
  };

  return (
    <div style={styles.container}>
      <div ref={mapContainerRef} style={styles.map} />
      
      {/* HEADER */}
      <div style={styles.topBar}>
        <div style={{ display: 'flex', alignItems: 'center', pointerEvents: 'auto' }}>
            <Globe size={24} color="#32cd32" style={{ marginRight: '10px' }} />
            <div>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0, color: 'white' }}>GLOBAL HYBRID</h1>
                <div style={{ fontSize: '0.7rem', color: '#32cd32' }}>{status}</div>
            </div>
        </div>
        
        {/* REFRESH TIMER */}
        <div style={{ display: 'flex', alignItems: 'center', color: '#666', fontSize: '0.8rem' }}>
            <Clock size={14} style={{ marginRight: '5px' }} />
            Refresh in {timeUntilRefresh}s
        </div>
      </div>

      {/* SIDEBAR */}
      {stations.length > 0 && (
        <div style={styles.sidebar}>
          <div style={{ padding: '12px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div>
               <div style={{ color: '#32cd32', fontWeight: 'bold' }}>
                 {loading ? 'Scanning...' : (viewMode === 'global' ? 'Global Top' : 'Local Scan')}
               </div>
               <div style={{ fontSize: '0.7rem', color: '#666' }}>{stations.length} Sources Active</div>
             </div>
             <button onClick={() => handleAutoRefresh()} style={styles.btn}><RefreshCw size={16} /></button>
          </div>
          <div style={{ overflowY: 'auto', padding: '5px' }}>
            {stations.map(s => {
              const isDead = failedStationsRef.current.has(s.id);
              return (
              <button key={s.id} onClick={() => playStation(s)} disabled={isDead} style={{ width: '100%', textAlign: 'left', padding: '10px', marginBottom: '2px', background: currentStation?.id === s.id ? 'rgba(50,205,50,0.1)' : (isDead ? 'rgba(255,0,0,0.1)' : 'transparent'), border: 'none', color: isDead ? '#666' : (currentStation?.id === s.id ? '#32cd32' : '#ddd'), borderRadius: '6px', cursor: isDead ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', opacity: isDead ? 0.5 : 1 }}>
                {isDead ? <AlertCircle size={14} style={{ marginRight: '10px', color: 'red' }} /> : <Radio size={14} style={{ marginRight: '10px', opacity: 0.6 }} />}
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.9rem', textDecoration: isDead ? 'line-through' : 'none' }}>{s.name}</span>
                <span style={{ fontSize: '0.6rem', padding: '2px 4px', borderRadius: '4px', background: s.source==='garden'?'#008b8b':(s.source==='backup'?'#b8860b':'#333'), marginLeft: '5px' }}>
                    {s.source === 'garden' ? 'RG' : (s.source === 'backup' ? 'BK' : 'RB')}
                </span>
              </button>
            )})}
          </div>
        </div>
      )}

      {/* PLAYER */}
      <div style={styles.player}>
        <button onClick={() => { if(audioRef.current) { audioRef.current.muted = !isMuted; setIsMuted(!isMuted); }}} style={styles.btn}>
           {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>

        <button onClick={() => { if(!audioRef.current) return; audioRef.current.paused ? (audioRef.current.play(), setIsPlaying(true)) : (audioRef.current.pause(), setIsPlaying(false)); }} style={styles.playBtn}>
          {isPlaying ? <Pause color="black" fill="black" size={24} /> : <Play color="black" fill="black" size={24} style={{ marginLeft: '4px' }} />}
        </button>

        <button onClick={() => currentStation && handleDeadStream(currentStation, "Manual Skip")} style={styles.btn} title="Skip Dead Signal"><Zap size={24} /></button>
        
        <div style={{ flex: 1, maxWidth: '500px', marginLeft: '20px' }}>
          <div style={{ fontSize: '0.7rem', color: '#32cd32', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
             {isPlaying ? 'Signal Locked' : 'Receiver Standby'}
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'white' }}>
            {currentStation ? currentStation.name : 'Select Frequency'}
          </div>
        </div>

        <button onClick={() => currentStation && handleDeadStream(currentStation, "User Next")} style={styles.btn} title="Next"><SkipForward size={24} /></button>

        <audio 
            ref={audioRef} 
            crossOrigin="anonymous" 
            onEnded={onAudioEnded} 
            onError={onAudioError} 
        />
      </div>

      {error && (
        <div style={styles.err}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
             <AlertCircle size={16} style={{ marginRight: '8px' }} /> {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default RadioGardenClone;