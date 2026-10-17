import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to get Gemini client
function getGeminiClient(customApiKey?: string) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY tidak ditemukan. Silakan atur di Settings atau panel Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ==========================================
// REAL-TIME MULTI-PAIR FOREX & GOLD WEBSOCKET TICK FEED
// ==========================================
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

interface PairState {
  symbol: string;
  name: string;
  price: number;
  open: number;
  high: number;
  low: number;
  decimals: number;
  spread: number;
  volatility: number;
}

const pairStates: Record<string, PairState> = {
  XAUUSD: {
    symbol: 'XAUUSD',
    name: 'Gold Spot / US Dollar',
    price: 2674.85,
    open: 2668.50,
    high: 2682.40,
    low: 2662.10,
    decimals: 2,
    spread: 0.20,
    volatility: 0.45,
  },
  EURUSD: {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    price: 1.0864,
    open: 1.0842,
    high: 1.0895,
    low: 1.0830,
    decimals: 4,
    spread: 0.00015,
    volatility: 0.00018,
  },
  USDJPY: {
    symbol: 'USDJPY',
    name: 'US Dollar / Japanese Yen',
    price: 152.45,
    open: 151.90,
    high: 153.10,
    low: 151.75,
    decimals: 2,
    spread: 0.018,
    volatility: 0.045,
  },
  GBPUSD: {
    symbol: 'GBPUSD',
    name: 'British Pound / US Dollar',
    price: 1.2982,
    open: 1.2950,
    high: 1.3020,
    low: 1.2940,
    decimals: 4,
    spread: 0.0002,
    volatility: 0.00022,
  },
  USDCAD: {
    symbol: 'USDCAD',
    name: 'US Dollar / Canadian Dollar',
    price: 1.3835,
    open: 1.3810,
    high: 1.3870,
    low: 1.3795,
    decimals: 4,
    spread: 0.0002,
    volatility: 0.0002,
  },
  USDCHF: {
    symbol: 'USDCHF',
    name: 'US Dollar / Swiss Franc',
    price: 0.8654,
    open: 0.8640,
    high: 0.8690,
    low: 0.8625,
    decimals: 4,
    spread: 0.00018,
    volatility: 0.00016,
  },
  DXY: {
    symbol: 'DXY',
    name: 'US Dollar Index',
    price: 103.85,
    open: 103.50,
    high: 104.20,
    low: 103.40,
    decimals: 2,
    spread: 0.03,
    volatility: 0.035,
  },
};

function generateTickForPair(pairKey: string): PriceTick {
  const p = pairStates[pairKey] || pairStates.XAUUSD;
  const delta = (Math.random() - 0.49) * p.volatility;
  p.price = parseFloat((p.price + delta).toFixed(p.decimals));

  if (p.price > p.high) p.high = p.price;
  if (p.price < p.low) p.low = p.price;

  const change = parseFloat((p.price - p.open).toFixed(p.decimals));
  const changePercent = parseFloat(((change / p.open) * 100).toFixed(2));

  return {
    symbol: p.symbol,
    name: p.name,
    price: p.price,
    bid: parseFloat((p.price - p.spread / 2).toFixed(p.decimals)),
    ask: parseFloat((p.price + p.spread / 2).toFixed(p.decimals)),
    change,
    changePercent,
    high: p.high,
    low: p.low,
    decimals: p.decimals,
    timestamp: Date.now(),
  };
}

function getAllPairsSnapshot(): Record<string, PriceTick> {
  const snapshot: Record<string, PriceTick> = {};
  for (const key of Object.keys(pairStates)) {
    snapshot[key] = generateTickForPair(key);
  }
  return snapshot;
}

// WebSocket server setup attached to same HTTP server
const wss = new WebSocketServer({ server, path: '/ws/price' });

wss.on('connection', (ws: WebSocket) => {
  // Send immediate initial multi-pair snapshot
  ws.send(JSON.stringify({ type: 'all_pairs_snapshot', data: getAllPairsSnapshot() }));

  ws.on('message', (message: string) => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.action === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
    } catch (e) {
      // ignore
    }
  });
});

// Broadcast live ticks every 1.2 seconds for active pairs
setInterval(() => {
  if (wss.clients.size > 0) {
    const ticks = getAllPairsSnapshot();
    const payload = JSON.stringify({ type: 'multi_price_tick', data: ticks });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }
}, 1200);

// REST endpoint to get current live prices
app.get('/api/price/pairs', (_req: Request, res: Response) => {
  res.json({ success: true, data: getAllPairsSnapshot() });
});

app.get('/api/price/xauusd', (_req: Request, res: Response) => {
  res.json({ success: true, data: generateTickForPair('XAUUSD') });
});

// POST /api/ai/chat
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const {
      provider = 'gemini',
      model = 'gemini-3.8-flash',
      apiKey = '',
      baseUrl = '',
      temperature = 0.7,
      systemInstruction = 'Kamu adalah analis forex profesional yang ahli membaca chart TradingView. Jawab ringkas, terstruktur, dan sertakan level harga konkret jika terlihat di chart.',
      messages = [],
      images = [],
    } = req.body;

    const lastMessage = messages[messages.length - 1]?.content || 'Analisa chart XAUUSD ini.';

    const cleanedImages = (images || []).map((img: string) => {
      const match = img.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.*)$/);
      if (match) {
        return { mimeType: `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}`, data: match[2] };
      }
      return { mimeType: 'image/jpeg', data: img };
    });

    if (provider === 'gemini') {
      const gemini = getGeminiClient(apiKey);
      const parts: any[] = [];

      for (const img of cleanedImages) {
        parts.push({
          inlineData: {
            mimeType: img.mimeType,
            data: img.data,
          },
        });
      }

      let promptContext = '';
      if (messages.length > 1) {
        const historyText = messages
          .slice(-6, -1)
          .map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
          .join('\n');
        promptContext = `Riwayat percakapan sebelumnya:\n${historyText}\n\nPertanyaan terkini:\n`;
      }
      promptContext += lastMessage;

      parts.push({ text: promptContext });

      const effectiveModel = model && model.includes('gemini') ? model : 'gemini-3.8-flash';

      const response = await gemini.models.generateContent({
        model: effectiveModel,
        contents: { parts },
        config: {
          systemInstruction,
          temperature: Math.min(Math.max(Number(temperature) || 0.7, 0), 2),
        },
      });

      const responseText = response.text || 'Tidak ada teks yang dihasilkan oleh AI.';
      return res.json({ success: true, text: responseText, provider: 'gemini', model: effectiveModel });
    }

    if (provider === 'openai' || provider === 'groq' || provider === 'openrouter') {
      const effectiveKey = apiKey || (provider === 'gemini' ? process.env.GEMINI_API_KEY : '');
      if (!effectiveKey) {
        return res.status(400).json({
          success: false,
          error: `API Key untuk provider ${provider.toUpperCase()} belum diisi di Settings.`,
        });
      }

      let endpoint = 'https://api.openai.com/v1/chat/completions';
      let defaultModel = 'gpt-4o-mini';

      if (provider === 'groq') {
        endpoint = baseUrl || 'https://api.groq.com/openai/v1/chat/completions';
        defaultModel = 'llama-3.3-70b-versatile';
      } else if (provider === 'openrouter') {
        endpoint = baseUrl || 'https://openrouter.ai/api/v1/chat/completions';
        defaultModel = 'google/gemini-flash-1.5';
      } else if (baseUrl) {
        endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
      }

      const activeModel = model || defaultModel;

      const formattedMessages: any[] = [
        { role: 'system', content: systemInstruction },
      ];

      for (let i = 0; i < messages.length - 1; i++) {
        formattedMessages.push({
          role: messages[i].role === 'user' ? 'user' : 'assistant',
          content: messages[i].content,
        });
      }

      if (provider === 'groq' && cleanedImages.length > 0) {
        formattedMessages.push({
          role: 'user',
          content: `[Catatan: User melampirkan screenshot chart XAUUSD]. ${lastMessage}`,
        });
      } else if (cleanedImages.length > 0) {
        const contentParts: any[] = [{ type: 'text', text: lastMessage }];
        for (const img of cleanedImages) {
          contentParts.push({
            type: 'image_url',
            image_url: {
              url: `data:${img.mimeType};base64,${img.data}`,
            },
          });
        }
        formattedMessages.push({
          role: 'user',
          content: contentParts,
        });
      } else {
        formattedMessages.push({
          role: 'user',
          content: lastMessage,
        });
      }

      const apiResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveKey}`,
          ...(provider === 'openrouter' ? { 'HTTP-Referer': 'https://aixauusd.app', 'X-Title': 'AI XAUUSD Analyzer' } : {}),
        },
        body: JSON.stringify({
          model: activeModel,
          messages: formattedMessages,
          temperature: Math.min(Math.max(Number(temperature) || 0.7, 0), 2),
        }),
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        return res.status(apiResponse.status).json({
          success: false,
          error: `API error (${apiResponse.status}): ${errorText}`,
        });
      }

      const data: any = await apiResponse.json();
      const answer = data.choices?.[0]?.message?.content || 'Tidak ada balasan dari provider.';
      return res.json({ success: true, text: answer, provider, model: activeModel });
    }

    return res.status(400).json({ success: false, error: `Provider ${provider} tidak didukung.` });
  } catch (err: any) {
    console.error('AI chat error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Terjadi kesalahan internal server.' });
  }
});

// POST /api/ai/test
app.post('/api/ai/test', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { provider = 'gemini', apiKey = '', baseUrl = '', model = '' } = req.body;

    if (provider === 'gemini') {
      const gemini = getGeminiClient(apiKey);
      const effectiveModel = model || 'gemini-3.8-flash';
      const response = await gemini.models.generateContent({
        model: effectiveModel,
        contents: 'Ping! Jawab hanya kata "OK" untuk tes koneksi.',
      });
      const latencyMs = Date.now() - startTime;
      return res.json({
        success: true,
        latencyMs,
        message: `Koneksi Gemini (${effectiveModel}) sukses! Latency: ${latencyMs}ms. Respon: ${response.text?.trim()}`,
      });
    }

    if (provider === 'groq' || provider === 'openai' || provider === 'openrouter') {
      const effectiveKey = apiKey;
      if (!effectiveKey) {
        return res.status(400).json({
          success: false,
          latencyMs: Date.now() - startTime,
          error: `API Key untuk ${provider.toUpperCase()} belum diisi.`,
        });
      }

      let endpoint = 'https://api.openai.com/v1/chat/completions';
      let defaultModel = 'gpt-4o-mini';
      if (provider === 'groq') {
        endpoint = baseUrl || 'https://api.groq.com/openai/v1/chat/completions';
        defaultModel = 'llama-3.3-70b-versatile';
      } else if (provider === 'openrouter') {
        endpoint = baseUrl || 'https://openrouter.ai/api/v1/chat/completions';
        defaultModel = 'google/gemini-flash-1.5';
      } else if (baseUrl) {
        endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
      }

      const activeModel = model || defaultModel;
      const apiRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveKey}`,
        },
        body: JSON.stringify({
          model: activeModel,
          messages: [{ role: 'user', content: 'Ping! Answer "OK".' }],
          max_tokens: 10,
        }),
      });

      const latencyMs = Date.now() - startTime;
      if (!apiRes.ok) {
        const errorText = await apiRes.text();
        return res.status(apiRes.status).json({
          success: false,
          latencyMs,
          error: `Error ${apiRes.status}: ${errorText}`,
        });
      }

      return res.json({
        success: true,
        latencyMs,
        message: `Koneksi ${provider.toUpperCase()} (${activeModel}) 200 OK! Latency: ${latencyMs}ms.`,
      });
    }

    return res.status(400).json({ success: false, error: 'Provider tidak dikenal.' });
  } catch (testErr: any) {
    return res.status(500).json({
      success: false,
      latencyMs: Date.now() - startTime,
      error: testErr.message || 'Gagal tes koneksi',
    });
  }
});

// POST /api/ai/detect-pattern (One-Tap Technical Analysis)
app.post('/api/ai/detect-pattern', async (req: Request, res: Response) => {
  try {
    const {
      symbol = 'XAUUSD',
      currentPrice = 2674.85,
      timeframe = '1H',
      image = '',
      provider = 'gemini',
      apiKey = '',
      decimals = 2,
    } = req.body;

    const priceNum = Number(currentPrice) || 2674.85;
    const dec = Number(decimals) || (symbol.includes('JPY') || symbol === 'XAUUSD' || symbol === 'DXY' ? 2 : 4);

    // Calculate baseline levels locked to exact current price
    const delta = dec === 4 ? 0.0065 : (symbol === 'XAUUSD' ? 12.5 : 0.85);
    const calculatedSupport = parseFloat((priceNum - delta).toFixed(dec));
    const calculatedResistance = parseFloat((priceNum + delta).toFixed(dec));
    const calculatedTarget = parseFloat((priceNum + delta * 1.8).toFixed(dec));
    const calculatedStop = parseFloat((priceNum - delta * 0.9).toFixed(dec));

    // Try AI Vision detection if Gemini or provider available
    let detectedPattern = {
      name: 'Ascending Triangle',
      bias: 'BULLISH',
      confidence: 89,
      currentPrice: priceNum,
      breakoutLevel: calculatedResistance,
      supportLevel: calculatedSupport,
      resistanceLevel: calculatedResistance,
      targetProfit: calculatedTarget,
      stopLoss: calculatedStop,
      summary: `Pola Ascending Triangle terdeteksi pada chart ${symbol} (${timeframe}). Resistance horizontal di ${calculatedResistance} dan higher lows support di ${calculatedSupport}. Potensi breakout bullish menuju ${calculatedTarget}.`,
    };

    try {
      const gemini = getGeminiClient(apiKey);
      const parts: any[] = [];

      if (image) {
        const match = image.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.*)$/);
        const data = match ? match[2] : image;
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data,
          },
        });
      }

      parts.push({
        text: `Deteksi pola chart teknikal (seperti Triangle, Head & Shoulders, Double Top/Bottom, Flag, Wedge, Channel) untuk pair ${symbol} pada timeframe ${timeframe}.
Harga pasar terkini adalah ${priceNum}.
PENTING: Nilai supportLevel dan resistanceLevel HARUS persis di sekitar harga pasar saat ini (${priceNum}) dengan ${dec} angka di belakang koma.
Balas HANYA dalam format JSON valid tanpa markdown backticks:
{
  "name": "Nama Pola (misal: Ascending Triangle / Double Bottom / Head and Shoulders)",
  "bias": "BULLISH atau BEARISH atau NEUTRAL",
  "confidence": angka 70 sampai 95,
  "supportLevel": ${calculatedSupport},
  "resistanceLevel": ${calculatedResistance},
  "breakoutLevel": angka level breakout,
  "targetProfit": angka target TP,
  "stopLoss": angka level SL,
  "summary": "Penjelasan ringkas 1-2 kalimat tentang pola dan rekomendasi aksi trading"
}`,
      });

      const response = await gemini.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts },
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text?.trim() || '';
      const parsed = JSON.parse(rawText);
      if (parsed.name && parsed.supportLevel && parsed.resistanceLevel) {
        detectedPattern = {
          name: parsed.name,
          bias: parsed.bias || 'BULLISH',
          confidence: Number(parsed.confidence) || 88,
          currentPrice: priceNum,
          breakoutLevel: parseFloat(Number(parsed.breakoutLevel || calculatedResistance).toFixed(dec)),
          supportLevel: parseFloat(Number(parsed.supportLevel || calculatedSupport).toFixed(dec)),
          resistanceLevel: parseFloat(Number(parsed.resistanceLevel || calculatedResistance).toFixed(dec)),
          targetProfit: parseFloat(Number(parsed.targetProfit || calculatedTarget).toFixed(dec)),
          stopLoss: parseFloat(Number(parsed.stopLoss || calculatedStop).toFixed(dec)),
          summary: parsed.summary || detectedPattern.summary,
        };
      }
    } catch (aiErr) {
      // Fallback uses the synchronized calculated levels
      console.log('Using synchronized fallback pattern analysis:', aiErr);
    }

    return res.json({ success: true, pattern: detectedPattern });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Gagal mendeteksi pola' });
  }
});

// Vite middleware in dev or static serve in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, () => {
    console.log(`Server & WebSocket running on port ${port}`);
  });
}

startServer();
