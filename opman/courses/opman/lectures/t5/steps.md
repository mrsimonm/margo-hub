## The five parts of process design | 5 min

:::idea The idea
**Process design** is the conceptual exercise that determines the specifics of the activities that create the desired product or service. One thing is having the idea, another is making it happen: that's operations.
:::

| Part | What it decides |
|---|---|
| **Product/service design** | the output of the process |
| **Process technology** | the steps, tools, methods and systems to obtain the output |
| **People, jobs and organisation** | the organisational structure, job descriptions and profiles, with HR |
| **Layout and flow** | where the workstations are and how material, products and information flow |
| **Supply network design** | the operation in the context of its suppliers and customers |

:::teach Teacher said
Print this picture in your head and remember at least the key word of each box: it is a test question and a state-exam question. There is no fixed order, but all five have to be filled.
:::

### QFD: from what the customer wants to what you can build

The customer says "red". You manufacture an RGB code you can check. **Quality function deployment** (the house of quality) lists what the customer wants and how important each thing is, the technical characteristics that deliver it, how strongly they relate (and whether they help or fight each other, on the roof), and the competitors. The result: the technical features that matter most.

{{q:t5-pd}}
{{q:t5-five}}
{{q:t5-qfd}}

## Technology, people, layout | 5 min

**Process technology**: machines, equipment, appliances, software, hardware; automatic or manual; **CAD and CAM**, **CNC**, **FMS** (flexible manufacturing systems), **3D printing** (additive manufacturing). Then: what is the best process technology?

:::ana Think of it like this
A CNC machine makes a metal part in 15 minutes; a 3D printer can need 3 hours, and printed metal may not be as strong. For a million parts, the "old-fashioned" machine wins. Choose the technology for the operation, not because it is fashionable.
:::

- **Service and CRM**: to satisfy customer needs you need knowledge about the client. CRM is a strategic vision of learning and keeping customer needs to reach the highest possible profit, not just a database or a call centre.
- **People, jobs and organisation**: the structure of the teams and the job descriptions are the operations manager's job, not HR's. Write exactly what the job needs (two hands? Czech and English?) so HR's default biases don't decide.
- **Layout and flow**: where things physically are and how they flow. Put the people who must talk to each other close together.

{{q:t5-tech}}
{{q:t5-layout}}
{{q:t5-job}}
{{q:t5-cnc3d}}

## Supply network: make, contract or buy | 3 min

The table on the slide (Brickley et al., Managerial economics and organizational architecture) compares **asset specificity** (how specific the thing is) with **uncertainty** (how hard it is to get on the market).

| | Low uncertainty | High uncertainty |
|---|---|---|
| **Low asset specificity** | market transaction | market transaction |
| **High asset specificity** | contract | vertical integration |

Vertical integration **upstream** means buying your suppliers, towards the raw materials; **downstream** means owning logistics and sales, towards the customer.

<div class="mg" data-g="sort" data-set="vint"></div>

{{q:t5-vi}}
{{q:t5-mkt}}

## Choosing the technology: the calculation | 8 min

Total cost of each option is a straight line: **TC = FC + VC · Q** (y = b + mx). The fixed cost is where the line starts; the variable cost is its slope. Two options cost the same at

**Q = (FC_B − FC_A) / (VC_A − VC_B)**

<div class="mg" data-g="order" data-set="be"></div>

### Seminar examples

- **Two CNCs**: A (FC 2 700 000, VC 240), B (FC 3 600 000, VC 210). Q = 900 000 / 30 = **30 000**. For 25 000 units: A; for 35 000: B. With capacities (A 25 000, B 50 000): A for 1–25 000, B for 25 001–50 000.
- **Three suppliers**: Q(I, II) = 100, Q(II, III) = 200, Q(I, III) = 120. Cheapest: I up to 100, II 100–200, III above 200 (the crossing at 120 is above line II, so it doesn't matter). With capacities (II only up to 110): I 0–100, II 100–110, **jump** back to I 111–120, III 120–250.
- **Practice Test 2, exercise 3**: B up to 7 600, then C (A is never cheapest). With capacities: B 0–5 000, A 5 001–6 000, C 6 000–11 000. If A's material drops from 25 to 20 CZK, A and C have the same VC: parallel lines, A always beats C.

:::trap Exam trap
After a capacity ends, compare only the lines that still exist: that's the **jump**. And if the numbers are given per month instead of per year, nothing changes except the period: don't divide by 12.
:::

<div class="mg" data-g="breakeven" data-preset="cnc"></div>

<div class="mg" data-g="drill" data-kind="be"></div>

{{q:t5-tc}}
{{q:t5-q}}
{{q:t5-cnc}}
{{q:t5-jump}}
{{q:t5-month}}
{{q:t5-sup}}
