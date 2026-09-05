# BrainSAIT Shopify Relaunch Acceptance Results

Checked at: 2026-09-05T16:36:46.844Z
Preview theme: 149785313363
Storefront: https://store.brainsait.de

Summary: PASS 13, FAIL 0, BLOCKED 1

| Check | Status | Evidence |
| --- | --- | --- |
| preview homepage renders canonical positioning | PASS | {"status":200,"finalUrl":"https://store.brainsait.de/","needles":["BrainSAIT","Learn","Build","Solutions","OID","Registry"]} |
| collection route learn | PASS | {"status":200,"finalUrl":"https://store.brainsait.de/collections/learn"} |
| collection route build | PASS | {"status":200,"finalUrl":"https://store.brainsait.de/collections/build"} |
| collection route solutions | PASS | {"status":200,"finalUrl":"https://store.brainsait.de/collections/solutions"} |
| collection route solutions-ready | PASS | {"status":200,"finalUrl":"https://store.brainsait.de/collections/solutions-ready"} |
| collection route oid-registry | PASS | {"status":200,"finalUrl":"https://store.brainsait.de/collections/oid-registry"} |
| product route ai-system-architect | PASS | {"family":"LEARN","status":200,"title":"AI System Architect"} |
| product route build-forge-incubator-founders-program-1 | PASS | {"family":"BUILD","status":200,"title":"BUILD — Forge Incubator Founders Program"} |
| product route abeer-connected-healthcare-platform | PASS | {"family":"SOLUTIONS","status":200,"title":"Abeer Connected Healthcare Platform"} |
| product route solutions-ready-basma-voice | PASS | {"family":"SOLUTIONS READY","status":200,"title":"Basma Voice — Solutions Ready"} |
| product route oid-identity | PASS | {"family":"OID & REGISTRY","status":200,"title":"BrainSAIT OID"} |
| cart add entry accepts representative LEARN product | PASS | {"productHandle":"ai-system-architect","variantId":45912825659475,"status":200} |
| recurring payment live execution | BLOCKED | {"status":503,"reason":"recurring subscriptions are not confirmed for live mode yet — complete a full test-mode subscription cycle first (see RUNBOOK.md), then set RECURRING_LIVE_CONFIRMED=true"} |
| published theme unchanged | PASS | {"mainThemeId":149735112787,"stagingThemeId":149785313363,"stagingRole":"unpublished"} |

Publication remains gated on explicit approval and resolution of blocked recurring-payment validation.
