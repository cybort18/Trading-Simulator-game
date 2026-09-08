# Financial Mathematics & Trading Simulation Engine Specification
## CryptoOS 98 — Retro Crypto Futures Trading Simulator
**Document Version:** 1.0.0  
**Status:** Approved for Engineering Implementation  
**Mathematical Rigor:** Production-Grade Perpetual Futures Mechanics  
**Author:** Autonomous Principal Software Architect & Product Systems Engineer  

---

## 1. Mathematical Definitions & Core Variables

| Symbol | Name | Description | Default / Unit |
| :--- | :--- | :--- | :--- |
| $L$ | **Leverage Multiplier** | Position leverage factor ($1 \le L \le 100$) | Integer (e.g. $20$) |
| $P_{\text{entry}}$ | **Entry Price** | Weighted average fill price of the position | USDT |
| $P_{\text{mark}}$ | **Mark Price** | Real-time reference price from Binance Futures WebSocket | USDT |
| $P_{\text{liq}}$ | **Liquidation Price** | The precise mark price that triggers forced liquidation | USDT |
| $Q$ | **Position Size / Quantity** | Size of the asset contract | Base Currency (BTC, ETH, SOL) |
| $V$ | **Notional Position Value** | Gross dollar exposure of the position | USDT |
| $IM$ | **Initial Margin** | Margin collateral locked to open the position | USDT |
| $MM$ | **Maintenance Margin** | Minimum collateral required to keep the position open | USDT |
| $MMR$ | **Maintenance Margin Rate** | Minimum equity ratio threshold before liquidation | Decimal ($0.0050 = 0.5\%$) |
| $uPnL$ | **Unrealized PnL** | Floating profit or loss based on current Mark Price | USDT |
| $rPnL$ | **Realized PnL** | Closed profit or loss after subtracting trading fees | USDT |
| $\text{ROE}$ | **Return on Equity** | Percentage return relative to initial margin | Percentage ($\%$) |
| $F_{\text{taker}}$ | **Taker Fee Rate** | Simulated execution fee for market orders | $0.0005$ ($0.05\%$) |
| $F_{\text{maker}}$ | **Maker Fee Rate** | Simulated execution fee for limit orders | $0.0002$ ($0.02\%$) |
| $R_{\text{fund}}$ | **Funding Rate** | Periodic funding rate applied to open notional value | Decimal (e.g. $+0.0001 = 0.01\%$) |

---

## 2. Fundamental Formula Derivations

### 2.1 Notional Value & Initial Margin
When a trader enters an order specifying margin collateral $IM$ at leverage $L$:
$$V_{\text{entry}} = IM \times L$$
The contract quantity in base asset units (e.g., BTC) is:
$$Q = \frac{V_{\text{entry}}}{P_{\text{entry}}} = \frac{IM \times L}{P_{\text{entry}}}$$
Conversely, if the trader inputs quantity $Q$, the required initial margin is:
$$IM = \frac{Q \times P_{\text{entry}}}{L}$$

### 2.2 Maintenance Margin ($MM$)
The maintenance margin represents the mandatory capital buffer:
$$MM = (Q \times P_{\text{mark}}) \times MMR$$
Where $MMR$ is determined by the asset tier:
- **BTC/USDT:** $MMR = 0.50\% = 0.0050$
- **ETH/USDT:** $MMR = 0.65\% = 0.0065$
- **SOL/USDT:** $MMR = 1.00\% = 0.0100$

### 2.3 Unrealized PnL ($uPnL$)
Floating profit and loss tracks mark price divergence from entry:

- **For Long Positions (Bullish):**
  $$uPnL_{\text{long}} = Q \times (P_{\text{mark}} - P_{\text{entry}})$$
  Substituting $Q = \frac{IM \times L}{P_{\text{entry}}}$:
  $$uPnL_{\text{long}} = IM \times L \times \left(\frac{P_{\text{mark}} - P_{\text{entry}}}{P_{\text{entry}}}\right)$$

- **For Short Positions (Bearish):**
  $$uPnL_{\text{short}} = Q \times (P_{\text{entry}} - P_{\text{mark}})$$
  Substituting $Q$:
  $$uPnL_{\text{short}} = IM \times L \times \left(\frac{P_{\text{entry}} - P_{\text{mark}}}{P_{\text{entry}}}\right)$$

### 2.4 Return on Equity (ROE %)
Return on equity expresses unrealized profit as a direct percentage of initial collateral:
$$\text{ROE \%} = \frac{uPnL}{IM} \times 100\%$$

- **Long ROE:**
  $$\text{ROE \%}_{\text{long}} = \left(\frac{P_{\text{mark}} - P_{\text{entry}}}{P_{\text{entry}}}\right) \times L \times 100\%$$

- **Short ROE:**
  $$\text{ROE \%}_{\text{short}} = \left(\frac{P_{\text{entry}} - P_{\text{mark}}}{P_{\text{entry}}}\right) \times L \times 100\%$$

### 2.5 Trading Fees & Realized PnL ($rPnL$)
Fees are assessed at opening and closing:
$$F_{\text{open}} = Q \times P_{\text{entry}} \times F_{\text{fee\_rate}}$$
$$F_{\text{close}} = Q \times P_{\text{exit}} \times F_{\text{fee\_rate}}$$

Upon position closure at exit price $P_{\text{exit}}$:
$$rPnL = uPnL(P_{\text{exit}}) - F_{\text{open}} - F_{\text{close}} - \sum \text{FundingFees}$$

---

## 3. Precise Liquidation Price ($P_{\text{liq}}$) Derivations

In an isolated margin position, liquidation triggers when the position's remaining equity is depleted down to the Maintenance Margin requirement plus closing fees.

$$\text{Position Equity}(P_{\text{liq}}) = IM + uPnL(P_{\text{liq}})$$
At the exact point of liquidation:
$$\text{Position Equity}(P_{\text{liq}}) - \text{Closing Fee} = MM(P_{\text{liq}})$$

### 3.1 Isolated Long Liquidation Price
$$IM + Q \times (P_{\text{liq}} - P_{\text{entry}}) - Q \times P_{\text{liq}} \times F_{\text{taker}} = Q \times P_{\text{liq}} \times MMR$$

Rearranging terms:
$$IM - Q \cdot P_{\text{entry}} + Q \cdot P_{\text{liq}} \cdot (1 - MMR - F_{\text{taker}}) = 0$$
$$Q \cdot P_{\text{liq}} \cdot (1 - MMR - F_{\text{taker}}) = Q \cdot P_{\text{entry}} - IM$$

Since $IM = \frac{Q \cdot P_{\text{entry}}}{L}$:
$$Q \cdot P_{\text{entry}} - IM = Q \cdot P_{\text{entry}} \left(1 - \frac{1}{L}\right)$$

Dividing both sides by $Q$:
$$P_{\text{liq, long}} = P_{\text{entry}} \times \frac{1 - \frac{1}{L}}{1 - MMR - F_{\text{taker}}}$$

Alternatively, expressed directly in terms of allocated margin $IM$ and quantity $Q$:
$$\boxed{P_{\text{liq, long}} = \frac{P_{\text{entry}} \cdot Q - IM}{Q \cdot (1 - MMR - F_{\text{taker}})}}$$

### 3.2 Isolated Short Liquidation Price
For a short position, losses accumulate as mark price increases:
$$IM + Q \times (P_{\text{entry}} - P_{\text{liq}}) - Q \times P_{\text{liq}} \times F_{\text{taker}} = Q \times P_{\text{liq}} \times MMR$$

Rearranging terms:
$$IM + Q \cdot P_{\text{entry}} - Q \cdot P_{\text{liq}} \cdot (1 + MMR + F_{\text{taker}}) = 0$$
$$Q \cdot P_{\text{liq}} \cdot (1 + MMR + F_{\text{taker}}) = Q \cdot P_{\text{entry}} + IM$$

Since $IM = \frac{Q \cdot P_{\text{entry}}}{L}$:
$$Q \cdot P_{\text{entry}} + IM = Q \cdot P_{\text{entry}} \left(1 + \frac{1}{L}\right)$$

Dividing both sides by $Q$:
$$P_{\text{liq, short}} = P_{\text{entry}} \times \frac{1 + \frac{1}{L}}{1 + MMR + F_{\text{taker}}}$$

Alternatively, expressed directly in terms of allocated margin $IM$ and quantity $Q$:
$$\boxed{P_{\text{liq, short}} = \frac{P_{\text{entry}} \cdot Q + IM}{Q \cdot (1 + MMR + F_{\text{taker}})}}$$

---

## 4. Cross Margin Engine Mathematics

In Cross Margin mode, all available wallet balance ($\text{AvailableMargin}$) is pooled to prevent liquidation.

$$\text{Total Account Equity} = \text{Wallet Balance} + \sum uPnL_{\text{all\_positions}}$$
Liquidation condition across all cross positions:
$$\text{Total Account Equity} \le \sum MM_{\text{all\_positions}}$$

For a single cross position with total available account equity $E$:
- **Cross Long Liquidation Price:**
  $$P_{\text{liq, cross long}} = \frac{P_{\text{entry}} \cdot Q - E}{Q \cdot (1 - MMR - F_{\text{taker}})}$$
- **Cross Short Liquidation Price:**
  $$P_{\text{liq, cross short}} = \frac{P_{\text{entry}} \cdot Q + E}{Q \cdot (1 + MMR + F_{\text{taker}})}$$

---

## 5. Funding Rate Simulation (8-Hour Cadence)

Perpetual swaps use funding fees to anchor contract prices to spot indices.
- **Cadence:** Evaluated at 00:00, 08:00, and 16:00 UTC.
- **Simulated Funding Rate ($R_{\text{fund}}$):** Ingested live from Binance `fapi/v1/premiumIndex` or clamped between $-0.05\%$ and $+0.05\%$ if offline.
- **Payment Calculation:**
  $$\text{Payment} = \text{Position Notional Value} \times R_{\text{fund}} = (Q \times P_{\text{mark}}) \times R_{\text{fund}}$$
- **Directional Cashflow:**
  - If $R_{\text{fund}} > 0$: Long positions pay funding fee; Short positions receive funding fee.
  - If $R_{\text{fund}} < 0$: Short positions pay funding fee; Long positions receive funding fee.

---

## 6. Comprehensive Numerical Worked Examples

### Scenario: 10.00 USDT Account Going 20x Isolated Long on BTC

#### Step 1: Initial Account & Order Parameters
- Account Starting Balance: **10.00 USDT**
- Pair: **BTC/USDT**
- Entry Mark Price ($P_{\text{entry}}$): **$60,000.00**
- Margin Allocated ($IM$): **5.00 USDT**
- Leverage ($L$): **20x**
- Maintenance Margin Rate ($MMR$): **0.50% = 0.0050**
- Taker Fee Rate ($F_{\text{taker}}$): **0.05% = 0.0005**

#### Step 2: Notional Exposure & Sizing
- Notional Value:
  $$V = IM \times L = 5.00 \times 20 = 100.00 \text{ USDT}$$
- Contract Quantity in BTC:
  $$Q = \frac{100.00}{60,000.00} = 0.00166667 \text{ BTC}$$
- Opening Taker Fee:
  $$F_{\text{open}} = 100.00 \times 0.0005 = 0.05 \text{ USDT}$$
- Remaining Free Available Balance:
  $$\text{AvailableBalance} = 10.00 - 5.00 - 0.05 = 4.95 \text{ USDT}$$

#### Step 3: Exact Liquidation Price Calculation
Applying the isolated long formula:
$$P_{\text{liq, long}} = P_{\text{entry}} \times \frac{1 - \frac{1}{L}}{1 - MMR - F_{\text{taker}}}$$
$$P_{\text{liq, long}} = 60,000.00 \times \frac{1 - \frac{1}{20}}{1 - 0.0050 - 0.0005}$$
$$P_{\text{liq, long}} = 60,000.00 \times \frac{0.9500}{0.9945}$$
$$P_{\text{liq, long}} = 60,000.00 \times 0.955253896 \approx \mathbf{\$57,315.23}$$

*Interpretation:* If BTC drops by just $4.47\%$ from $\$60,000$ to $\$57,315.23$, the 20x position is completely liquidated.

#### Step 4A: Bullish Outcome (BTC Rises to $63,000.00)
- Price Change: $+5.00\%$
- Current Mark Price: $\$63,000.00$
- Floating Unrealized PnL:
  $$uPnL = 0.00166667 \times (63,000.00 - 60,000.00) = 0.00166667 \times 3,000 = +\mathbf{5.00 \text{ USDT}}$$
- Return on Equity (ROE %):
  $$\text{ROE \%} = \frac{+5.00}{5.00} \times 100\% = +\mathbf{100.0\%}$$
- Account Equity:
  $$\text{Equity} = 4.95 \text{ (Free)} + 5.00 \text{ (Margin)} + 5.00 \text{ (uPnL)} = \mathbf{14.95 \text{ USDT}}$$
- Closing Position at Market:
  - Closing Fee: $0.00166667 \times 63,000 \times 0.0005 = 0.0525$ USDT
  - Realized Gain: $5.00 - 0.0525 = +4.9475$ USDT
  - Final Wallet Balance: $4.95 + 5.00 + 4.9475 = \mathbf{14.8975 \text{ USDT}}$ (+48.98% account gain)

#### Step 4B: Liquidation Event (BTC Plunges to $57,315.23)
- Current Mark Price hits $\$57,315.23$
- Price Change: $-4.47\%$
- Floating Loss:
  $$uPnL = 0.00166667 \times (57,315.23 - 60,000.00) = 0.00166667 \times (-2,684.77) \approx -4.4746 \text{ USDT}$$
- Maintenance Margin required at $\$57,315.23$:
  $$MM = (0.00166667 \times 57,315.23) \times 0.0050 = 95.525 \times 0.0050 = 0.4776 \text{ USDT}$$
- Remaining Position Collateral:
  $$\text{Collateral} = 5.00 - 4.4746 - 0.0478 \text{ (Closing Fee)} = 0.4776 \text{ USDT} = MM$$
- **Trigger:** Collateral equals Maintenance Margin threshold.
- **Execution:** Position is forcibly terminated. The 5.00 USDT initial margin is consumed.
- **Resulting Account Balance:** $4.95 \text{ USDT}$. System alert pops up: `POSITION LIQUIDATED ☠`.

---

## 7. Slippage & Execution Latency Simulation

To simulate real-world orderbook liquidity dynamics without heavy server overhead, CryptoOS 98 applies a micro-slippage model for market orders:

$$\text{Slippage Rate} = 0.0005 \times \sqrt{\frac{\text{Order Size (USDT)}}{100}}$$
- For standard small sizes ($\le 100 \text{ USDT}$), slippage is fixed to $0.05\%$.
- Market Long fills at $P_{\text{fill}} = P_{\text{mark}} \times (1 + \text{Slippage Rate})$.
- Market Short fills at $P_{\text{fill}} = P_{\text{mark}} \times (1 - \text{Slippage Rate})$.
