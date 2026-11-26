## Planning, control and demand | 5 min

- **Planning** formalises what should happen: activities, duties, timing. **Control** compares what was done with the plan, so you can correct it. (A typical state-exam question.)
- **Time horizon** depends on the industry: for some, long term means 50–60 years; for yogurts it can mean a year, and control happens daily (car makers control weekly).
- **Dependent demand** comes from your own plan: a family car needs 5 tyres. **Independent demand** comes from outside: a garage doesn't know which cars come next winter, so it **forecasts**.
- **P:D ratio**: P = throughput time, D = demand time.

### The customer order decoupling point

| Strategy | Pushed to stock up to… | Example (lecture) |
|---|---|---|
| **Make-to-stock (MTS)** | the finished product | clothes in a shopping mall (then the outlet) |
| **Assemble-to-order (ATO)** | the parts | pizza, Lego |
| **Make-to-order (MTO)** | the design and supply chain | a car in Europe, built after you order it |
| **Engineer-to-order (ETO)** | nothing: even the design waits | a sofa designed for your living room |

:::teach Teacher said
If this comes up in the exam, give the example. That's the important thing.
:::

<div class="mg" data-g="sort" data-set="demand"></div>

<div class="mg" data-g="sort" data-set="codp"></div>

{{q:t4-pc}}
{{q:t4-dep}}
{{q:t4-ato}}
{{q:t4-eto}}

## Loading and the five sequencing rules | 6 min

<div class="mg" data-g="order" data-set="om"></div>

- **Loading**: how much to put into the system. **Finite** (load the oven, leave) or **infinite** (a 24-hour bank app never stops).
- **Sequencing**: in what order. Rules: **DD** due date, **LIFO** last in first out, **FIFO** first in first out, **LOT** longest operation time, **SOT** shortest operation time first.

### Worked example: Steve Smith (lecture)

| Job | A | B | C | D | E |
|---|---|---|---|---|---|
| Process time (days) | 5 | 3 | 6 | 2 | 1 |
| Due date | 6 | 5 | 8 | 7 | 3 |

| Rule | Order | Avg time in process | Avg lateness |
|---|---|---|---|
| FIFO | A B C D E | 12 | 6.4 |
| DD | E B A D C | 8.4 | 3.2 |
| LIFO | E D C B A | 8.4 | 3.8 |
| LOT | C A B D E | 12.8 | 7.4 |
| **SOT** | **E D B A C** | **7.6** | **3** |

:::trap Exam trap
Steve wants two things: the lowest average time in process AND to meet the deadlines. Compare both columns for all five rules. Lateness is never negative: early counts as 0. FIFO = the order of the table.
:::

<div class="mg" data-g="rules" data-preset="lecture"></div>

<div class="mg" data-g="drill" data-kind="rules"></div>

{{q:t4-load}}
{{q:t4-sot}}
{{q:t4-fifo}}
{{q:t4-late}}

## Scheduling and Gantt charts | 5 min

**Scheduling** gives the sequence real dates and times. A **Gantt chart** puts the tasks in rows and time in columns: you see what happens when and what runs in parallel. Fast-food managers schedule staff the same way: who works when, and how many people at the peak.

In the test you draw the Gantt for the best rule (SOT), on a real calendar.

:::trap Exam trap
The Czech public holidays at Christmas: 24, 25 and 26 December, and 1 January. Skip weekends. And use half days: 2.5 days + 2.5 days fit into 5 days if the second job starts in the free half; otherwise you need 6.
:::

**FTE** (full-time equivalent): 10 workers can be 5.5 FTE, meaning together they work as much as 5.5 people at 100 %.

<div class="mg" data-g="drill" data-kind="gantt"></div>

{{q:t4-sched}}
{{q:t4-half}}

## Monitoring, controlling, push, pull, DBR | 4 min

- **Monitoring** tracks the process in real time, while you work, so you can change things on the way. **Controlling** checks the result at the end. They are not the same.
- To plan a control, answer: **what, why, who, where, when, how** (the teacher's example: the attendance QR code, only in the lecture room, only until 10:45).
- **Push**: you watch how much material piles up at each station. **Pull**: you check that each station has just enough in front of it.

<div class="mg" data-g="sort" data-set="pushpull"></div>

### Drum-Buffer-Rope (DBR)

<div class="mg" data-g="order" data-set="dbr"></div>

Everything after the drum flows all the time; everything before it only works to refill the buffer. Explaining DBR is an exam question; the calculation comes next.

{{q:t4-mon}}
{{q:t4-dbr}}

## Gradual, parallel and DBR: the calculation | 8 min

Every operation has a cycle time, a batch (setup) time, **P** workplaces and **S** units at once. First the **cycles**: order size / (P · S), rounded **up**.

- **Gradual**: each operation finishes the whole order before the next starts: add (setup + cycles · cycle time) for all operations.
- **Parallel**: units move on after every cycle. The trick on the slide: ask first **which operation is the longest**. Then add the **head** (the first cycles each earlier operation needs to feed the next one, with their setups) and the **tail** (the last units after the longest operation, in whole cycles of the next operations).
- **DBR**: the drum is the longest operation; its buffer is already full, so everything before it is hidden. Lead time = drum + tail.

:::trap Exam trap
Ask whether the setup needs the units from the previous operation (yogurt cups: you need the cups to set up the filling) or not (chairs: you can prepare the machine before the parts arrive). Without units the setup can run earlier, but it only hides behind work that is really happening: Seminar variant 1 saves 15 minutes, not 20.
:::

| Seminar (20 units) | Gradual | Parallel | DBR |
|---|---|---|---|
| Base data | 470 (450 without units) | 238 (218) | 150 |
| Operation 1 becomes fast | 365 (350) | 205 (198) | 150 |
| Operation 2 becomes the bottleneck | 530 | 298 (278) | 258 |

<div class="mg" data-g="seqline" data-preset="seminar"></div>

### Practice Test 2, exercises 1 and 2

Exercise 1 (20 units): gradual 305 / 285, parallel 138 / 122, DBR 118 / 87 (with / without units for the setup). One more unit: gradual +40, parallel +7 (+3 without units).

Exercise 2 (23 units): the task says D takes 12 min, but the answer key's table uses 11 (200 / 167, 107 / 101, 98 / 46). With the 12 in the task: 204 / 171, 108 / 105, 99 / 50. One more unit (24) changes nothing.

:::teach Teacher said
Come with paper and pen (or a tablet) and **draw** the process to scale. A cycle is a whole number: with 22 units and 4 per cycle you run 6 cycles, and the last one carries only 2 units, which also changes the tail.
:::

<div class="mg" data-g="drill" data-kind="seq-lead"></div>

<div class="mg" data-g="trap" data-set="t2"></div>

{{q:t4-cyc}}
{{q:t4-grad}}
{{q:t4-par}}
{{q:t4-setup}}
{{q:t4-sem}}
