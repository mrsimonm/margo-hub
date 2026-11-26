## Standards and target costing | 5 min

:::idea The idea
A **standard** is "a document that provides requirements, specifications, guidelines or characteristics that can be used consistently to ensure that materials, products, processes and services are fit for their purpose" (ISO). In operations it is the number you compare against: how long a chair takes, how much steel it needs.
:::

- Resources standards cover **material**, **labour** and **others** (like costs in accounting). This lecture: material. Next one: labour.
- Why standards? Two words: **manage** (is the work OK, too fast, too slow?) and **improve** (where can it be better?).

:::teach Teacher said
Doing things faster than the standard is not automatically good. A cappuccino in 5 seconds instead of 2 minutes? Something went wrong.
:::

### Target costing (state exam question)

| Price based on cost | Cost based on price |
|---|---|
| material + labour + expenses = total costs | goal price (what the market accepts) |
| + profit | − profit |
| = final price | = **limit for costs** → limit for expenses, labour, material |

Most firms are in a **red ocean**: the market already has a price (bread, a cappuccino), so you work from the price to the cost: not "how much does it cost?" but "how much **should** it cost?". Cost + profit only works when you are first in a new market (a **blue ocean**, like the first iPhone).

### Ways to set a material standard

**Analytical-calculated** · comparative (**analogy**) · statistical · test · index · estimation. The course uses the first two.

{{q:t2-std}}
{{q:t2-why}}
{{q:t2-target}}

## Material requirement and the CMU | 5 min

Material requirement = **net (useful) requirement** (what ends up in the product) + **necessary useless requirement**: the technically unavoidable losses, either **reversible** (spilled rice back on the plate) or **irreversible** (burnt, thrown away).

### Worked example: the wine barrel (lecture)

Barrels of 100 l, bottles of 500 ml. On paper: 100 / 0.5 = 200 bottles. But 0.2 % is lost in the pipelines and bottling loses 0.3 % per batch of 6 bottles.

| Per bottle | ml |
|---|---|
| wine in the bottle | 500 |
| pipeline loss: 500 · 0.2 % | 1 |
| bottling loss: 6 · 500 · 0.3 % / 6 | 1.5 |
| **needed for one bottle** | **502.5** |

100 000 / 502.5 = 199.0 → **199 bottles**. CMU = 199 · 500 / 100 000 = **99.5 %**.

:::trap Exam trap
Some data are per bottle, some per batch of 6, some in litres, some in ml. Put everything in the same unit first. And a half-full bottle is not a product: round down.
:::

:::ana The fix from the lecture
Ask the supplier for a few ml more in each barrel. It costs cents; an underfilled last bottle might cost you the whole order.
:::

<div class="mg" data-g="drill" data-kind="wine"></div>

{{q:t2-req}}
{{q:t2-wine}}
{{q:t2-cmu}}

## The Bill of Materials and the four CMUs | 6 min

A **Bill of Materials (BOM)** lists the parts of each product and how many of each: for the blue office chair, 5 carpet casters, 5 metal arms for casters (OF_CH_558), 1 metal spider, 8 screws… For 100 chairs you need 5 · 100 = **500 metal arms**.

### Worked example: metal arms (lecture)

- One press cycle cuts **2 ellipse arms** from a 30 × 30 cm square (ellipse half-axes 15 and 7.5 cm, area π · 15 · 7.5 = 353.43 cm²).
- Sheets are sold only as 1 m², in packs of 5. One sheet = 3 × 3 squares = 9 pairs = **18 arms** (a 10 cm strip is waste).
- 500 / 18 = 27.78 → 28 sheets → packs of 5 → **30 sheets** (6 purchases).

| CMU of… | Calculation | Normal chair | Kids' chair (24 × 24) |
|---|---|---|---|
| one press cycle | 2 · 353.43 / 900 | **78.54 %** | 78.54 % |
| one full sheet | 18 · 353.43 / 10 000 | **63.62 %** | 72.38 % |
| the partly used sheet | 14 arms on sheet 28 | **49.48 %** | 45.24 % |
| the whole purchase | used / 30 · 10 000 | **58.90 %** | ≈ 56.5 % |

:::teach Teacher said
In the test he asks all four: the CMU of the cycle, of the full sheet, of the sheet you don't use in full, and of the whole purchase. Here about 40 % of the money spent on material goes to waste: as operations manager you must know it and tell design and marketing.
:::

- **Cycle**: the same for both chairs, because the shape is the same. Only an engineering redesign improves it.
- **Sheet**: the kids' chair fits more ellipses and leaves a smaller strip.
- **Purchase**: the kids' chair is worse: 4 of its 20 sheets stay at 0 %, against 2 of 30. Per order this doesn't change; across a year you can reuse the leftover sheets from stock.

### Analogy versus calculation (Seminar 4)

The kids' chair is 20 % smaller. **Analogy**: 30 · 0.8 = 24 → packs of 5 → 25 sheets. **Calculation**: 4 × 4 squares = 32 arms per sheet; 500 / 32 = 15.6 → 16 → **20 sheets**. Expect this comparison in the exam.

<div class="mg" data-g="drill" data-kind="cmu-sheet"></div>

{{q:t2-arms}}
{{q:t2-cyc}}
{{q:t2-purch}}
{{q:t2-analogy}}

## Cutting steel bars: practice Test 1 | 6 min

Practice Test 1, exercise 1: 5 garages, each with 3 profiles of 5.4 m and 1 of 1.1 m (IPE 140). Bars are sold as 12 m or 6 m.

<div class="mg" data-g="order" data-set="bars"></div>

- Demand: 15 · 5.4 + 5 · 1.1 = **86.5 m**.
- One 12 m bar takes 5.4 + 5.4 + 1.1 = 11.9 m. The best purchase is 90 m: **CMU = 86.5 / 90 = 96.11 %**.
- Two plans reach 96.11 %: 7 × 12 m + 1 × 6 m, or 5 × 12 m + 5 × 6 m. Order **7 × 12 m and 1 × 6 m**: its leftovers are longer.

:::trap Exam trap
Same CMU is not the same answer. The plan with small offcuts loses the points: "in the metal industry something big has much more value than something small".
:::

<div class="mg" data-g="bars" data-preset="garage"></div>

### The follow-up questions

| Question | How to decide |
|---|---|
| Buy cut-to-size for 5 % extra? | Lose 1 − CMU = 3.89 % < 5 % → **no** (the gap is small, so think about other information too) |
| Sell the leftovers at 50 % of 19.50 EUR/m (1 EUR = 25 CZK)? | 3.38 m left (the saw burns some material, which you can't sell) · 19.5 · 0.5 · 25 = **824 CZK** |
| Small truck now (6 m bars only) or wait 2 days (5 % per day)? | 6 m only: CMU 90.10 %, lose 9.9 %. Waiting: 10 % + 3.89 % = 13.89 % → **go now** |

Practice Test 1, exercise 3: one garage, 4 × 5.6 m. 12 m bars: 2 bars, CMU **93.33 %**; 7 m leftover bars: 4 bars, CMU **80 %** → buy 12 m. Cut to size for +12 %? **No**, you lose far less than 12 %.

:::teach Teacher said
Every student gets the same text with different numbers, so your yes/no answers may differ from your friend's. Practise until the logic is automatic.
:::

<div class="mg" data-g="drill" data-kind="bars"></div>

{{q:t2-tie}}
{{q:t2-exact}}
{{q:t2-burn}}
