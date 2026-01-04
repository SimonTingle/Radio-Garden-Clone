// src/stations_db.ts

// @ts-ignore - Ignores error if json module resolution isn't perfect in your editor
import transformedStations from './stations_transformed.json';

// 1. THE SCHEMA
export interface RadioStation {
  id: string;
  name: string;
  url: string;
  country: string;
  lat: number;
  lon: number;
  source: 'browser' | 'garden' | 'backup' | 'json';
}

// 2. HARDCODED FAVORITES (Renamed from STATION_DATABASE to avoid conflict)
const HARDCODED_STATIONS: RadioStation[] = [
  // === GLOBAL FAVORITES ===
  { id: 'fb1', name: 'BBC Radio 1', url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one', country: 'GB', lat: 51.52, lon: -0.14, source: 'backup' },
  { id: 'fb2', name: 'KEXP 90.3 Seattle', url: 'https://live.kexp.org/kexp/aac/48k', country: 'US', lat: 47.62, lon: -122.33, source: 'backup' },
  { id: 'fb3', name: 'Radio Paradise', url: 'https://stream.radioparadise.com/aac-320', country: 'US', lat: 39.75, lon: -121.62, source: 'backup' },
  { id: 'fb4', name: 'Ibiza Global Radio', url: 'https://listenssl.ibizaglobalradio.com:8024/ibizaglobalradio.mp3', country: 'ES', lat: 38.90, lon: 1.42, source: 'backup' },
  { id: 'fb5', name: 'SomaFM Groove Salad', url: 'https://ice1.somafm.com/groovesalad-256-mp3', country: 'US', lat: 37.77, lon: -122.41, source: 'backup' },
  { id: 'fb6', name: 'FIP France', url: 'https://stream.radiofrance.fr/fip/fip.m3u8', country: 'FR', lat: 48.85, lon: 2.35, source: 'backup' },
  { id: 'fb7', name: 'NTS Radio 1', url: 'https://stream-relay-geo.ntslive.net/stream', country: 'GB', lat: 51.54, lon: -0.07, source: 'backup' },

  // === UNITED KINGDOM ===
  { id: 'uk2', name: 'BBC Radio 2', url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_two', country: 'GB', lat: 51.52, lon: -0.14, source: 'backup' },
  { id: 'uk3', name: 'BBC Radio 4', url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_fourfm', country: 'GB', lat: 51.52, lon: -0.14, source: 'backup' },
  { id: 'uk4', name: 'BBC World Service', url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service', country: 'GB', lat: 51.52, lon: -0.14, source: 'backup' },
  { id: 'uk5', name: 'BBC 6 Music', url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_6music', country: 'GB', lat: 51.52, lon: -0.14, source: 'backup' },
  { id: 'uk6', name: 'Capital FM London', url: 'https://media-ice.musicradio.com/CapitalMP3', country: 'GB', lat: 51.51, lon: -0.13, source: 'backup' },
  { id: 'uk7', name: 'Heart London', url: 'https://media-ice.musicradio.com/HeartLondonMP3', country: 'GB', lat: 51.51, lon: -0.13, source: 'backup' },
  { id: 'uk8', name: 'LBC News', url: 'https://media-ice.musicradio.com/LBCNews', country: 'GB', lat: 51.51, lon: -0.13, source: 'backup' },
  { id: 'uk9', name: 'Classic FM', url: 'https://media-ice.musicradio.com/ClassicFM', country: 'GB', lat: 51.51, lon: -0.13, source: 'backup' },
  { id: 'uk10', name: 'Smooth Radio', url: 'https://media-ice.musicradio.com/SmoothUK', country: 'GB', lat: 53.48, lon: -2.24, source: 'backup' },
  { id: 'uk12', name: 'NTS Radio 2', url: 'https://stream-relay-geo.ntslive.net/stream2', country: 'GB', lat: 51.54, lon: -0.07, source: 'backup' },
  { id: 'uk13', name: 'Rinse FM', url: 'https://streamer.dmbroadcast.net:8000/rinsefm_aac', country: 'GB', lat: 51.52, lon: -0.07, source: 'backup' },
  { id: 'uk14', name: 'Worldwide FM', url: 'https://worldwidefm.out.airtime.pro/worldwidefm_b', country: 'GB', lat: 51.56, lon: -0.08, source: 'backup' },
  { id: 'uk15', name: 'Soho Radio', url: 'https://sohoradio.out.airtime.pro/sohoradio_a', country: 'GB', lat: 51.51, lon: -0.13, source: 'backup' },
  { id: 'uk16', name: 'Reprezent 107.3', url: 'https://radio.canstream.co.uk:8075/live.mp3', country: 'GB', lat: 51.46, lon: -0.11, source: 'backup' },
  { id: 'uk17', name: 'Jazz FM', url: 'https://tx.sharp-stream.com/icecast.php?i=jazzfmmobile.mp3', country: 'GB', lat: 51.52, lon: -0.14, source: 'backup' },
  { id: 'uk18', name: 'Gold Radio', url: 'https://media-ice.musicradio.com/Gold', country: 'GB', lat: 51.51, lon: -0.13, source: 'backup' },
  { id: 'uk19', name: 'Absolute Radio', url: 'https://ais-sa2.cdnstream1.com/1988_128.mp3', country: 'GB', lat: 51.51, lon: -0.14, source: 'backup' },
  { id: 'uk20', name: 'Kiss FM', url: 'https://ais-sa2.cdnstream1.com/2449_128.mp3', country: 'GB', lat: 51.51, lon: -0.14, source: 'backup' },

  // === UNITED STATES (EAST COAST) ===
  { id: 'us_e1', name: 'WNYC 93.9', url: 'https://fm939.wnyc.org/wnycfm', country: 'US', lat: 40.71, lon: -74.00, source: 'backup' },
  { id: 'us_e2', name: 'WQXR Classical', url: 'https://stream.wqxr.org/wqxr', country: 'US', lat: 40.71, lon: -74.00, source: 'backup' },
  { id: 'us_e3', name: 'Hot 97', url: 'https://26483.live.streamtheworld.com/WQHTFM_SC', country: 'US', lat: 40.71, lon: -74.00, source: 'backup' },
  { id: 'us_e4', name: 'WFMU', url: 'https://stream0.wfmu.org/freeform-128k.mp3', country: 'US', lat: 40.71, lon: -74.04, source: 'backup' },
  { id: 'us_e5', name: 'The Lot Radio', url: 'https://thelot.out.airtime.pro/thelot_a', country: 'US', lat: 40.72, lon: -73.95, source: 'backup' },
  { id: 'us_e6', name: 'WXPN 88.5', url: 'https://wxpnhi.xpn.org/xpnhi', country: 'US', lat: 39.95, lon: -75.16, source: 'backup' },
  { id: 'us_e7', name: 'WGBH Boston', url: 'https://audio.wgbh.org/wgbh-247', country: 'US', lat: 42.36, lon: -71.05, source: 'backup' },
  { id: 'us_e8', name: 'WPFW Jazz', url: 'https://stream.wpfw.org/wpfw_128', country: 'US', lat: 38.90, lon: -77.03, source: 'backup' },
  { id: 'us_e9', name: 'WWOZ New Orleans', url: 'https://wwoz-sc.streamguys1.com/wwoz-hi.mp3', country: 'US', lat: 29.95, lon: -90.07, source: 'backup' },
  { id: 'us_e10', name: 'WSM Nashville', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/WSM_AM.mp3', country: 'US', lat: 36.16, lon: -86.78, source: 'backup' },

  // === UNITED STATES (WEST COAST) ===
  { id: 'us_w2', name: 'KCRW Eclectic', url: 'https://kcrw.streamguys1.com/kcrw_192k_mp3_on_air', country: 'US', lat: 34.01, lon: -118.49, source: 'backup' },
  { id: 'us_w3', name: 'KCRW News', url: 'https://kcrw.streamguys1.com/kcrw_news_192k_mp3_on_air', country: 'US', lat: 34.01, lon: -118.49, source: 'backup' },
  { id: 'us_w4', name: 'Dublab', url: 'https://dublab.out.airtime.pro/dublab_a', country: 'US', lat: 34.05, lon: -118.24, source: 'backup' },
  { id: 'us_w6', name: 'SomaFM Drone Zone', url: 'https://ice1.somafm.com/dronezone-256-mp3', country: 'US', lat: 37.77, lon: -122.41, source: 'backup' },
  { id: 'us_w7', name: 'SomaFM Indie Pop', url: 'https://ice1.somafm.com/indiepop-128-mp3', country: 'US', lat: 37.77, lon: -122.41, source: 'backup' },
  { id: 'us_w8', name: 'KPOO 89.5', url: 'https://stream.kpoo.com:8000/stream', country: 'US', lat: 37.77, lon: -122.43, source: 'backup' },
  { id: 'us_w9', name: 'KALX Berkeley', url: 'https://stream.kalx.berkeley.edu:8443/kalx-128.mp3', country: 'US', lat: 37.87, lon: -122.25, source: 'backup' },
  { id: 'us_w11', name: 'Radio Paradise Mellow', url: 'https://stream.radioparadise.com/mellow-320', country: 'US', lat: 39.75, lon: -121.62, source: 'backup' },
  { id: 'us_w12', name: 'Radio Paradise Rock', url: 'https://stream.radioparadise.com/rock-320', country: 'US', lat: 39.75, lon: -121.62, source: 'backup' },

  // === CANADA ===
  { id: 'ca1', name: 'CBC Radio 1 Toronto', url: 'https://cbc_r1_tor.akacast.akamaistream.net/7/632/451661/v1/rc.akacast.akamaistream.net/cbc_r1_tor', country: 'CA', lat: 43.65, lon: -79.38, source: 'backup' },
  { id: 'ca2', name: 'CBC Music', url: 'https://cbc_r2_tor.akacast.akamaistream.net/7/364/451661/v1/rc.akacast.akamaistream.net/cbc_r2_tor', country: 'CA', lat: 43.65, lon: -79.38, source: 'backup' },
  { id: 'ca3', name: 'CKUA', url: 'https://ckua.streamguys1.com/live', country: 'CA', lat: 53.54, lon: -113.49, source: 'backup' },
  { id: 'ca4', name: 'Indie 88', url: 'https://indie88.streamguys1.com/live', country: 'CA', lat: 43.65, lon: -79.38, source: 'backup' },
  { id: 'ca5', name: 'Boom 97.3', url: 'https://newcap.leanstream.co/CHBMFM-MP3', country: 'CA', lat: 43.65, lon: -79.38, source: 'backup' },

  // === GERMANY ===
  { id: 'de1', name: '1LIVE', url: 'https://wdr-1live-live.icecastssl.wdr.de/wdr/1live/live/mp3/128/stream.mp3', country: 'DE', lat: 50.93, lon: 6.95, source: 'backup' },
  { id: 'de2', name: 'WDR 2', url: 'https://wdr-wdr2-rheinland-live.icecastssl.wdr.de/wdr/wdr2/rheinland/mp3/128/stream.mp3', country: 'DE', lat: 50.93, lon: 6.95, source: 'backup' },
  { id: 'de3', name: 'SWR3', url: 'https://swr-swr3-live.cast.addradio.de/swr/swr3/live/mp3/128/stream.mp3', country: 'DE', lat: 48.77, lon: 9.18, source: 'backup' },
  { id: 'de4', name: 'Deutschlandfunk', url: 'https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3', country: 'DE', lat: 50.93, lon: 6.95, source: 'backup' },
  { id: 'de5', name: 'FluxFM Berlin', url: 'https://fluxfm.streamabc.net/flx-berlin-mp3-320-1234567', country: 'DE', lat: 52.50, lon: 13.44, source: 'backup' },
  { id: 'de6', name: 'Radio Eins', url: 'https://rbb-radioeins-live.cast.addradio.de/rbb/radioeins/live/mp3/128/stream.mp3', country: 'DE', lat: 52.50, lon: 13.40, source: 'backup' },
  { id: 'de7', name: 'Bayern 3', url: 'https://dispatcher.rndfnk.com/br/br3/live/mp3/low', country: 'DE', lat: 48.13, lon: 11.58, source: 'backup' },
  { id: 'de8', name: 'Fritz', url: 'https://rbb-fritz-live.cast.addradio.de/rbb/fritz/live/mp3/128/stream.mp3', country: 'DE', lat: 52.39, lon: 13.12, source: 'backup' },
  { id: 'de9', name: 'Sunshine Live', url: 'https://sunshinelive.streamabc.net/sunshinelive-mp3-128-1234567', country: 'DE', lat: 49.48, lon: 8.46, source: 'backup' },
  { id: 'de10', name: 'BigFM', url: 'https://audiotainment-sw.streamabc.net/atsw-bigfm-mp3-128-4455666', country: 'DE', lat: 48.77, lon: 9.18, source: 'backup' },

  // === FRANCE ===
  { id: 'fr2', name: 'France Inter', url: 'https://stream.radiofrance.fr/franceinter/franceinter.m3u8', country: 'FR', lat: 48.85, lon: 2.35, source: 'backup' },
  { id: 'fr3', name: 'France Info', url: 'https://stream.radiofrance.fr/franceinfo/franceinfo.m3u8', country: 'FR', lat: 48.85, lon: 2.35, source: 'backup' },
  { id: 'fr4', name: 'Radio Nova', url: 'https://novazz.ice.infomaniak.ch/novazz-128.mp3', country: 'FR', lat: 48.85, lon: 2.38, source: 'backup' },
  { id: 'fr5', name: 'NRJ', url: 'https://scdn.nrjaudio.fm/audio1/fr/30001/mp3_128.mp3', country: 'FR', lat: 48.85, lon: 2.35, source: 'backup' },
  { id: 'fr6', name: 'Skyrock', url: 'https://icecast.skyrock.net/s/natio_mp3_128k', country: 'FR', lat: 48.85, lon: 2.35, source: 'backup' },
  { id: 'fr7', name: 'Fun Radio', url: 'https://icecast.funradio.fr/fun-1-44-128', country: 'FR', lat: 48.85, lon: 2.35, source: 'backup' },
  { id: 'fr8', name: 'RTL', url: 'https://icecast.rtl.fr/rtl-1-44-128', country: 'FR', lat: 48.85, lon: 2.35, source: 'backup' },
  { id: 'fr9', name: 'Radio Meuh', url: 'https://radiomeuh.ice.infomaniak.ch/radiomeuh-128.mp3', country: 'FR', lat: 45.92, lon: 6.14, source: 'backup' },
  { id: 'fr10', name: 'TSF Jazz', url: 'https://tsfjazz.ice.infomaniak.ch/tsfjazz-high.mp3', country: 'FR', lat: 48.85, lon: 2.35, source: 'backup' },

  // === SPAIN ===
  { id: 'es1', name: 'Cadena SER', url: 'https://22433.live.streamtheworld.com/CADENASER.mp3', country: 'ES', lat: 40.41, lon: -3.70, source: 'backup' },
  { id: 'es2', name: 'COPE', url: 'https://flucast-b02-04.flumotion.com/cope/net1.mp3', country: 'ES', lat: 40.45, lon: -3.69, source: 'backup' },
  { id: 'es3', name: 'Onda Cero', url: 'https://icecast-streaming.ondacero.es/ondacero.mp3', country: 'ES', lat: 40.43, lon: -3.68, source: 'backup' },
  { id: 'es4', name: 'RNE Nacional', url: 'https://rne.rtveradio.cires21.com/rne/radio1/icecast.audio', country: 'ES', lat: 40.42, lon: -3.71, source: 'backup' },
  { id: 'es5', name: 'LOS40', url: 'https://20853.live.streamtheworld.com/LOS40_SC', country: 'ES', lat: 40.46, lon: -3.65, source: 'backup' },
  { id: 'es6', name: 'RAC1', url: 'https://streaming.rac1.cat/', country: 'ES', lat: 41.38, lon: 2.17, source: 'backup' },
  { id: 'es7', name: 'Canal Sur', url: 'https://edigital.canalsur.es/radiodirecto', country: 'ES', lat: 37.38, lon: -5.98, source: 'backup' },
  { id: 'es8', name: 'Euskadi Irratia', url: 'https://mp3-eitb.stream.flumotion.com/eitb/euskadi_irratia.mp3', country: 'ES', lat: 43.26, lon: -2.93, source: 'backup' },
  { id: 'es10', name: 'Radio Marca', url: 'https://icecast-streaming.ondacero.es/radiomarca.mp3', country: 'ES', lat: 40.40, lon: -3.68, source: 'backup' },
  { id: 'es11', name: 'Kiss FM', url: 'https://kissfm.kissfmradio.cires21.com/kissfm.mp3', country: 'ES', lat: 40.41, lon: -3.72, source: 'backup' },
  { id: 'es12', name: 'Rock FM', url: 'https://flucast-b02-02.flumotion.com/cope/rockfm.mp3', country: 'ES', lat: 40.44, lon: -3.67, source: 'backup' },
  { id: 'es13', name: 'Cadena 100', url: 'https://flucast-b02-01.flumotion.com/cope/cadena100.mp3', country: 'ES', lat: 40.45, lon: -3.68, source: 'backup' },
  { id: 'es14', name: 'Flaix FM', url: 'https://flaixfm.streaming-pro.com/flaixfm', country: 'ES', lat: 41.38, lon: 2.18, source: 'backup' },
  { id: 'es15', name: 'Canal Fiesta', url: 'https://edigital.canalsur.es/canalfiestadirecto', country: 'ES', lat: 37.40, lon: -5.99, source: 'backup' },

  // === NETHERLANDS ===
  { id: 'nl1', name: 'NPO Radio 1', url: 'https://icecast.omroep.nl/radio1-bb-mp3', country: 'NL', lat: 52.37, lon: 4.89, source: 'backup' },
  { id: 'nl2', name: 'NPO Radio 2', url: 'https://icecast.omroep.nl/radio2-bb-mp3', country: 'NL', lat: 52.37, lon: 4.89, source: 'backup' },
  { id: 'nl3', name: 'Radio 538', url: 'https://22543.live.streamtheworld.com/RADIO538.mp3', country: 'NL', lat: 52.22, lon: 5.17, source: 'backup' },
  { id: 'nl4', name: 'Sky Radio', url: 'https://22533.live.streamtheworld.com/SKYRADIO.mp3', country: 'NL', lat: 52.22, lon: 5.17, source: 'backup' },
  { id: 'nl5', name: 'Qmusic', url: 'https://icecast-qmusicnl-cdp.triple-it.nl/Qmusic_nl_live_96.mp3', country: 'NL', lat: 52.37, lon: 4.89, source: 'backup' },
  { id: 'nl6', name: 'SLAM!', url: 'https://stream.slam.nl/slam_mp3', country: 'NL', lat: 52.22, lon: 5.17, source: 'backup' },

  // === ITALY ===
  { id: 'it1', name: 'Rai Radio 1', url: 'https://icestreaming.rai.it/1.mp3', country: 'IT', lat: 41.90, lon: 12.49, source: 'backup' },
  { id: 'it2', name: 'RTL 102.5', url: 'https://streamingv2.shoutcast.com/RTL-1025', country: 'IT', lat: 45.46, lon: 9.19, source: 'backup' },
  { id: 'it3', name: 'Radio Deejay', url: 'https://stream.radiodeejay.it/radiodeejay/mp3/aac', country: 'IT', lat: 45.46, lon: 9.19, source: 'backup' },
  { id: 'it4', name: 'Radio 105', url: 'https://icecast.unitedradio.it/Radio105.mp3', country: 'IT', lat: 45.46, lon: 9.19, source: 'backup' },
  { id: 'it5', name: 'Radio Italia', url: 'https://radioitaliasmi.akamaized.net/hls/live/2093122/RISMI/stream01/streamPlaylist.m3u8', country: 'IT', lat: 45.46, lon: 9.19, source: 'backup' },

  // === LATIN AMERICA ===
  { id: 'br1', name: 'Jovem Pan FM', url: 'https://str.jovempanfm.com.br/jovempanfm_saopaulo.mp3', country: 'BR', lat: -23.55, lon: -46.63, source: 'backup' },
  { id: 'br2', name: 'Antena 1', url: 'https://stream.antena1.com.br/stream3', country: 'BR', lat: -23.55, lon: -46.63, source: 'backup' },
  { id: 'br3', name: 'Radio Globo', url: 'https://ice.fabricahost.com.br/radiogloborj', country: 'BR', lat: -22.90, lon: -43.17, source: 'backup' },
  { id: 'ar1', name: 'Radio Mitre', url: 'https://24153.live.streamtheworld.com/RADIO_MITRE_SC', country: 'AR', lat: -34.60, lon: -58.38, source: 'backup' },
  { id: 'ar2', name: 'La 100', url: 'https://24243.live.streamtheworld.com/LA_100_SC', country: 'AR', lat: -34.60, lon: -58.38, source: 'backup' },
  { id: 'mx1', name: 'W Radio', url: 'https://20833.live.streamtheworld.com/WRADIOMEXICO_SC', country: 'MX', lat: 19.43, lon: -99.13, source: 'backup' },
  { id: 'mx2', name: 'Alfa 91.3', url: 'https://24443.live.streamtheworld.com/XHFAFM_SC', country: 'MX', lat: 19.43, lon: -99.13, source: 'backup' },

  // === AUSTRALIA & NZ ===
  { id: 'au1', name: 'Triple J', url: 'https://live-radio01.mediahubaustralia.com/2TJW/mp3/', country: 'AU', lat: -33.86, lon: 151.20, source: 'backup' },
  { id: 'au2', name: 'ABC News', url: 'https://live-radio01.mediahubaustralia.com/PBW/mp3/', country: 'AU', lat: -33.86, lon: 151.20, source: 'backup' },
  { id: 'au3', name: 'Nova 96.9', url: 'https://streaming.novaentertainment.com.au/nova969', country: 'AU', lat: -33.86, lon: 151.20, source: 'backup' },
  { id: 'au4', name: 'KIIS 106.5', url: 'https://stream.arn.com.au/kiis1065', country: 'AU', lat: -33.86, lon: 151.20, source: 'backup' },
  { id: 'nz1', name: 'RNZ National', url: 'https://liveradio.rnz.co.nz/live/national/playlist.m3u8', country: 'NZ', lat: -41.28, lon: 174.77, source: 'backup' },
  { id: 'nz2', name: 'The Edge', url: 'https://ais-nzme.streamguys1.com/nz_005_aac', country: 'NZ', lat: -36.84, lon: 174.76, source: 'backup' },
  { id: 'nz3', name: 'George FM', url: 'https://ais-nzme.streamguys1.com/nz_007_aac', country: 'NZ', lat: -36.84, lon: 174.76, source: 'backup' },

  // === ASIA ===
  { id: 'jp1', name: 'Shonan Beach FM', url: 'https://beachfm.out.airtime.pro/beachfm_a', country: 'JP', lat: 35.31, lon: 139.55, source: 'backup' },
  { id: 'jp2', name: 'Ottava', url: 'https://ottava-stream.mixlr.com/events/0638a164a66e5f1e', country: 'JP', lat: 35.68, lon: 139.76, source: 'backup' },
  { id: 'kr1', name: 'TBS eFM', url: 'http://tbs.seoul.kr/player/live/efm.m3u8', country: 'KR', lat: 37.56, lon: 126.97, source: 'backup' },
  { id: 'in1', name: 'Radio City', url: 'https://prclive1.listenon.in/Hindi', country: 'IN', lat: 19.07, lon: 72.87, source: 'backup' },
  { id: 'in2', name: 'Big FM', url: 'https://sc-bb.1.fm:8017', country: 'IN', lat: 28.61, lon: 77.20, source: 'backup' },

  // === MISC / INTERNET RADIO ===
  { id: 'net1', name: 'Cinemix', url: 'https://kathy.torontocast.com:1825/stream', country: 'US', lat: 40.71, lon: -74.00, source: 'backup' },
  { id: 'net2', name: 'Nightwave Plaza', url: 'https://radio.plaza.one/mp3', country: 'US', lat: 34.05, lon: -118.24, source: 'backup' },
  { id: 'net3', name: 'Radio Swiss Jazz', url: 'https://stream.srg-ssr.ch/m/rsj/mp3_128', country: 'CH', lat: 46.94, lon: 7.44, source: 'backup' },
  { id: 'net4', name: 'Lofi Hip Hop', url: 'https://play.streamafrica.net/lofiradio', country: 'US', lat: 34.05, lon: -118.24, source: 'backup' },
  { id: 'net5', name: 'Deep House Radio', url: 'https://listen.deephouseradio.com/', country: 'IE', lat: 53.34, lon: -6.26, source: 'backup' },
  
  // ==========================================
  // AFRICA
  // ==========================================
  { id: 'za1', name: '5FM South Africa', url: 'https://20863.live.streamtheworld.com/5FM.mp3', country: 'ZA', lat: -26.20, lon: 28.04, source: 'backup' },
  { id: 'za2', name: 'Jacaranda FM', url: 'https://jacarandafm.antfarm.co.za/jacaranda', country: 'ZA', lat: -25.74, lon: 28.22, source: 'backup' },
  { id: 'ng1', name: 'Beat 99.9 FM Lagos', url: 'https://stream.thebeat99.com/beat999', country: 'NG', lat: 6.52, lon: 3.37, source: 'backup' },
  { id: 'ng2', name: 'Cool FM Nigeria', url: 'https://stream.coolwazobiainfo.com/coolfm-lagos', country: 'NG', lat: 6.52, lon: 3.37, source: 'backup' },
  { id: 'ke1', name: 'Capital FM Kenya', url: 'https://ice.capitalfm.co.ke/capitalfm', country: 'KE', lat: -1.29, lon: 36.82, source: 'backup' },
  { id: 'gh1', name: 'Joy FM Ghana', url: 'https://stream.zeno.fm/k2s9k052538uv', country: 'GH', lat: 5.60, lon: -0.18, source: 'backup' },
  { id: 'ma1', name: 'Hit Radio Morocco', url: 'https://hitradio-maroc.ice.infomaniak.ch/hitradio-maroc-128.mp3', country: 'MA', lat: 33.57, lon: -7.58, source: 'backup' },
  { id: 'eg1', name: 'Nile FM', url: 'https://nilefm.radioca.st/stream', country: 'EG', lat: 30.04, lon: 31.23, source: 'backup' },

  // ==========================================
  // MIDDLE EAST
  // ==========================================
  { id: 'tr1', name: 'Power FM Turkey', url: 'https://listen.powerapp.com.tr/powerfm/mpeg/128/icecast.audio', country: 'TR', lat: 41.00, lon: 28.97, source: 'backup' },
  { id: 'tr2', name: 'Joy FM', url: 'https://listen.powerapp.com.tr/joyfm/mpeg/128/icecast.audio', country: 'TR', lat: 41.00, lon: 28.97, source: 'backup' },
  { id: 'ae1', name: 'Virgin Radio Dubai', url: 'https://stream.arn.com.au/virginradio', country: 'AE', lat: 25.20, lon: 55.27, source: 'backup' },
  { id: 'il1', name: 'Galgalatz', url: 'https://glzwizzlv.bynetcdn.com/glglz_mp3', country: 'IL', lat: 32.08, lon: 34.78, source: 'backup' },

  // ==========================================
  // ASIA (Expanded)
  // ==========================================
  { id: 'jp2_new', name: 'J-Wave', url: 'https://radiko.jp/v2/api/ts/playlist.m3u8?station_id=FMJ', country: 'JP', lat: 35.66, lon: 139.73, source: 'backup' },
  { id: 'cn1', name: 'RTHK Radio 3 Hong Kong', url: 'https://rthk.hk/live1/radio3', country: 'CN', lat: 22.31, lon: 114.16, source: 'backup' },
  { id: 'sg1', name: 'Class 95 Singapore', url: 'https://21303.live.streamtheworld.com/CLASS95_SC', country: 'SG', lat: 1.35, lon: 103.81, source: 'backup' },
  { id: 'th1', name: 'Met 107 Bangkok', url: 'https://rcs.mcot.net/met107', country: 'TH', lat: 13.75, lon: 100.50, source: 'backup' },
  { id: 'ph1', name: 'Monster RX 93.1', url: 'https://s3.voscast.com:8405/stream', country: 'PH', lat: 14.59, lon: 120.98, source: 'backup' },
  { id: 'id1', name: 'Prambors FM Jakarta', url: 'https://masima.rastream.com/masima-pramborsjakarta', country: 'ID', lat: -6.20, lon: 106.84, source: 'backup' },
];

// 3. PROCESS THE JSON IMPORT
// We map the JSON to ensure it matches the RadioStation interface safely
const JSON_STATIONS: RadioStation[] = (transformedStations as any[]).map((s, index) => {
  return {
    // Use existing ID or generate one to prevent "duplicate key" errors
    id: s.id || `json-${index}`,
    
    // Fallback for missing names
    name: s.name || "Unknown Station",
    
    // Ensure URL exists
    url: s.url || "",
    
    // Fallback for country
    country: s.country || "Unknown",
    
    // Convert null/undefined lat/lon to 0 so the app doesn't crash
    lat: typeof s.lat === 'number' ? s.lat : 0,
    lon: typeof s.lon === 'number' ? s.lon : 0,
    
    // Mark source as 'json' (or 'backup')
    source: 'json' as const
  };
})
// Filter out invalid entries that would break the map (0,0 coords or empty URLs)
.filter(s => s.url !== "" && (s.lat !== 0 || s.lon !== 0));

// 4. EXPORT THE COMBINED LIST
// App.tsx imports this single array, so it now sees EVERYTHING.
export const STATION_DATABASE: RadioStation[] = [
  ...HARDCODED_STATIONS,
  ...JSON_STATIONS
];