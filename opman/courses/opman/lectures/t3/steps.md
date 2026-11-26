## People and time | 4 min

People drive every performance objective: quality, speed, dependability (toy makers fight for workers before Christmas), flexibility and cost. Operations need leaders who push the team in a smart way when timing is tight.

### Where the working time goes

| Required (standard) time | Losses |
|---|---|
| **work** + general pauses + specific pauses | **personal** (illness, a sick child) · **technical and organizational** (IT restarts the servers) · **force majeure** |

:::teach Teacher said
Never plan an operation based on people at 100 %. Plan at 80 % so you have a 20 % buffer: if you need 30 people, plan 33–34.
:::

<div class="mg" data-g="sort" data-set="timeloss"></div>

{{q:t3-plan}}
{{q:t3-loss}}

## Time you have, time you need, capacity | 6 min

:::idea The idea
Two different questions. How much time do you **have** (the watch time minus the shift time)? How much time do you **need** (unit time · units + batch time)? need / have tells you whether you have enough: 100 % is ideal, above 100 % is over capacity, below is under capacity.
:::

| Type | What it is | Used for |
|---|---|---|
| **Shift time t_c** | cleaning, breaks, preparing the workplace | the time you HAVE: shift − t_c |
| **Batch time t_b** | setup, studying the drawing, handing over the batch | the time you NEED, once per batch |
| **Unit time t_a** | clamping, turning, checking one piece | the time you NEED, for every piece |

:::trap Exam trap
Typical mistake: "4 pieces go in the oven for 20 minutes, so one piece takes 5." One piece also needs 20 minutes: that is a **batch** time. And part of the shift time may be written **outside the table** (Test 1: "each shift uses 12 min for general cleaning").
:::

<div class="mg" data-g="sort" data-set="timetypes"></div>

**Capacity** is the **maximum** number of outputs an operation can produce in a specific period under specific conditions. (If you're asked what capacity is, the answer must contain the word *maximum*.)

### Kinds of time and OEE

Lead time (one unit, start to finish) · cycle time (one process) · changeover time (setup) · takt time (rate of customer demand) · line takt (rate of the line's outputs).

<div class="mg" data-g="order" data-set="oee"></div>

{{q:t3-batch}}
{{q:t3-cap}}
{{q:t3-takt}}

## How much time do you have? | 5 min

### Worked example: third quarter (lecture)

Plant shutdown Monday 2nd to 13th August (10 working days), national holidays 5 and 6 July on Thursday and Friday, 28 September on a Tuesday (17 November is in the fourth quarter, so ignore it), 13 weekends, maintenance 5 h a month during working hours, two 8-hour shifts.

AT = (31 + 31 + 30 − 10 − 26 − 3) · 2 · 8 − 5 · 3 = 53 · 16 − 15 = **833 h**.

For **one worker** (8 h a day, one vacation week = 5 days left, illness 5 %): (92 − 10 − 26 − 3 − 5) · 8 · 0.95 = **364.8 h**; 8 workers: 2 918.4 h. People work one shift, so no "· 2" here.

:::trap Exam trap
A holiday on a weekend is not subtracted twice. Maintenance happens during working hours, so it reduces the available time.
:::

<div class="mg" data-g="drill" data-kind="avail"></div>

{{q:t3-at}}

## When must the order start? | 6 min

### Worked example: wood-cutting line (lecture)

WS25 every 3.5 min, WS30 every 3 min, setup 20 min per batch, cleaning and preparing 30 min per shift. Order: 20 WS25 + 100 WS30.

- Need: (3.5 · 20 + 20) + (3 · 100 + 20) = 90 + 320 = **410 min**.
- Have: 480 − 30 = **450 min** → 410 / 450 = **91.11 %**: one worker can do it in one shift.

:::teach Teacher said
If you need more than you have, the answer is never "we can't". It's "we finish at…": a second shift, another machine, or the next day. Then work out exactly when.
:::

### Practice Test 1, exercise 2: 120 pieces, done by the end of Friday

Unit time 0.5 + 13.5 + 0.5 + 0.5 = 15 min; batch time 8 + 150 + 7 = 165 min; shift time 5 + 5 + 12 = 22 min.
Need 15 · 120 + 165 = **1 965 min**; have 480 − 22 = **458 min**; 1 965 / 458 = **4.29 shifts** → 4 full shifts (Tue–Fri) + 133 min on Monday. The last 17 min of the day are cleaning, so start 133 + 17 = 150 min before 17:00: **Monday 14:30**. (LTL: 16:29, UTL: 12:31.)

<div class="mg" data-g="order" data-set="test1"></div>

<div class="mg" data-g="drill" data-kind="time-start"></div>

### Measuring small motions

Time-motion studies use predetermined motion time systems (**PMTS**): MTM and MOST (Maynard, 1940). **1 hour = 100 000 TMU**, 1 TMU = 0.036 s. Examples: apply pressure 14 TMU, regrasp 6, eye action 7, one step 18, bend and arise 61.

{{q:t3-need}}
{{q:t3-shifts}}
{{q:t3-start}}
{{q:t3-tmu}}

## Little's Law | 5 min

:::idea The idea
There are always three numbers: **units in the system**, the **rate** (units per time) and the **time** in the system. units = rate · time. You get two, you find the third.
:::

| Example | Given | Found |
|---|---|---|
| Baristas (Test 1, 4a) | 10 customers, all in 25 min, 5 min per customer per barista | 25 / 10 = 2.5 min per customer → **2 baristas** |
| Finished goods (4b) | 10 per day, 2 days | **20 goods** |
| Users (4c) | 8 000 per hour = 2.22 per s; 5 s + 30 s | N = 35 · 2.22 ≈ **77.7 users** |
| Waiting room (lecture) | 40 people, 2.5 h | **16 per hour** stay |
| Office codes (lecture) | 20 codes, 4 leave per day | ready after **5 days** |

:::trap Exam trap
The exercises play with words and include data you don't need. And many students lose points by mixing **batches** and **products**: the data are in products, the question asks for batches (or the other way round), and the answer is 10× off.
:::

<div class="mg" data-g="drill" data-kind="little"></div>

<div class="mg" data-g="trap" data-set="t1"></div>

{{q:t3-little}}
{{q:t3-barista}}
{{q:t3-fg}}
{{q:t3-codes}}
