import { TradingPair, TapeTrade } from '@/types/market';
import { useOrderBookStore } from '@/stores/useOrderBookStore';
import { useMarketDataStore } from '@/stores/useMarketDataStore';
import { soundFXService } from '@/services/SoundFXService';

export class BinanceDepthService {
  private static instance: BinanceDepthService | null = null;
  private socket: WebSocket | null = null;
  private currentPair: TradingPair = 'BTCUSDT';
  private isActive = false;
  private simulationTimer: ReturnType<typeof setInterval> | null = null;
  private tradeSimulationTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private lastMessageTimestamp = 0;

  private constructor() {}

  public static getInstance(): BinanceDepthService {
    if (!BinanceDepthService.instance) {
      BinanceDepthService.instance = new BinanceDepthService();
    }
    return BinanceDepthService.instance;
  }

  public getLastMessageTimestamp(): number {
    return this.lastMessageTimestamp;
  }

  public start(pair?: TradingPair): void {
    if (pair) {
      this.currentPair = pair;
    }
    this.isActive = true;
    this.connect();
    this.fetchSnapshot();
  }

  public stop(): void {
    this.isActive = false;
    this.clearSimulation();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
  }

  public switchPair(newPair: TradingPair): void {
    if (this.currentPair === newPair && this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }
    this.currentPair = newPair;
    useOrderBookStore.getState().setSelectedPair(newPair);
    if (this.isActive) {
      this.stop();
      this.start(newPair);
    }
  }

  private connect(): void {
    if (!this.isActive) return;

    const symbolLower = this.currentPair.toLowerCase();
    const streamEndpoint = `wss://data-stream.binance.vision/stream?streams=${symbolLower}@depth20@100ms/${symbolLower}@aggTrade`;
    const fallbackEndpoint = `wss://stream.binance.com:9443/stream?streams=${symbolLower}@depth20@100ms/${symbolLower}@aggTrade`;

    try {
      this.socket = new WebSocket(streamEndpoint);

      this.socket.onopen = () => {
        this.clearSimulation();
        this.lastMessageTimestamp = Date.now();
      };

      this.socket.onmessage = (event: MessageEvent) => {
        this.lastMessageTimestamp = Date.now();
        this.handleMessage(event.data);
      };

      this.socket.onerror = () => {
        // Switch to fallback endpoint or start offline simulation if failed
        if (!this.simulationTimer) {
          this.startSimulation();
        }
      };

      this.socket.onclose = () => {
        if (this.isActive) {
          this.startSimulation();
          this.scheduleReconnect(fallbackEndpoint);
        }
      };
    } catch {
      this.startSimulation();
    }
  }

  private scheduleReconnect(altEndpoint?: string): void {
    if (this.reconnectTimer || !this.isActive) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isActive) return;
      try {
        const symbolLower = this.currentPair.toLowerCase();
        const endpoint = altEndpoint || `wss://data-stream.binance.vision/stream?streams=${symbolLower}@depth20@100ms/${symbolLower}@aggTrade`;
        this.socket = new WebSocket(endpoint);
        this.socket.onopen = () => {
          this.clearSimulation();
        };
        this.socket.onmessage = (event) => this.handleMessage(event.data);
        this.socket.onclose = () => {
          if (this.isActive) this.scheduleReconnect();
        };
      } catch {
        this.startSimulation();
      }
    }, 4000);
  }

  private handleMessage(rawData: string): void {
    try {
      const payload = JSON.parse(rawData);
      if (!payload || !payload.data) return;

      const stream: string = payload.stream || '';
      const data = payload.data;

      // 1. Partial Depth 20 Levels
      if (stream.includes('@depth20')) {
        const bids: [string, string][] = data.bids || [];
        const asks: [string, string][] = data.asks || [];
        if (bids.length > 0 || asks.length > 0) {
          useOrderBookStore.getState().setOrderBookData(bids, asks);
        }
      }

      // 2. Aggregate Trades (Time & Sales Tape)
      else if (stream.includes('@aggTrade')) {
        const price = parseFloat(data.p);
        const quantity = parseFloat(data.q);
        const time = Number(data.T) || Date.now();
        const isBuyerMaker = Boolean(data.m);
        const valueUsd = price * quantity;

        if (Number.isFinite(price) && Number.isFinite(quantity)) {
          const isWhale = valueUsd >= 25000 || (this.currentPair === 'BTCUSDT' && quantity >= 0.5);
          const trade: TapeTrade = {
            id: String(data.a || `${time}-${Math.random()}`),
            price,
            quantity,
            time,
            isBuyerMaker,
            isWhale,
            valueUsd,
          };

          useOrderBookStore.getState().addTrades([trade]);

          // Optional subtle acoustic click if user enabled audio on tape
          if (useOrderBookStore.getState().isAudioEnabled) {
            soundFXService.playKeyClick();
          }
        }
      }
    } catch {
      // Ignored malformed frames
    }
  }

  /**
   * Fetches immediate REST snapshot to eliminate empty book flickering.
   */
  public async fetchSnapshot(): Promise<void> {
    const endpoints = [
      `https://data-api.binance.vision/api/v3/depth?symbol=${this.currentPair}&limit=20`,
      `https://api.binance.com/api/v3/depth?symbol=${this.currentPair}&limit=20`,
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        if (data && data.bids && data.asks) {
          useOrderBookStore.getState().setOrderBookData(data.bids, data.asks);
          return;
        }
      } catch {
        // Fallback to next endpoint
      }
    }

    // If REST fails (e.g. offline), generate smooth baseline
    this.generateSimulatedDepth();
  }

  /**
   * Generates realistic simulated Depth of Market and Tape ticks when offline.
   */
  private startSimulation(): void {
    if (this.simulationTimer) return;

    this.generateSimulatedDepth();

    this.simulationTimer = setInterval(() => {
      if (!this.isActive) return;
      this.generateSimulatedDepth();
    }, 200);

    this.tradeSimulationTimer = setInterval(() => {
      if (!this.isActive) return;
      this.generateSimulatedTrade();
    }, 1100);
  }

  private clearSimulation(): void {
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }
    if (this.tradeSimulationTimer) {
      clearInterval(this.tradeSimulationTimer);
      this.tradeSimulationTimer = null;
    }
  }

  private generateSimulatedDepth(): void {
    const marketPrice =
      useMarketDataStore.getState().prices[this.currentPair] ||
      (this.currentPair === 'BTCUSDT' ? 79540 : this.currentPair === 'ETHUSDT' ? 2505 : 104.5);

    const tickStep =
      this.currentPair === 'BTCUSDT' ? 1.0 : this.currentPair === 'ETHUSDT' ? 0.1 : 0.01;

    const baseSpread = tickStep * (1 + Math.floor(Math.random() * 2));
    const bestBid = marketPrice - baseSpread / 2;
    const bestAsk = marketPrice + baseSpread / 2;

    const bids: [number, number][] = [];
    const asks: [number, number][] = [];

    for (let i = 0; i < 20; i++) {
      const bidPrice = Number((bestBid - i * tickStep).toFixed(2));
      const askPrice = Number((bestAsk + i * tickStep).toFixed(2));

      // Variance in volume
      const baseQty = this.currentPair === 'BTCUSDT' ? 0.2 : this.currentPair === 'ETHUSDT' ? 2.5 : 45.0;
      const bidQty = Number((baseQty * (0.4 + Math.random() * 1.8)).toFixed(4));
      const askQty = Number((baseQty * (0.4 + Math.random() * 1.8)).toFixed(4));

      bids.push([bidPrice, bidQty]);
      asks.push([askPrice, askQty]);
    }

    useOrderBookStore.getState().setOrderBookData(bids, asks);
  }

  private generateSimulatedTrade(): void {
    const marketPrice =
      useMarketDataStore.getState().prices[this.currentPair] ||
      (this.currentPair === 'BTCUSDT' ? 79540 : this.currentPair === 'ETHUSDT' ? 2505 : 104.5);

    const isBuyerMaker = Math.random() > 0.52;
    const tickJitter = (Math.random() - 0.5) * (marketPrice * 0.0004);
    const tradePrice = Number((marketPrice + tickJitter).toFixed(2));

    const baseQty = this.currentPair === 'BTCUSDT' ? 0.15 : this.currentPair === 'ETHUSDT' ? 1.8 : 30.0;
    const isWhaleProb = Math.random() < 0.08;
    const qtyMultiplier = isWhaleProb ? 8.0 + Math.random() * 6 : 0.2 + Math.random() * 1.5;
    const quantity = Number((baseQty * qtyMultiplier).toFixed(4));
    const valueUsd = tradePrice * quantity;

    const trade: TapeTrade = {
      id: `sim-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      price: tradePrice,
      quantity,
      time: Date.now(),
      isBuyerMaker,
      isWhale: isWhaleProb || valueUsd >= 25000,
      valueUsd,
    };

    useOrderBookStore.getState().addTrades([trade]);

    if (useOrderBookStore.getState().isAudioEnabled) {
      soundFXService.playKeyClick();
    }
  }
}

export const binanceDepthService = BinanceDepthService.getInstance();
