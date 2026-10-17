import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Code2,
  Download,
  Settings as SettingsIcon,
  RefreshCw,
  Camera,
  Sliders,
  Send,
  Paperclip,
  X,
  Sparkles,
  Check,
  ChevronDown,
  Layers,
  Activity,
  Copy,
  Folder,
  FileCode,
  FileText,
  ShieldCheck,
  Zap,
  TrendingUp,
  Maximize2,
  Minimize2,
  Info,
  Bell,
  BellRing,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Target
} from 'lucide-react';
import JSZip from 'jszip';
import { ANDROID_FILES, AndroidFile } from './androidFilesData';

export interface DetectedPattern {
  name: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  currentPrice: number;
  breakoutLevel: number;
  supportLevel: number;
  resistanceLevel: number;
  targetProfit: number;
  stopLoss: number;
  summary: string;
  timestamp: number;
  symbol: string;
}

export interface CurrencyPair {
  symbol: string;
  name: string;
  displayName: string;
  tradingViewSymbol: string;
  decimals: number;
  category: 'Metals' | 'Forex' | 'Index';
  defaultSupport: number;
  defaultResistance: number;
}

export const SUPPORTED_PAIRS: CurrencyPair[] = [
  {
    symbol: 'XAUUSD',
    name: 'Gold Spot / US Dollar',
    displayName: 'XAU/USD (Gold)',
    tradingViewSymbol: 'OANDA:XAUUSD',
    decimals: 2,
    category: 'Metals',
    defaultSupport: 2660.00,
    defaultResistance: 2685.00,
  },
  {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    displayName: 'EUR/USD',
    tradingViewSymbol: 'FX:EURUSD',
    decimals: 4,
    category: 'Forex',
    defaultSupport: 1.0820,
    defaultResistance: 1.0910,
  },
  {
    symbol: 'USDJPY',
    name: 'US Dollar / Japanese Yen',
    displayName: 'USD/JPY',
    tradingViewSymbol: 'FX:USDJPY',
    decimals: 2,
    category: 'Forex',
    defaultSupport: 151.80,
    defaultResistance: 153.20,
  },
  {
    symbol: 'GBPUSD',
    name: 'British Pound / US Dollar',
    displayName: 'GBP/USD',
    tradingViewSymbol: 'FX:GBPUSD',
    decimals: 4,
    category: 'Forex',
    defaultSupport: 1.2930,
    defaultResistance: 1.3040,
  },
  {
    symbol: 'USDCAD',
    name: 'US Dollar / Canadian Dollar',
    displayName: 'USD/CAD',
    tradingViewSymbol: 'FX:USDCAD',
    decimals: 4,
    category: 'Forex',
    defaultSupport: 1.3780,
    defaultResistance: 1.3890,
  },
  {
    symbol: 'USDCHF',
    name: 'US Dollar / Swiss Franc',
    displayName: 'USD/CHF',
    tradingViewSymbol: 'FX:USDCHF',
    decimals: 4,
    category: 'Forex',
    defaultSupport: 0.8610,
    defaultResistance: 0.8710,
  },
  {
    symbol: 'DXY',
    name: 'US Dollar Currency Index',
    displayName: 'DXY (Dollar Index)',
    tradingViewSymbol: 'CAPITALCOM:DXY',
    decimals: 2,
    category: 'Index',
    defaultSupport: 103.20,
    defaultResistance: 104.50,
  },
];

interface PriceTick {
  symbol: string;
  name: string;
  price: number;
  bid: number;
  ask: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  decimals: number;
  timestamp: number;
}

interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  alertType: 'SUPPORT' | 'RESISTANCE';
  note: string;
  isEnabled: boolean;
  isTriggered: boolean;
  createdAt: number;
}

interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  image?: string;
  model?: string;
}

interface AppSettings {
  provider: 'gemini' | 'groq' | 'openai' | 'openrouter';
  modelType: string;
  geminiApiKey: string;
  groqApiKey: string;
  groqModel: string;
  openAiApiKey: string;
  openAiModel: string;
  openRouterApiKey: string;
  openRouterModel: string;
  temperature: number;
  maxTokens: number;
  systemInstruction: string;
}

const DEFAULT_INSTRUCTION =
  'Kamu adalah analis forex profesional yang ahli membaca chart TradingView. Jawab ringkas, terstruktur, dan sertakan level harga konkret jika terlihat di chart.';

const INITIAL_SETTINGS: AppSettings = {
  provider: 'gemini',
  modelType: 'gemini-3.8-flash',
  geminiApiKey: '',
  groqApiKey: '',
  groqModel: 'llama-3.3-70b-versatile',
  openAiApiKey: '',
  openAiModel: 'gpt-4o-mini',
  openRouterApiKey: '',
  openRouterModel: 'google/gemini-flash-1.5',
  temperature: 0.7,
  maxTokens: 2048,
  systemInstruction: DEFAULT_INSTRUCTION,
};

const TEMPLATE_QUESTIONS = [
  'Analisa trend saat ini',
  'Cari area support & resistance',
  'Ada pola candlestick penting?',
  'Sinyal entry buy/sell?',
  'Rekomendasi SL & TP',
  'Kondisi overbought/oversold?',
  'Breakout atau fakeout?',
];

const ALL_INDICATORS = [
  'EMA 20',
  'EMA 50',
  'EMA 200',
  'RSI',
  'MACD',
  'Bollinger Bands',
  'Volume',
  'Stochastic',
  'Fibonacci',
];

export default function App() {
  // Navigation & mode states
  const [activeTab, setActiveTab] = useState<'simulator' | 'code'>('simulator');
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'settings'>('dashboard');

  // Pair selection state
  const [selectedPairSymbol, setSelectedPairSymbol] = useState<string>('XAUUSD');
  const selectedPair = SUPPORTED_PAIRS.find((p) => p.symbol === selectedPairSymbol) || SUPPORTED_PAIRS[0];

  // Chart settings
  const [timeframe, setTimeframe] = useState('1H');
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['EMA 20', 'RSI']);
  const [isTfDropdownOpen, setIsTfDropdownOpen] = useState(false);
  const [isIndicatorsModalOpen, setIsIndicatorsModalOpen] = useState(false);
  const [chartKey, setChartKey] = useState(1);

  // Multi-Pair Price Ticks State
  const [allTicks, setAllTicks] = useState<Record<string, PriceTick>>({
    XAUUSD: {
      symbol: 'XAUUSD',
      name: 'Gold Spot / US Dollar',
      price: 2674.85,
      bid: 2674.65,
      ask: 2675.05,
      change: 6.35,
      changePercent: 0.24,
      high: 2682.40,
      low: 2662.10,
      decimals: 2,
      timestamp: Date.now(),
    },
    EURUSD: {
      symbol: 'EURUSD',
      name: 'Euro / US Dollar',
      price: 1.0864,
      bid: 1.0863,
      ask: 1.0865,
      change: 0.0022,
      changePercent: 0.20,
      high: 1.0895,
      low: 1.0830,
      decimals: 4,
      timestamp: Date.now(),
    },
    USDJPY: {
      symbol: 'USDJPY',
      name: 'US Dollar / Japanese Yen',
      price: 152.45,
      bid: 152.43,
      ask: 152.47,
      change: 0.55,
      changePercent: 0.36,
      high: 153.10,
      low: 151.75,
      decimals: 2,
      timestamp: Date.now(),
    },
    GBPUSD: {
      symbol: 'GBPUSD',
      name: 'British Pound / US Dollar',
      price: 1.2982,
      bid: 1.2980,
      ask: 1.2984,
      change: 0.0032,
      changePercent: 0.25,
      high: 1.3020,
      low: 1.2940,
      decimals: 4,
      timestamp: Date.now(),
    },
    USDCAD: {
      symbol: 'USDCAD',
      name: 'US Dollar / Canadian Dollar',
      price: 1.3835,
      bid: 1.3833,
      ask: 1.3837,
      change: 0.0025,
      changePercent: 0.18,
      high: 1.3870,
      low: 1.3795,
      decimals: 4,
      timestamp: Date.now(),
    },
    USDCHF: {
      symbol: 'USDCHF',
      name: 'US Dollar / Swiss Franc',
      price: 0.8654,
      bid: 0.8652,
      ask: 0.8656,
      change: 0.0014,
      changePercent: 0.16,
      high: 0.8690,
      low: 0.8625,
      decimals: 4,
      timestamp: Date.now(),
    },
    DXY: {
      symbol: 'DXY',
      name: 'US Dollar Currency Index',
      price: 103.85,
      bid: 103.82,
      ask: 103.88,
      change: 0.35,
      changePercent: 0.34,
      high: 104.20,
      low: 103.40,
      decimals: 2,
      timestamp: Date.now(),
    },
  });

  // Animated Price Change Flash state
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const prevPriceMap = useRef<Record<string, number>>({});

  // Price Alerts State
  const [alerts, setAlerts] = useState<PriceAlert[]>([
    {
      id: 'alert-1',
      symbol: 'XAUUSD',
      targetPrice: 2665.00,
      alertType: 'SUPPORT',
      note: 'Support kuat H1 - siap entry buy limit',
      isEnabled: true,
      isTriggered: false,
      createdAt: Date.now() - 3600000,
    },
    {
      id: 'alert-2',
      symbol: 'XAUUSD',
      targetPrice: 2685.00,
      alertType: 'RESISTANCE',
      note: 'Resistance psikologis - pasang trailing stop',
      isEnabled: true,
      isTriggered: false,
      createdAt: Date.now() - 7200000,
    },
    {
      id: 'alert-3',
      symbol: 'EURUSD',
      targetPrice: 1.0840,
      alertType: 'SUPPORT',
      note: 'Support harian EUR/USD',
      isEnabled: true,
      isTriggered: false,
      createdAt: Date.now() - 1800000,
    },
    {
      id: 'alert-4',
      symbol: 'USDJPY',
      targetPrice: 153.00,
      alertType: 'RESISTANCE',
      note: 'Breakout key resistance 153',
      isEnabled: true,
      isTriggered: false,
      createdAt: Date.now() - 900000,
    },
  ]);

  // One-Tap Technical Analysis state
  const [isScanningPattern, setIsScanningPattern] = useState(false);
  const [detectedPattern, setDetectedPattern] = useState<DetectedPattern | null>(null);
  const [showPatternOverlay, setShowPatternOverlay] = useState(true);

  const [isAddAlertDialogOpen, setIsAddAlertDialogOpen] = useState(false);
  const [newAlertType, setNewAlertType] = useState<'SUPPORT' | 'RESISTANCE'>('SUPPORT');
  const [newAlertPrice, setNewAlertPrice] = useState('');
  const [newAlertNote, setNewAlertNote] = useState('');
  const [activeHeadsUpNotification, setActiveHeadsUpNotification] = useState<{
    symbol: string;
    title: string;
    message: string;
    type: 'SUPPORT' | 'RESISTANCE';
    price: number;
  } | null>(null);

  // Screenshot & Analysis Modal
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisPrompt, setAnalysisPrompt] = useState('');

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '👋 Halo! Saya asisten AI Market Analyzer. Anda dapat memilih pair (XAU/USD, EUR/USD, USD/JPY, GBP/USD, USD/CAD, USD/CHF, DXY) di atas, memantau animated price change real-time, memasang Price Alert Support/Resistance, atau menekan 📸 **Screenshot** untuk analisa teknikal visual instan!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: 'Gemini 3.8 Flash',
    },
  ]);
  const [inputChat, setInputChat] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('xauusd_ai_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_SETTINGS;
      }
    }
    return INITIAL_SETTINGS;
  });
  const [tempSettings, setTempSettings] = useState<AppSettings>(settings);
  const [isTestingEndpoint, setIsTestingEndpoint] = useState(false);

  // Code Explorer state
  const [selectedFile, setSelectedFile] = useState<AndroidFile>(ANDROID_FILES[0]);
  const [codeSearchQuery, setCodeSearchQuery] = useState('');
  const [isZipping, setIsZipping] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const activeTick = allTicks[selectedPairSymbol] || allTicks.XAUUSD;
  const isBullish = activeTick.change >= 0;

  // Audio chime for price alert breach
  const playAlertChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      // ignore audio context restrictions
    }
  };

  // Real-time WebSocket connection to /ws/price for multi-pair stream
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/price`;

      try {
        ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);

            if (parsed.type === 'multi_price_tick' || parsed.type === 'all_pairs_snapshot') {
              const newTicks: Record<string, PriceTick> = parsed.data;

              // Check price change animation for currently viewed pair
              const currentActive = newTicks[selectedPairSymbol];
              if (currentActive) {
                const prevPrice = prevPriceMap.current[selectedPairSymbol];
                if (prevPrice !== undefined) {
                  if (currentActive.price > prevPrice) {
                    setPriceFlash('up');
                  } else if (currentActive.price < prevPrice) {
                    setPriceFlash('down');
                  }
                  setTimeout(() => setPriceFlash(null), 600);
                }
                prevPriceMap.current[selectedPairSymbol] = currentActive.price;
              }

              // Update ticks map
              setAllTicks(newTicks);

              // Check alerts across all pairs
              setAlerts((currentAlerts) =>
                currentAlerts.map((alert) => {
                  if (!alert.isEnabled || alert.isTriggered) return alert;
                  const tick = newTicks[alert.symbol];
                  if (!tick) return alert;

                  const isBreached =
                    alert.alertType === 'SUPPORT'
                      ? tick.price <= alert.targetPrice
                      : tick.price >= alert.targetPrice;

                  if (isBreached) {
                    playAlertChime();

                    setActiveHeadsUpNotification({
                      symbol: alert.symbol,
                      title:
                        alert.alertType === 'SUPPORT'
                          ? `🔴 ${alert.symbol} Menembus Support: $${tick.decimals === 4 ? alert.targetPrice.toFixed(4) : alert.targetPrice.toFixed(2)}`
                          : `🟢 ${alert.symbol} Menembus Resistance: $${tick.decimals === 4 ? alert.targetPrice.toFixed(4) : alert.targetPrice.toFixed(2)}`,
                      message: `Harga saat ini: ${tick.decimals === 4 ? tick.price.toFixed(4) : tick.price.toFixed(2)}. ${alert.note || 'Tingkat harga terpenuhi.'}`,
                      type: alert.alertType,
                      price: tick.price,
                    });

                    setMessages((prevMsgs) => [
                      ...prevMsgs,
                      {
                        id: 'alert-' + Date.now(),
                        role: 'assistant',
                        content: `🚨 **PRICE ALERT TRIGGERED!**\n**${alert.symbol}** telah menembus level **${alert.alertType}** di **${tick.decimals === 4 ? alert.targetPrice.toFixed(4) : alert.targetPrice.toFixed(2)}**.\n\n• **Harga Terkini**: ${tick.decimals === 4 ? tick.price.toFixed(4) : tick.price.toFixed(2)}\n• **Catatan**: ${alert.note || 'Level support/resistance tertembus'}\n\n💡 *Rekomendasi:* Periksa konfirmasi candlestick M15/H1 sebelum entry atau sesuaikan trailing stop.`,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        model: 'Live WebSocket Engine',
                      },
                    ]);

                    return { ...alert, isTriggered: true };
                  }
                  return alert;
                })
              );
            }
          } catch (e) {
            console.error('WS parse error', e);
          }
        };

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWs, 3000);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch (e) {
        reconnectTimeout = setTimeout(connectWs, 3000);
      }
    };

    connectWs();

    return () => {
      clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, [selectedPairSymbol]);

  // Reset pattern when pair changes to guarantee price synchronization with chart
  useEffect(() => {
    if (detectedPattern && detectedPattern.symbol !== selectedPairSymbol) {
      setDetectedPattern(null);
    }
  }, [selectedPairSymbol]);

  // Auto-dismiss heads up notification
  useEffect(() => {
    if (activeHeadsUpNotification) {
      const timer = setTimeout(() => {
        setActiveHeadsUpNotification(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [activeHeadsUpNotification]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoadingAi]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getTradingViewInterval = (tf: string) => {
    switch (tf) {
      case '1m': return '1';
      case '5m': return '5';
      case '15m': return '15';
      case '30m': return '30';
      case '1H': return '60';
      case '4H': return '240';
      case '1D': return 'D';
      case '1W': return 'W';
      default: return '60';
    }
  };

  const getTradingViewStudies = (indicators: string[]) => {
    const studies: string[] = [];
    if (indicators.some((i) => i.startsWith('EMA'))) studies.push('MASimple@tv-basicstudies');
    if (indicators.includes('RSI')) studies.push('RSI@tv-basicstudies');
    if (indicators.includes('MACD')) studies.push('MACD@tv-basicstudies');
    if (indicators.includes('Bollinger Bands')) studies.push('BB@tv-basicstudies');
    if (indicators.includes('Volume')) studies.push('Volume@tv-basicstudies');
    if (indicators.includes('Stochastic')) studies.push('Stochastic@tv-basicstudies');
    return encodeURIComponent(JSON.stringify(studies));
  };

  // Capture Snapshot simulation
  const handleTakeScreenshot = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0E1117';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(42, 50, 69, 0.5)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 45) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 20px sans-serif';
      const formattedPrice = selectedPair.decimals === 4 ? activeTick.price.toFixed(4) : activeTick.price.toFixed(2);
      ctx.fillText(`${selectedPair.displayName} • ${formattedPrice}`, 30, 40);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '13px sans-serif';
      ctx.fillText(`Timeframe: ${timeframe} | Indikator: ${selectedIndicators.join(', ')}`, 30, 65);

      // Candlesticks simulation
      let price = activeTick.price;
      const step = 28;
      const volatility = selectedPair.decimals === 4 ? 0.0015 : 4.5;
      for (let i = 0; i < 24; i++) {
        const change = (Math.sin(i * 0.8) + (Math.random() - 0.48)) * volatility;
        const open = price;
        const close = price + change;
        const high = Math.max(open, close) + Math.random() * (volatility * 0.6);
        const low = Math.min(open, close) - Math.random() * (volatility * 0.6);
        price = close;

        const x = 50 + i * step;
        const scaleY = (p: number) => 380 - ((p - (activeTick.price - volatility * 10)) / (volatility * 20)) * 260;

        const isGreen = close >= open;
        ctx.strokeStyle = isGreen ? '#22C55E' : '#EF4444';
        ctx.fillStyle = isGreen ? '#22C55E' : '#EF4444';

        ctx.beginPath();
        ctx.moveTo(x + 6, Math.max(20, Math.min(420, scaleY(high))));
        ctx.lineTo(x + 6, Math.max(20, Math.min(420, scaleY(low))));
        ctx.stroke();

        const topY = scaleY(Math.max(open, close));
        const bodyH = Math.max(Math.abs(scaleY(open) - scaleY(close)), 4);
        ctx.fillRect(x, Math.max(20, Math.min(420, topY)), 12, bodyH);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      setAnalysisPrompt(
        `Analisa teknikal komprehensif chart ${selectedPair.displayName} (${timeframe}): tentukan trend utama, area support & resistance terdekat, pola candlestick penting, dan rekomendasi level entry, SL, dan TP.`
      );
      setIsCaptureModalOpen(true);
    }
  };

  // Add new price alert
  const handleSaveAlert = () => {
    const priceNum = parseFloat(newAlertPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast('Masukkan harga target yang valid!');
      return;
    }

    const newAlert: PriceAlert = {
      id: 'alert-' + Date.now(),
      symbol: selectedPairSymbol,
      targetPrice: priceNum,
      alertType: newAlertType,
      note: newAlertNote.trim() || `${newAlertType} di ${selectedPair.decimals === 4 ? priceNum.toFixed(4) : priceNum.toFixed(2)}`,
      isEnabled: true,
      isTriggered: false,
      createdAt: Date.now(),
    };

    setAlerts((prev) => [newAlert, ...prev]);
    setIsAddAlertDialogOpen(false);
    setNewAlertNote('');
    showToast(`🔔 Price Alert ${selectedPairSymbol} ${newAlertType} berhasil dipasang!`);
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    showToast('Alert dihapus');
  };

  const handleToggleAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isEnabled: !a.isEnabled, isTriggered: false } : a))
    );
  };

  // One-Tap Technical Analysis Trigger
  const handleOneTapTechnicalAnalysis = async () => {
    setIsScanningPattern(true);
    setShowPatternOverlay(true);

    try {
      const response = await fetch('/api/ai/detect-pattern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedPairSymbol,
          currentPrice: activeTick.price, // STRICT MATCH to the pair's price on the chart
          timeframe: timeframe,
          provider: settings.provider,
          apiKey: settings.provider === 'gemini' ? settings.geminiApiKey : '',
          decimals: selectedPair.decimals,
        }),
      });

      const data = await response.json();
      if (data.success && data.pattern) {
        const p: DetectedPattern = {
          ...data.pattern,
          symbol: selectedPairSymbol,
          currentPrice: activeTick.price,
          timestamp: Date.now(),
        };
        setDetectedPattern(p);
        setShowPatternOverlay(true);

        const dec = selectedPair.decimals;
        const fmt = (num: number) => (dec === 4 ? num.toFixed(4) : num.toFixed(2));

        setMessages((prev) => [
          ...prev,
          {
            id: 'pattern-' + Date.now(),
            role: 'assistant',
            content: `⚡ **ONE-TAP TECHNICAL ANALYSIS (${p.symbol})**\n\n📌 **Pola Terdeteksi:** ${p.name} (${p.bias} • Akurasi ${p.confidence}%)\n📊 **Timeframe:** ${timeframe}\n💲 **Harga Terkini Chart:** ${fmt(activeTick.price)}\n\n• **Support (S):** ${fmt(p.supportLevel)}\n• **Resistance (R):** ${fmt(p.resistanceLevel)}\n• **Level Breakout:** ${fmt(p.breakoutLevel)}\n• **Target TP:** ${fmt(p.targetProfit)}\n• **Stop Loss (SL):** ${fmt(p.stopLoss)}\n\n💡 **Rangkuman AI:**\n${p.summary}\n\n*Label pola interaktif sekarang tampil langsung di atas chart. Klik tombol "Sync Alert" di chart untuk mengaktifkan Price Alert support & resistance secara otomatis pada harga pair chart ini.*`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            model: 'AI Vision Pattern Scanner',
          },
        ]);
        showToast(`⚡ Pola ${p.name} (${p.bias}) terdeteksi pada ${p.symbol}!`);
      } else {
        showToast(`Gagal mendeteksi pola: ${data.error || 'Server error'}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message || 'Gagal terhubung ke AI'}`);
    } finally {
      setIsScanningPattern(false);
    }
  };

  // 1-Tap Apply Pattern Alerts matching chart price
  const handleApplyPatternAlerts = () => {
    if (!detectedPattern) return;
    const dec = selectedPair.decimals;
    const fmt = (num: number) => (dec === 4 ? num.toFixed(4) : num.toFixed(2));

    const supportAlert: PriceAlert = {
      id: 'pattern-s-' + Date.now(),
      symbol: selectedPairSymbol,
      targetPrice: detectedPattern.supportLevel,
      alertType: 'SUPPORT',
      note: `Pola ${detectedPattern.name} - Support ${fmt(detectedPattern.supportLevel)}`,
      isEnabled: true,
      isTriggered: false,
      createdAt: Date.now(),
    };

    const resistanceAlert: PriceAlert = {
      id: 'pattern-r-' + Date.now(),
      symbol: selectedPairSymbol,
      targetPrice: detectedPattern.resistanceLevel,
      alertType: 'RESISTANCE',
      note: `Pola ${detectedPattern.name} - Resistance ${fmt(detectedPattern.resistanceLevel)}`,
      isEnabled: true,
      isTriggered: false,
      createdAt: Date.now() + 1,
    };

    setAlerts((prev) => [supportAlert, resistanceAlert, ...prev]);
    showToast(`🔔 Price Alert S (${fmt(detectedPattern.supportLevel)}) & R (${fmt(detectedPattern.resistanceLevel)}) aktif!`);
  };

  const handleSendMessage = async (promptToSend?: string, imageToSend?: string | null) => {
    const text = promptToSend || inputChat;
    const img = imageToSend !== undefined ? imageToSend : attachedImage;

    if (!text.trim() && !img) return;

    const userMsg: ChatMessageItem = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim() || `📸 [Analisa Chart ${selectedPairSymbol}]`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      image: img || undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputChat('');
    setAttachedImage(null);
    setIsLoadingAi(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: settings.provider,
          model: settings.provider === 'gemini' ? settings.modelType : settings.provider === 'groq' ? settings.groqModel : settings.provider === 'openai' ? settings.openAiModel : settings.openRouterModel,
          apiKey: settings.provider === 'gemini' ? settings.geminiApiKey : settings.provider === 'groq' ? settings.groqApiKey : settings.provider === 'openai' ? settings.openAiApiKey : settings.openRouterApiKey,
          temperature: settings.temperature,
          systemInstruction: settings.systemInstruction,
          messages: messages.concat(userMsg).map((m) => ({ role: m.role, content: m.content })),
          images: img ? [img] : [],
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            model: data.model || settings.modelType,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `⚠️ **Gagal memproses analisa:**\n${data.error || 'Terjadi kesalahan pada endpoint provider.'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ **Koneksi Error:** ${err.message || 'Tidak dapat terhubung ke server.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTestEndpoint = async () => {
    setIsTestingEndpoint(true);
    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: tempSettings.provider,
          apiKey: tempSettings.provider === 'gemini' ? tempSettings.geminiApiKey : tempSettings.provider === 'groq' ? tempSettings.groqApiKey : tempSettings.provider === 'openai' ? tempSettings.openAiApiKey : tempSettings.openRouterApiKey,
          model: tempSettings.provider === 'gemini' ? tempSettings.modelType : tempSettings.provider === 'groq' ? tempSettings.groqModel : tempSettings.provider === 'openai' ? tempSettings.openAiModel : tempSettings.openRouterModel,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `200 OK! Latency: ${data.latencyMs}ms`);
      } else {
        showToast(`❌ Error: ${data.error || 'Gagal'}`);
      }
    } catch (err: any) {
      showToast(`❌ Koneksi gagal: ${err.message}`);
    } finally {
      setIsTestingEndpoint(false);
    }
  };

  const handleSaveSettings = () => {
    setSettings(tempSettings);
    localStorage.setItem('xauusd_ai_settings', JSON.stringify(tempSettings));
    showToast('Settings berhasil disimpan');
    setCurrentScreen('dashboard');
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      for (const file of ANDROID_FILES) {
        zip.file(file.path, file.content);
      }
      zip.file(
        '.gitignore',
        `*.iml\n.gradle\n/local.properties\n/.idea/\n.DS_Store\n/build\n/captures\n.externalNativeBuild\n.cxx\n`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'AI_Forex_XAUUSD_Analyzer_Android_Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('📦 Project Android Studio berhasil diunduh!');
    } catch (err: any) {
      showToast(`Gagal membuat ZIP: ${err.message}`);
    } finally {
      setIsZipping(false);
    }
  };

  const filteredFiles = ANDROID_FILES.filter(
    (f) =>
      f.name.toLowerCase().includes(codeSearchQuery.toLowerCase()) ||
      f.path.toLowerCase().includes(codeSearchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(codeSearchQuery.toLowerCase())
  );

  const formattedActivePrice =
    selectedPair.decimals === 4
      ? activeTick.price.toFixed(4)
      : activeTick.price.toFixed(2);

  const activePairAlerts = alerts.filter((a) => a.symbol === selectedPairSymbol);

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans selection:bg-[#2962FF] selection:text-white">
      {/* Top Main Navigation Header */}
      <header className="border-b border-[#1E2536] bg-[#0E1117] px-4 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2962FF] to-[#F59E0B] p-0.5 shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-[#0E1117] rounded-[10px] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#F59E0B]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base tracking-tight text-white">
                AI Forex & XAUUSD Analyzer
              </h1>
              <span className="text-[10px] font-semibold bg-[#2962FF]/20 text-[#5382FF] px-2 py-0.5 rounded-full border border-[#2962FF]/30">
                Multi-Pair WebSocket
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Animated Price • 7 Pairs (Gold, EUR/USD, USD/JPY, GBP/USD, USD/CAD, USD/CHF, DXY) • Vision AI
            </p>
          </div>
        </div>

        {/* Tab Switcher & Export Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-[#1A1F2C] p-1 rounded-xl border border-[#2A3245] flex items-center gap-1">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'simulator'
                  ? 'bg-[#2962FF] text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Live Android App
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'code'
                  ? 'bg-[#2962FF] text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Source Code Explorer
            </button>
          </div>

          {activeTab === 'simulator' && (
            <button
              onClick={() => setIsPhoneFrame(!isPhoneFrame)}
              title={isPhoneFrame ? 'Tampilan Layar Penuh' : 'Tampilan Smartphone'}
              className="p-2 rounded-xl bg-[#1A1F2C] border border-[#2A3245] text-slate-300 hover:text-white hover:bg-white/5 transition"
            >
              {isPhoneFrame ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isZipping ? 'Mengemas ZIP...' : 'Download Android Studio (.zip)'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex overflow-hidden">
        {/* ======================================================== */}
        {/* TAB 1: LIVE ANDROID APP SIMULATOR                        */}
        {/* ======================================================== */}
        {activeTab === 'simulator' && (
          <div className="flex-1 flex items-center justify-center p-2 sm:p-4 bg-[#07090E] overflow-y-auto">
            <div
              className={`transition-all duration-300 bg-[#0E1117] flex flex-col shadow-2xl relative ${
                isPhoneFrame
                  ? 'w-full max-w-[430px] h-[890px] rounded-[44px] border-[10px] border-[#1F2536] ring-1 ring-white/10 overflow-hidden'
                  : 'w-full h-full max-w-5xl rounded-2xl border border-[#1F2536] overflow-hidden'
              }`}
            >
              {/* Android Notch / Dynamic Island & Status Bar */}
              {isPhoneFrame && (
                <div className="bg-[#0E1117] px-6 pt-3 pb-1 flex items-center justify-between text-[11px] font-medium text-slate-400 select-none z-30">
                  <span className="font-semibold text-white">09:41</span>
                  <div className="w-24 h-4 bg-black rounded-full mx-auto" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px]">5G</span>
                    <Activity className="w-3 h-3 text-slate-300" />
                    <div className="w-5 h-2.5 border border-slate-400 rounded-sm p-0.5 flex items-center">
                      <div className="w-3 h-1.5 bg-emerald-400 rounded-2xs" />
                    </div>
                  </div>
                </div>
              )}

              {/* In-App Heads-Up Price Alert Push Notification */}
              {activeHeadsUpNotification && (
                <div className="absolute top-10 left-3 right-3 z-50 animate-in slide-in-from-top duration-300">
                  <div
                    className={`rounded-2xl p-3 border shadow-2xl backdrop-blur-md flex items-start justify-between gap-2.5 ${
                      activeHeadsUpNotification.type === 'SUPPORT'
                        ? 'bg-[#1F1418]/95 border-red-500/50 text-red-200'
                        : 'bg-[#142018]/95 border-emerald-500/50 text-emerald-200'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-black/40 text-white">
                      <BellRing
                        className={`w-5 h-5 ${
                          activeHeadsUpNotification.type === 'SUPPORT' ? 'text-red-400' : 'text-emerald-400'
                        } animate-bounce`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                        <span>{activeHeadsUpNotification.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {activeHeadsUpNotification.message}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveHeadsUpNotification(null)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Screen Content: Dashboard or Settings */}
              {currentScreen === 'dashboard' ? (
                <div className="flex-1 flex flex-col overflow-hidden bg-[#0E1117]">
                  {/* TopAppBar with Active Pair & Live Status */}
                  <div className="bg-[#1A1F2C] px-4 py-2 border-b border-[#2A3245] flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{selectedPair.displayName}</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      </h2>
                      <p className="text-[10px] text-slate-400 font-mono">
                        TradingView Real-Time Chart • OANDA / FX
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setChartKey((k) => k + 1)}
                        title="Reload Chart"
                        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setTempSettings(settings);
                          setCurrentScreen('settings');
                        }}
                        title="Settings"
                        className="p-1.5 rounded-lg text-[#5382FF] hover:bg-[#2962FF]/20 transition"
                      >
                        <SettingsIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* PAIR SELECTOR CAROUSEL (XAU/USD, EUR/USD, USD/JPY, GBP/USD, USD/CAD, USD/CHF, DXY) */}
                  <div className="bg-[#121622] px-2 py-1.5 border-b border-[#1E2536] overflow-x-auto no-scrollbar flex items-center gap-1.5">
                    {SUPPORTED_PAIRS.map((pair) => {
                      const isSelected = pair.symbol === selectedPairSymbol;
                      const tick = allTicks[pair.symbol];
                      const pairBullish = (tick?.change || 0) >= 0;
                      return (
                        <button
                          key={pair.symbol}
                          onClick={() => {
                            setSelectedPairSymbol(pair.symbol);
                            setChartKey((k) => k + 1);
                          }}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                            isSelected
                              ? 'bg-[#2962FF] text-white border-[#2962FF] shadow-sm shadow-blue-500/30'
                              : 'bg-[#1A1F2C] text-slate-300 border-[#2A3245] hover:bg-white/5'
                          }`}
                        >
                          <span>{pair.symbol}</span>
                          {tick && (
                            <span
                              className={`text-[9.5px] font-mono px-1 rounded ${
                                isSelected
                                  ? 'bg-black/30 text-white'
                                  : pairBullish
                                  ? 'text-emerald-400'
                                  : 'text-red-400'
                              }`}
                            >
                              {pair.decimals === 4
                                ? tick.price.toFixed(4)
                                : tick.price.toFixed(2)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* REAL-TIME ANIMATED PRICE CHANGE & ALERT BAR */}
                  <div
                    className={`px-3 py-2 border-b border-[#222938] transition-colors duration-500 ${
                      priceFlash === 'up'
                        ? 'bg-emerald-950/40'
                        : priceFlash === 'down'
                        ? 'bg-red-950/40'
                        : 'bg-[#141824]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {/* Flashing Pulse Dot */}
                        <div
                          className={`w-2.5 h-2.5 rounded-full transition-transform duration-300 ${
                            priceFlash === 'up'
                              ? 'bg-emerald-400 scale-125 shadow-sm shadow-emerald-400'
                              : priceFlash === 'down'
                              ? 'bg-red-400 scale-125 shadow-sm shadow-red-400'
                              : isBullish
                              ? 'bg-emerald-400'
                              : 'bg-red-400'
                          }`}
                        />

                        {/* Animated Price Counter */}
                        <div className="flex items-baseline gap-2">
                          <span
                            className={`font-mono font-extrabold text-base tracking-tight transition-transform duration-200 ${
                              priceFlash === 'up'
                                ? 'text-emerald-400 scale-105'
                                : priceFlash === 'down'
                                ? 'text-red-400 scale-105'
                                : isBullish
                                ? 'text-emerald-400'
                                : 'text-red-400'
                            }`}
                          >
                            {formattedActivePrice}
                          </span>

                          {/* Delta indicator pill */}
                          <span
                            className={`text-[10.5px] font-bold font-mono px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                              isBullish
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {isBullish ? (
                              <ArrowUp className="w-3 h-3 stroke-[3]" />
                            ) : (
                              <ArrowDown className="w-3 h-3 stroke-[3]" />
                            )}
                            {isBullish ? '+' : ''}
                            {activeTick.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>

                      {/* Set Alert Trigger button */}
                      <button
                        onClick={() => {
                          setNewAlertPrice(formattedActivePrice);
                          setIsAddAlertDialogOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2962FF]/20 hover:bg-[#2962FF]/30 border border-[#2962FF]/40 text-[#5382FF] text-[11px] font-bold active:scale-95 transition"
                      >
                        <Bell className="w-3 h-3" />
                        <span>Set Alert</span>
                      </button>
                    </div>

                    {/* Active Support & Resistance Alert Tags for current pair */}
                    {activePairAlerts.length > 0 && (
                      <div className="mt-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                        {activePairAlerts.map((alert) => (
                          <div
                            key={alert.id}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono border transition ${
                              alert.isTriggered
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 opacity-60'
                                : alert.alertType === 'SUPPORT'
                                ? 'bg-red-500/15 border-red-500/30 text-red-300'
                                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                            }`}
                          >
                            <span className="font-bold">
                              {alert.alertType === 'SUPPORT' ? 'S' : 'R'}:{' '}
                              {selectedPair.decimals === 4
                                ? alert.targetPrice.toFixed(4)
                                : alert.targetPrice.toFixed(2)}
                            </span>
                            {alert.isTriggered ? (
                              <span className="text-[9px] text-amber-400 font-sans">(Hit)</span>
                            ) : (
                              <button
                                onClick={() => handleToggleAlert(alert.id)}
                                title={alert.isEnabled ? 'Nonaktifkan' : 'Aktifkan'}
                                className="opacity-70 hover:opacity-100 font-sans"
                              >
                                {alert.isEnabled ? '✓' : '⏸'}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteAlert(alert.id)}
                              className="text-slate-400 hover:text-white ml-0.5"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Chart Toolbar: Timeframe + Indicators + Screenshot */}
                  <div className="bg-[#101420] px-3 py-1.5 border-b border-[#222938] flex items-center justify-between gap-2">
                    {/* Timeframe Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setIsTfDropdownOpen(!isTfDropdownOpen)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1A1F2C] border border-[#2A3245] text-xs font-semibold text-white hover:bg-white/5 transition"
                      >
                        <span>TF: {timeframe}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      {isTfDropdownOpen && (
                        <div className="absolute left-0 mt-1 w-24 bg-[#1A1F2C] border border-[#2A3245] rounded-xl shadow-xl py-1 z-30">
                          {['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W'].map((tf) => (
                            <button
                              key={tf}
                              onClick={() => {
                                setTimeframe(tf);
                                setIsTfDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs transition ${
                                timeframe === tf
                                  ? 'text-[#2962FF] font-bold bg-[#2962FF]/10'
                                  : 'text-slate-300 hover:bg-white/5'
                              }`}
                            >
                              {tf}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Indicators Multi-select Dialog trigger */}
                    <button
                      onClick={() => setIsIndicatorsModalOpen(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1A1F2C] border border-[#2A3245] text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition"
                    >
                      <Sliders className="w-3.5 h-3.5 text-[#2962FF]" />
                      <span>Indikator ({selectedIndicators.length})</span>
                    </button>

                    {/* ⚡ One-Tap Technical Analysis Button */}
                    <button
                      onClick={handleOneTapTechnicalAnalysis}
                      disabled={isScanningPattern}
                      title="One-Tap Technical Analysis: Deteksi otomatis pola chart (Triangle, H&S, Double Top/Bottom) dengan AI Vision"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition disabled:opacity-50"
                    >
                      <Zap className={`w-3.5 h-3.5 fill-current ${isScanningPattern ? 'animate-spin' : 'animate-bounce'}`} />
                      <span>{isScanningPattern ? 'Memindai...' : 'One-Tap AI'}</span>
                    </button>

                    {/* 📸 Screenshot Chart Button */}
                    <button
                      onClick={handleTakeScreenshot}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#2962FF] hover:bg-[#1E4BD8] text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Screenshot</span>
                    </button>
                  </div>

                  {/* TradingView Chart Embed Area with Selected Pair Symbol & Real-Time Pattern HUD */}
                  <div className="h-[235px] w-full bg-[#0E1117] relative border-b border-[#2A3245] overflow-hidden">
                    <iframe
                      key={`${chartKey}-${selectedPair.tradingViewSymbol}-${timeframe}-${selectedIndicators.join(',')}`}
                      title={`TradingView ${selectedPair.displayName}`}
                      src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${encodeURIComponent(
                        selectedPair.tradingViewSymbol
                      )}&interval=${getTradingViewInterval(
                        timeframe
                      )}&hidesidetoolbar=1&symboledit=1&saveimage=0&toolbarbg=1A1F2C&studies=${getTradingViewStudies(
                        selectedIndicators
                      )}&theme=dark&style=1&timezone=Asia%2FJakarta&studies_overrides=%7B%7D&overrides=%7B%22paneProperties.background%22%3A%22%230E1117%22%2C%22paneProperties.vertGridProperties.color%22%3A%22%231A1F2C%22%2C%22paneProperties.horzGridProperties.color%22%3A%22%231A1F2C%22%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=id&utm_source=aixauusd.app`}
                      className="w-full h-full border-0 pointer-events-auto"
                      loading="lazy"
                    />

                    {/* High-Tech Radar Scanning Effect during One-Tap AI Analysis */}
                    {isScanningPattern && (
                      <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-3 animate-in fade-in select-none">
                        <div className="relative mb-2">
                          <div className="w-12 h-12 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-amber-400 fill-current animate-pulse" />
                          </div>
                        </div>
                        <span className="text-amber-300 font-bold text-xs flex items-center gap-1.5">
                          <span>AI Vision: Memindai Pola Chart {selectedPair.displayName}...</span>
                        </span>
                        <p className="text-[10.5px] text-slate-300 mt-1 text-center max-w-xs">
                          Mendeteksi Triangle, Head & Shoulders, atau Double Top/Bottom pada level harga {formattedActivePrice}
                        </p>
                      </div>
                    )}

                    {/* Interactive Pattern HUD Label directly on top of the chart */}
                    {detectedPattern && showPatternOverlay && detectedPattern.symbol === selectedPairSymbol && (
                      <div className="absolute inset-x-2 top-2 z-20 pointer-events-auto flex flex-col gap-1 animate-in slide-in-from-top duration-200">
                        {/* Top Floating Pattern Card */}
                        <div className="bg-[#121724]/95 backdrop-blur-md border border-amber-500/50 rounded-xl px-2.5 py-1.5 shadow-2xl flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[11px] font-extrabold text-amber-300 truncate">
                                  ⚡ {detectedPattern.name}
                                </span>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                    detectedPattern.bias === 'BULLISH'
                                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                                      : detectedPattern.bias === 'BEARISH'
                                      ? 'bg-red-500/25 text-red-300 border border-red-500/40'
                                      : 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                                  }`}
                                >
                                  {detectedPattern.bias} • {detectedPattern.confidence}%
                                </span>
                              </div>
                              <div className="text-[9.5px] text-slate-300 font-mono flex items-center gap-2 mt-0.5">
                                <span className="text-red-300">
                                  S: {selectedPair.decimals === 4 ? detectedPattern.supportLevel.toFixed(4) : detectedPattern.supportLevel.toFixed(2)}
                                </span>
                                <span className="text-emerald-300">
                                  R: {selectedPair.decimals === 4 ? detectedPattern.resistanceLevel.toFixed(4) : detectedPattern.resistanceLevel.toFixed(2)}
                                </span>
                                <span className="text-cyan-300">
                                  Brk: {selectedPair.decimals === 4 ? detectedPattern.breakoutLevel.toFixed(4) : detectedPattern.breakoutLevel.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={handleApplyPatternAlerts}
                              title="Sinkronkan Price Alert Support & Resistance Pola Ini ke Chart"
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-[10px] shadow transition active:scale-95"
                            >
                              <BellRing className="w-3 h-3" />
                              <span>Sync Alert</span>
                            </button>
                            <button
                              onClick={() => setShowPatternOverlay(false)}
                              title="Sembunyikan label pola"
                              className="p-1 rounded-lg text-slate-400 hover:text-white"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Side Price Level Badges on Right Axis aligned to chart price */}
                        <div className="self-end flex flex-col items-end gap-0.5 pointer-events-none pr-1">
                          <div className="bg-emerald-500/90 text-slate-950 font-mono font-bold text-[8.5px] px-1.5 py-0.5 rounded shadow">
                            R: {selectedPair.decimals === 4 ? detectedPattern.resistanceLevel.toFixed(4) : detectedPattern.resistanceLevel.toFixed(2)}
                          </div>
                          <div className="bg-red-500/90 text-white font-mono font-bold text-[8.5px] px-1.5 py-0.5 rounded shadow">
                            S: {selectedPair.decimals === 4 ? detectedPattern.supportLevel.toFixed(4) : detectedPattern.supportLevel.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Minimized Pattern Toggle Button */}
                    {detectedPattern && !showPatternOverlay && detectedPattern.symbol === selectedPairSymbol && (
                      <button
                        onClick={() => setShowPatternOverlay(true)}
                        className="absolute top-2 right-2 z-20 bg-[#1A1F2C]/90 backdrop-blur-xs text-amber-300 border border-amber-500/40 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-[#1A1F2C] shadow-lg transition"
                      >
                        <Eye className="w-3 h-3 text-amber-400" />
                        <span>Pola: {detectedPattern.name}</span>
                      </button>
                    )}
                  </div>

                  {/* Bubble Template Pertanyaan (Horizontal scroll / LazyRow) */}
                  <div className="bg-[#141824] py-2 px-2 border-b border-[#222938] overflow-x-auto no-scrollbar flex items-center gap-1.5">
                    {TEMPLATE_QUESTIONS.map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInputChat(`${question} pada pair ${selectedPair.displayName}`)}
                        className="whitespace-nowrap px-3 py-1 rounded-full bg-[#1A1F2C] hover:bg-[#2962FF]/20 text-slate-300 hover:text-white border border-[#2A3245] text-[11.5px] transition flex-shrink-0"
                      >
                        {question}
                      </button>
                    ))}
                  </div>

                  {/* Chat History List (LazyColumn) */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#0E1117]">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          msg.role === 'user' ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-[#2962FF] text-white rounded-br-xs'
                              : 'bg-[#1A1F2C] text-slate-200 border border-[#2A3245] rounded-bl-xs shadow-md'
                          }`}
                        >
                          {msg.role === 'assistant' && (
                            <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-bold text-[#F59E0B]">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>AI Analyst ({msg.model || settings.modelType})</span>
                            </div>
                          )}

                          {msg.image && (
                            <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                              <img
                                src={msg.image}
                                alt="Chat attachment"
                                className="w-full max-h-36 object-cover"
                              />
                            </div>
                          )}

                          <div className="whitespace-pre-wrap">{msg.content}</div>

                          <div
                            className={`text-[9.5px] mt-1.5 text-right font-mono ${
                              msg.role === 'user' ? 'text-blue-200' : 'text-slate-500'
                            }`}
                          >
                            {msg.timestamp}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* AI Loading bubble */}
                    {isLoadingAi && (
                      <div className="flex items-start">
                        <div className="bg-[#1A1F2C] border border-[#2A3245] rounded-2xl rounded-bl-xs px-3.5 py-2 text-xs flex items-center gap-2 text-slate-300 shadow">
                          <div className="w-3.5 h-3.5 border-2 border-[#2962FF] border-t-transparent rounded-full animate-spin" />
                          <span>AI sedang membaca chart & menghitung level…</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Attachment Preview thumbnail */}
                  {attachedImage && (
                    <div className="bg-[#1A1F2C] px-3 py-2 border-t border-[#2A3245] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={attachedImage}
                          alt="Thumbnail preview"
                          className="w-10 h-10 object-cover rounded-md border border-[#2962FF]"
                        />
                        <span className="text-[11px] text-slate-300">
                          Gambar chart {selectedPairSymbol} siap dianalisa AI
                        </span>
                      </div>
                      <button
                        onClick={() => setAttachedImage(null)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Chat Input Bar */}
                  <div className="bg-[#1A1F2C] p-2 border-t border-[#2A3245] flex items-center gap-1.5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      title="Lampirkan Gambar"
                      className="p-2 rounded-full text-[#5382FF] hover:bg-white/5 transition"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      value={inputChat}
                      onChange={(e) => setInputChat(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendMessage();
                      }}
                      placeholder={`Tanya AI tentang chart ${selectedPair.symbol}...`}
                      className="flex-1 bg-[#141824] border border-[#2A3245] rounded-full px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2962FF]"
                    />

                    <button
                      onClick={() => handleSendMessage()}
                      disabled={isLoadingAi || (!inputChat.trim() && !attachedImage)}
                      className="p-2 rounded-full bg-[#2962FF] hover:bg-[#1E4BD8] text-white disabled:opacity-40 disabled:hover:bg-[#2962FF] transition"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* ======================================================== */
                /* SCREEN 2: SETTINGS (Jetpack Compose Material 3 replica)  */
                /* ======================================================== */
                <div className="flex-1 flex flex-col bg-[#0E1117] overflow-hidden">
                  <div className="bg-[#1A1F2C] px-4 py-3 border-b border-[#2A3245] flex items-center gap-3">
                    <button
                      onClick={() => setCurrentScreen('dashboard')}
                      className="p-1 rounded-lg text-slate-300 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-sm font-bold text-white">Pengaturan AI</h2>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Section A: Model AI */}
                    <div className="bg-[#1A1F2C] border border-[#2A3245] rounded-xl p-3.5 space-y-3">
                      <h3 className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider">
                        A. Model AI
                      </h3>

                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'gemini', label: 'Google Gemini' },
                          { id: 'groq', label: 'Groq (Free)' },
                          { id: 'openai', label: 'OpenAI' },
                          { id: 'openrouter', label: 'OpenRouter' },
                        ].map((prov) => (
                          <button
                            key={prov.id}
                            onClick={() =>
                              setTempSettings({
                                ...tempSettings,
                                provider: prov.id as AppSettings['provider'],
                              })
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border text-center transition ${
                              tempSettings.provider === prov.id
                                ? 'bg-[#2962FF] text-white border-[#2962FF]'
                                : 'bg-[#141824] text-slate-300 border-[#2A3245] hover:bg-white/5'
                            }`}
                          >
                            {prov.label}
                          </button>
                        ))}
                      </div>

                      {tempSettings.provider === 'gemini' && (
                        <div className="space-y-2 pt-2 border-t border-[#222938]">
                          <label className="text-[11px] text-slate-400 font-medium">
                            Pilih Model Gemini:
                          </label>
                          {[
                            { id: 'gemini-3.8-flash', label: 'Gemini Flash (Cepat & Vision Akurat)' },
                            { id: 'gemini-4-argon', label: 'Gemini Pro / Argon (Deep Reasoning)' },
                            { id: 'gemini-3.1-flash-lite', label: 'Gemini Flash Lite (Ultra Cepat)' },
                            { id: 'custom', label: 'Custom Gemini API' },
                          ].map((item) => (
                            <label
                              key={item.id}
                              className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name="geminiModel"
                                checked={tempSettings.modelType === item.id}
                                onChange={() =>
                                  setTempSettings({ ...tempSettings, modelType: item.id })
                                }
                                className="accent-[#2962FF]"
                              />
                              <span>{item.label}</span>
                            </label>
                          ))}

                          <div className="pt-2">
                            <label className="text-[11px] text-slate-400 block mb-1">
                              Gemini API Key (Opsional jika server inject):
                            </label>
                            <input
                              type="password"
                              value={tempSettings.geminiApiKey}
                              onChange={(e) =>
                                setTempSettings({ ...tempSettings, geminiApiKey: e.target.value })
                              }
                              placeholder="Default: Menggunakan Server Key Otomatis"
                              className="w-full bg-[#141824] border border-[#2A3245] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2962FF]"
                            />
                          </div>
                        </div>
                      )}

                      {tempSettings.provider === 'groq' && (
                        <div className="space-y-2 pt-2 border-t border-[#222938]">
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">
                              Groq API Key (Gratis di console.groq.com):
                            </label>
                            <input
                              type="password"
                              value={tempSettings.groqApiKey}
                              onChange={(e) =>
                                setTempSettings({ ...tempSettings, groqApiKey: e.target.value })
                              }
                              placeholder="gsk_..."
                              className="w-full bg-[#141824] border border-[#2A3245] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2962FF]"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">
                              Model Name:
                            </label>
                            <input
                              type="text"
                              value={tempSettings.groqModel}
                              onChange={(e) =>
                                setTempSettings({ ...tempSettings, groqModel: e.target.value })
                              }
                              placeholder="llama-3.3-70b-versatile"
                              className="w-full bg-[#141824] border border-[#2A3245] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#2962FF]"
                            />
                          </div>
                        </div>
                      )}

                      {tempSettings.provider === 'openai' && (
                        <div className="space-y-2 pt-2 border-t border-[#222938]">
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">
                              OpenAI API Key:
                            </label>
                            <input
                              type="password"
                              value={tempSettings.openAiApiKey}
                              onChange={(e) =>
                                setTempSettings({ ...tempSettings, openAiApiKey: e.target.value })
                              }
                              placeholder="sk-..."
                              className="w-full bg-[#141824] border border-[#2A3245] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2962FF]"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">
                              Model Name:
                            </label>
                            <input
                              type="text"
                              value={tempSettings.openAiModel}
                              onChange={(e) =>
                                setTempSettings({ ...tempSettings, openAiModel: e.target.value })
                              }
                              placeholder="gpt-4o-mini"
                              className="w-full bg-[#141824] border border-[#2A3245] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#2962FF]"
                            />
                          </div>
                        </div>
                      )}

                      {tempSettings.provider === 'openrouter' && (
                        <div className="space-y-2 pt-2 border-t border-[#222938]">
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">
                              OpenRouter API Key:
                            </label>
                            <input
                              type="password"
                              value={tempSettings.openRouterApiKey}
                              onChange={(e) =>
                                setTempSettings({ ...tempSettings, openRouterApiKey: e.target.value })
                              }
                              placeholder="sk-or-v1-..."
                              className="w-full bg-[#141824] border border-[#2A3245] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2962FF]"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">
                              Model Name:
                            </label>
                            <input
                              type="text"
                              value={tempSettings.openRouterModel}
                              onChange={(e) =>
                                setTempSettings({ ...tempSettings, openRouterModel: e.target.value })
                              }
                              placeholder="google/gemini-flash-1.5"
                              className="w-full bg-[#141824] border border-[#2A3245] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#2962FF]"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Section B: Kreativitas AI */}
                    <div className="bg-[#1A1F2C] border border-[#2A3245] rounded-xl p-3.5 space-y-3">
                      <h3 className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider">
                        B. Kreativitas AI
                      </h3>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300">Temperature</span>
                          <span className="font-bold text-[#2962FF]">
                            {tempSettings.temperature.toFixed(2)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.05"
                          value={tempSettings.temperature}
                          onChange={(e) =>
                            setTempSettings({
                              ...tempSettings,
                              temperature: parseFloat(e.target.value),
                            })
                          }
                          className="w-full accent-[#2962FF]"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300">Max Tokens</span>
                          <span className="font-bold text-[#2962FF]">{tempSettings.maxTokens}</span>
                        </div>
                        <input
                          type="range"
                          min="512"
                          max="4096"
                          step="256"
                          value={tempSettings.maxTokens}
                          onChange={(e) =>
                            setTempSettings({
                              ...tempSettings,
                              maxTokens: parseInt(e.target.value),
                            })
                          }
                          className="w-full accent-[#2962FF]"
                        />
                      </div>
                    </div>

                    {/* Section C: System Instruction */}
                    <div className="bg-[#1A1F2C] border border-[#2A3245] rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider">
                          C. System Instruction
                        </h3>
                        <button
                          onClick={() =>
                            setTempSettings({
                              ...tempSettings,
                              systemInstruction: DEFAULT_INSTRUCTION,
                            })
                          }
                          className="text-[11px] text-[#2962FF] hover:underline"
                        >
                          Reset Default
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={tempSettings.systemInstruction}
                        onChange={(e) =>
                          setTempSettings({ ...tempSettings, systemInstruction: e.target.value })
                        }
                        className="w-full bg-[#141824] border border-[#2A3245] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#2962FF]"
                      />
                    </div>

                    {/* Section D: Uji Endpoint */}
                    <div className="bg-[#1A1F2C] border border-[#2A3245] rounded-xl p-3.5 space-y-2">
                      <h3 className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider">
                        D. Uji Endpoint
                      </h3>
                      <button
                        onClick={handleTestEndpoint}
                        disabled={isTestingEndpoint}
                        className="w-full py-2 bg-[#141824] hover:bg-white/5 border border-[#2A3245] rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-2 transition disabled:opacity-50"
                      >
                        {isTestingEndpoint ? (
                          <div className="w-3.5 h-3.5 border-2 border-[#2962FF] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Zap className="w-3.5 h-3.5 text-[#2962FF]" />
                        )}
                        <span>Test Endpoint ({tempSettings.provider.toUpperCase()})</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#1A1F2C] p-3 border-t border-[#2A3245] flex items-center gap-2">
                    <button
                      onClick={() => setCurrentScreen('dashboard')}
                      className="flex-1 py-2.5 rounded-lg border border-[#2A3245] text-xs font-semibold text-slate-300 hover:bg-white/5 transition"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSaveSettings}
                      className="flex-1 py-2.5 rounded-lg bg-[#2962FF] hover:bg-[#1E4BD8] text-xs font-bold text-white shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Simpan
                    </button>
                  </div>
                </div>
              )}

              {/* Home Indicator bar */}
              {isPhoneFrame && (
                <div className="bg-[#0E1117] py-2 flex justify-center z-30">
                  <div className="w-32 h-1 bg-slate-600 rounded-full" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: SOURCE CODE EXPLORER & PROJECT VIEWER             */}
        {/* ======================================================== */}
        {activeTab === 'code' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#0A0D14]">
            {/* Left File Tree Sidebar */}
            <div className="w-full md:w-80 bg-[#0E1117] border-r border-[#1E2536] flex flex-col">
              <div className="p-3 border-b border-[#1E2536]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Folder className="w-4 h-4 text-[#F59E0B]" />
                    Android Project Files
                  </span>
                  <span className="text-[10px] bg-[#1A1F2C] text-slate-400 px-2 py-0.5 rounded-full border border-[#2A3245]">
                    {ANDROID_FILES.length} Files
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Cari file Kotlin, Gradle..."
                  value={codeSearchQuery}
                  onChange={(e) => setCodeSearchQuery(e.target.value)}
                  className="w-full bg-[#141824] border border-[#2A3245] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2962FF]"
                />
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredFiles.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center gap-2 transition ${
                      selectedFile.path === file.path
                        ? 'bg-[#2962FF] text-white font-medium shadow'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {file.name.endsWith('.kt') ? (
                      <FileCode className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    ) : file.name.endsWith('.gradle.kts') || file.name.endsWith('.toml') ? (
                      <Layers className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : file.name.endsWith('.xml') ? (
                      <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    )}
                    <span className="truncate">{file.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right File Code Viewer */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#07090E]">
              <div className="bg-[#0E1117] px-4 py-2.5 border-b border-[#1E2536] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                  <span className="text-slate-500">android/</span>
                  <span className="text-white font-semibold">{selectedFile.path}</span>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedFile.content);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1A1F2C] hover:bg-[#2A3245] border border-[#2A3245] text-xs font-semibold text-slate-200 transition"
                >
                  {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copySuccess ? 'Tersalin!' : 'Copy File'}</span>
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-300">
                <pre className="whitespace-pre">{selectedFile.content}</pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL 1: PASANG PRICE ALERT MODAL (MULTI-PAIR)           */}
      {/* ======================================================== */}
      {isAddAlertDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#1A1F2C] border border-[#2A3245] w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BellRing className="w-4 h-4 text-[#F59E0B]" />
                Pasang Price Alert {selectedPair.symbol}
              </h3>
              <button
                onClick={() => setIsAddAlertDialogOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#141824] p-3 rounded-xl border border-[#2A3245] flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">{selectedPair.name}</span>
                <span className="text-[10.5px] text-slate-500 font-mono">Live WebSocket Feed</span>
              </div>
              <span className="font-mono font-bold text-base text-amber-400">
                {formattedActivePrice}
              </span>
            </div>

            {/* Support vs Resistance Toggle Buttons */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5 font-medium">Tipe Level:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewAlertType('SUPPORT');
                    const offset = selectedPair.decimals === 4 ? 0.0050 : 10.0;
                    setNewAlertPrice((activeTick.price - offset).toFixed(selectedPair.decimals));
                  }}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    newAlertType === 'SUPPORT'
                      ? 'bg-red-500/20 text-red-300 border-red-500'
                      : 'bg-[#141824] text-slate-400 border-[#2A3245] hover:bg-white/5'
                  }`}
                >
                  🔴 Support (Drop)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewAlertType('RESISTANCE');
                    const offset = selectedPair.decimals === 4 ? 0.0050 : 10.0;
                    setNewAlertPrice((activeTick.price + offset).toFixed(selectedPair.decimals));
                  }}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    newAlertType === 'RESISTANCE'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                      : 'bg-[#141824] text-slate-400 border-[#2A3245] hover:bg-white/5'
                  }`}
                >
                  🟢 Resistance (Rise)
                </button>
              </div>
            </div>

            {/* Target Price Input & Quick Offset Buttons */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5 font-medium">
                Level Harga Target ({selectedPair.symbol}):
              </label>
              <input
                type="number"
                step={selectedPair.decimals === 4 ? '0.0001' : '0.05'}
                value={newAlertPrice}
                onChange={(e) => setNewAlertPrice(e.target.value)}
                className="w-full bg-[#141824] border border-[#2A3245] rounded-xl px-3.5 py-2 font-mono text-base font-bold text-white focus:outline-none focus:border-[#2962FF]"
              />

              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] text-slate-500">Preset:</span>
                {(selectedPair.decimals === 4 ? [-0.005, -0.002, +0.002, +0.005] : [-15, -5, +5, +15]).map(
                  (offset) => (
                    <button
                      key={offset}
                      type="button"
                      onClick={() =>
                        setNewAlertPrice(
                          (activeTick.price + offset).toFixed(selectedPair.decimals)
                        )
                      }
                      className="px-2 py-0.5 rounded-md bg-[#141824] hover:bg-white/10 text-slate-300 text-[10px] font-mono border border-[#2A3245]"
                    >
                      {offset > 0 ? `+${offset}` : offset}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Note input */}
            <div>
              <label className="text-xs text-slate-400 block mb-1 font-medium">
                Catatan Notifikasi (Opsional):
              </label>
              <input
                type="text"
                value={newAlertNote}
                onChange={(e) => setNewAlertNote(e.target.value)}
                placeholder="Contoh: Entry buy limit atau pasang SL"
                className="w-full bg-[#141824] border border-[#2A3245] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2962FF]"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsAddAlertDialogOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#2A3245] text-xs font-semibold text-slate-300 hover:bg-white/5 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSaveAlert}
                className="flex-1 py-2.5 rounded-xl bg-[#2962FF] hover:bg-[#1E4BD8] text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-1.5"
              >
                <BellRing className="w-3.5 h-3.5" />
                Aktifkan Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: PERINTAH ANALISA (MANUAL) BOTTOMSHEET          */}
      {/* ======================================================== */}
      {isCaptureModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-[#1A1F2C] border border-[#2A3245] w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#F59E0B]" />
                Perintah Analisa ({selectedPair.symbol})
              </h3>
              <button
                onClick={() => setIsCaptureModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {capturedImage && (
              <div className="rounded-xl overflow-hidden border border-[#2A3245] relative bg-black">
                <img
                  src={capturedImage}
                  alt="Chart Screenshot"
                  className="w-full h-40 object-cover"
                />
                <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] font-mono text-[#F59E0B]">
                  📸 {selectedPair.symbol} Snapshot PixelCopy Siap Kirim
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1.5">
                Instruksi Analisa Khusus untuk AI:
              </label>
              <textarea
                rows={3}
                value={analysisPrompt}
                onChange={(e) => setAnalysisPrompt(e.target.value)}
                placeholder="Contoh: Fokus pada timeframe 1H, hitung level support terkuat..."
                className="w-full bg-[#141824] border border-[#2A3245] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2962FF]"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setIsCaptureModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#2A3245] text-xs font-semibold text-slate-300 hover:bg-white/5 transition"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setIsCaptureModalOpen(false);
                  handleSendMessage(`📸 [Analisa Chart ${selectedPair.symbol}]\n${analysisPrompt}`, capturedImage);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#2962FF] hover:bg-[#1E4BD8] text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                Analisa dengan AI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: PILIH INDIKATOR TEKNIKAL                       */}
      {/* ======================================================== */}
      {isIndicatorsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#1A1F2C] border border-[#2A3245] w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Pilih Indikator Teknikal</h3>
              <button
                onClick={() => setIsIndicatorsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {ALL_INDICATORS.map((indicator) => {
                const isSelected = selectedIndicators.includes(indicator);
                return (
                  <label
                    key={indicator}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedIndicators(selectedIndicators.filter((i) => i !== indicator));
                      } else {
                        setSelectedIndicators([...selectedIndicators, indicator]);
                      }
                    }}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#141824] hover:bg-white/5 cursor-pointer text-xs transition"
                  >
                    <span className={isSelected ? 'text-white font-medium' : 'text-slate-400'}>
                      {indicator}
                    </span>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                        isSelected
                          ? 'bg-[#2962FF] border-[#2962FF] text-white'
                          : 'border-[#2A3245]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </label>
                );
              })}
            </div>

            <button
              onClick={() => setIsIndicatorsModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#2962FF] hover:bg-[#1E4BD8] text-xs font-bold text-white shadow-md transition"
            >
              Selesai ({selectedIndicators.length} Aktif)
            </button>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#1A1F2C] text-white border border-[#2A3245] px-4 py-2.5 rounded-xl text-xs font-medium shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom">
          <Info className="w-4 h-4 text-[#2962FF]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
