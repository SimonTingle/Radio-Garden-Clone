import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Globe, Play, Pause, Radio, AlertCircle, SkipForward, RefreshCw } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- ROBUST CONFIGURATION ---

// 1. The "10 Fallbacks" - List of all known Radio Browser Mirrors
const API_MIRRORS = [
  "https://de1.api.radio-browser.info",
  "https://at1.api.radio-browser.info",
  "https://nl1.api.radio-browser.info",
  "https://us1.api.radio-browser.info",
  "https://fr1.api.radio-browser.info",
  "https://es1.api.radio-browser.info",
  "https://uk1.api.radio-browser.info",
  "https://nz1.api.radio-browser.info",
  "https://cn1.api.radio-browser.info",
  "https://fi1.api.radio-browser.info"
];

// 2. The "Nuclear Option" - Hardcoded stations if API is dead (Logic from your snippet's Dropbox JSON)
const FALLBACK_PLAYLIST: RadioStation[] = [
  { stationuuid: 'fb1', name: 'BBC Radio 1', url_resolved: 'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one', countrycode: 'GB', geo_lat: 51.5, geo_long: -0.1 },
  { stationuuid: 'fb2', name: 'KEXP 90.3 Seattle', url_resolved: 'https://live.kexp.org/kexp/aac/48k', countrycode: 'US', geo_lat: 47.6, geo_long: -122.3 },
  { stationuuid: 'fb3', name: 'Radio Paradise', url_resolved: 'https://stream.radioparadise.com/aac-320', countrycode: 'US', geo_lat: 39.7, geo_long: -121.6 },
  { stationuuid: 'fb4', name: 'Smooth Chill', url_resolved: 'https://media-ssl.musicradio.com/SmoothChill', countrycode: 'GB', geo_lat: 51.5, geo_long: -0.1 },
  { stationuuid: 'fb5', name: 'Ibiza Global Radio', url_resolved: 'https://listenssl.ibizaglobalradio.com:8024/ibizaglobalradio.mp3', countrycode: 'ES', geo_lat: 38.9, geo_long: 1.4 }
];

// 3. Leaflet Marker Setup
const MARKER_ICON = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// --- Types ---
interface RadioStation {
  stationuuid: string;
  name: string;
  url_resolved: string;
  countrycode: string;
  geo_lat: number | null;
  geo_long: number | null;
}

const RadioGardenClone: React.FC = () => {
  // --- State ---
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("System Ready");
  const [activeMirror, setActiveMirror] = useState<string>(API_MIRRORS[0]);

  // --- Refs ---
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    initMap();
    fetchTopStations();
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  // --- 1. Map Logic ---
  const initMap = () => {
    if (!mapContainerRef.current || mapRef.current) return;
    try {
      const map = L.map(mapContainerRef.current, {
        center: [46, 2], // Europe center
        zoom: 3,
        zoomControl: false,
        attributionControl: false 
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      
      // Refresh Logic: Search area when user clicks
      map.on('click', (e: L.LeafletMouseEvent) => {
        fetchStationsByLocation(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
    } catch (err) { handleError('Map Init Failed', err); }
  };

  // --- 2. The "10 Fallbacks" Fetcher ---
  // Loops through mirrors until one works.
  const fetchWithFallback = async (endpoint: string): Promise<any> => {
    
    // Try every mirror in the list
    for (const mirror of API_MIRRORS) {
      try {
        const url = `${mirror}${endpoint}`;
        // Note: No proxy used here. We go direct.
        const response = await fetch(url);
        
        if (response.ok) {
          setActiveMirror(mirror); // Remember the working mirror
          return await response.json();
        }
      } catch (e) {
        console.warn(`Mirror ${mirror} unreachable. Trying next...`);
      }
    }

    // If all 10 mirrors fail, throw error to trigger the "Nuclear Option"
    throw new Error("All API mirrors failed.");
  };

  const fetchTopStations = async () => {
    setLoading(true);
    setStatusMessage("Connecting to global network...");
    
    try {
      const data: RadioStation[] = await fetchWithFallback('/json/stations/topclick/500');
      const valid = data.filter(s => s.geo_lat && s.geo_long);
      setStations(valid);
      plotStations(valid);
      setStatusMessage(`Connected via ${activeMirror.split('//')[1]}`);
    } catch (err) {
      console.error("API Failure, loading fallback playlist.");
      // FALLBACK: Load the hardcoded list
      setStations(FALLBACK_PLAYLIST);
      plotStations(FALLBACK_PLAYLIST);
      setStatusMessage("Offline Mode: Using Backup Playlist");
      setError("API Offline. Loaded backup stations.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStationsByLocation = async (lat: number, lng: number) => {
    setLoading(true);
    setStatusMessage(`Scanning coordinates...`);
    mapRef.current?.flyTo([lat, lng], 8, { duration: 1 });

    try {
      const data: RadioStation[] = await fetchWithFallback(`/json/stations/bygeolatlong/${lat}/${lng}/100`);
      const valid = data.filter(s => s.geo_lat && s.geo_long);
      
      if (valid.length === 0) setStatusMessage("No signals in this sector.");
      else {
        setStations(valid);
        plotStations(valid);
        setStatusMessage(`Found ${valid.length} stations.`);
      }
    } catch (err) {
       handleError('Search failed', err);
    } finally {
       setLoading(false);
    }
  };

  // --- 3. Visuals ---
  const plotStations = (list: RadioStation[]) => {
    if (!mapRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    list.forEach(s => {
      const marker = L.circleMarker([s.geo_lat!, s.geo_long!], {
        radius: 6, fillColor: '#32cd32', color: '#fff', weight: 1, opacity: 0.9, fillOpacity: 0.7
      });
      marker.bindTooltip(`${s.name} (${s.countrycode})`);
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        playStation(s);
      });
      markersLayerRef.current?.addLayer(marker);
    });
  };

  // --- 4. Audio Logic (Inspired by your Snippet) ---
  
  const playStation = (s: RadioStation) => {
    if (!audioRef.current) return;
    
    setCurrentStation(s);
    setIsPlaying(true);
    setError(null);
    setStatusMessage(`Buffering: ${s.name}`);

    // Direct Stream URL
    audioRef.current.src = s.url_resolved; 
    
    const p = audioRef.current.play();
    if (p !== undefined) {
      p.catch(err => {
        if (err.name !== 'AbortError') {
          console.warn("Stream failed, attempting auto-skip...");
          handleStreamError(); // Trigger auto-next logic
        }
      });
    }
  };

  // Logic: "next_song" / "errorSong" from snippet
  // If current station fails, find it in the list and play the next one
  const handleStreamError = () => {
    if (!currentStation || stations.length === 0) return;

    const currentIndex = stations.findIndex(s => s.stationuuid === currentStation.stationuuid);
    const nextIndex = (currentIndex + 1) % stations.length;
    const nextStation = stations[nextIndex];

    console.log(`Station ${currentStation.name} failed. Auto-skipping to ${nextStation.name}`);
    setError(`Stream failed. Auto-tuning to: ${nextStation.name}`);
    
    // Slight delay to prevent infinite rapid loops
    setTimeout(() => playStation(nextStation), 1000); 
  };

  const playNext = () => {
    handleStreamError(); // Re-use the skip logic
  };

  const handleError = (ctx: string, err: any) => {
    console.error(ctx, err);
    if (err.name !== 'AbortError') setError(`${ctx}: ${err.message || 'Error'}`);
  };

  // --- Inline CSS ---
  const styles = {
    container: { position: 'relative' as const, width: '100vw', height: '100vh', background: '#0a0a0a', fontFamily: 'sans-serif', overflow: 'hidden' },
    mapLayer: { position: 'absolute' as const, inset: 0, zIndex: 0 },
    topBar: { position: 'absolute' as const, top: 0, left: 0, right: 0, zIndex: 10, padding: '15px 20px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)', display: 'flex', alignItems: 'center', color: 'white', pointerEvents: 'none' as const },
    logoText: { fontSize: '1.2rem', fontWeight: 'bold', margin: 0, lineHeight: 1 },
    subText: { fontSize: '0.75rem', color: '#32cd32', letterSpacing: '1px' },
    status: { fontSize: '0.7rem', color: '#aaa', marginTop: '2px', fontFamily: 'monospace' },
    sidebar: { position: 'absolute' as const, top: '80px', right: '20px', width: '320px', maxHeight: '60vh', background: 'rgba(15, 15, 15, 0.95)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', zIndex: 20, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' },
    listContainer: { overflowY: 'auto' as const, padding: '8px' },
    stationBtn: { width: '100%', textAlign: 'left' as const, padding: '12px', marginBottom: '4px', background: 'transparent', border: 'none', color: '#e0e0e0', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
    playerBar: { position: 'absolute' as const, bottom: 0, left: 0, right: 0, height: '100px', background: 'rgba(10, 10, 10, 0.95)', borderTop: '1px solid rgba(255,255,255,0.1)', zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px', backdropFilter: 'blur(10px)' },
    playButton: { width: '56px', height: '56px', borderRadius: '50%', background: '#32cd32', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 15px', cursor: 'pointer', boxShadow: '0 0 20px rgba(50,205,50,0.3)' },
    ctrlButton: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '10px', transition: 'color 0.2s' },
    errorMessage: { position: 'absolute' as const, top: '80px', left: '50%', transform: 'translateX(-50%)', background: '#7f1d1d', color: '#fecaca', padding: '10px 20px', borderRadius: '20px', zIndex: 50, display: 'flex', alignItems: 'center', border: '1px solid #991b1b', fontSize: '0.8rem' }
  };

  return (
    <div style={styles.container}>
      <div ref={mapContainerRef} style={styles.mapLayer} />
      
      <div style={styles.topBar}>
        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center' }}>
          <Globe size={28} color="#32cd32" style={{ marginRight: '12px' }} />
          <div>
            <h1 style={styles.logoText}>GLOBAL RADIO</h1>
            <div style={styles.subText}>MULTI-MIRROR SYSTEM</div>
            <div style={styles.status}>STATUS: {statusMessage}</div>
          </div>
        </div>
      </div>

      {stations.length > 0 && (
        <div style={styles.sidebar}>
          <div style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h2 style={{ margin: 0, color: '#32cd32', fontSize: '1.1rem', fontWeight: 'bold' }}>Frequency List</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#888' }}>{stations.length} channels</p>
            </div>
            <button onClick={() => fetchTopStations()} style={{ background: 'none', border: 'none', color: '#32cd32', cursor: 'pointer' }} title="Refresh List">
                <RefreshCw size={18} />
            </button>
          </div>
          <div style={styles.listContainer}>
            {stations.map(s => (
              <button key={s.stationuuid} onClick={() => playStation(s)}
                style={{ ...styles.stationBtn, background: currentStation?.stationuuid === s.stationuuid ? 'rgba(50, 205, 50, 0.15)' : 'transparent', color: currentStation?.stationuuid === s.stationuuid ? '#32cd32' : '#e0e0e0' }}
              >
                <Radio size={16} style={{ marginRight: '12px', opacity: 0.7 }} />
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.9rem' }}>{s.name}</span>
                {currentStation?.stationuuid === s.stationuuid && isPlaying && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#32cd32', boxShadow: '0 0 8px #32cd32' }} />}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={styles.playerBar}>
        {/* Mute Toggle */}
        <button onClick={() => { if(audioRef.current) { audioRef.current.muted = !isMuted; setIsMuted(!isMuted); }}} style={styles.ctrlButton}>
           {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>

        {/* Play/Pause */}
        <button onClick={() => { if(!audioRef.current) return; audioRef.current.paused ? (audioRef.current.play(), setIsPlaying(true)) : (audioRef.current.pause(), setIsPlaying(false)); }} style={styles.playButton}>
          {isPlaying ? <Pause color="black" fill="black" size={24} /> : <Play color="black" fill="black" size={24} style={{ marginLeft: '4px' }} />}
        </button>

        {/* Next Station (Snippet Logic) */}
        <button onClick={playNext} style={styles.ctrlButton} title="Next Station">
            <SkipForward size={24} />
        </button>
        
        <div style={{ flex: 1, maxWidth: '500px', marginLeft: '20px' }}>
          <div style={{ fontSize: '0.7rem', color: '#32cd32', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
             {isPlaying ? 'Broadcasting Live' : 'Receiver Standby'}
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'white' }}>
            {currentStation ? currentStation.name : 'Select a frequency...'}
          </div>
        </div>

        {/* The Audio Element with Error Handling from Snippet */}
        <audio 
          ref={audioRef} 
          crossOrigin="anonymous" 
          onEnded={playNext} 
          onError={handleStreamError} 
        />
      </div>

      {error && (
        <div style={styles.errorMessage}>
          <AlertCircle size={18} style={{ marginRight: '10px' }} />
          {error}
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fecaca', marginLeft: '15px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>
      )}
    </div>
  );
};

export default RadioGardenClone;