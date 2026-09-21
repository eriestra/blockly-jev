# Almond contracts for the Jev runtime

The hosted demo at https://sites.almond.build/blockly-jev/ uses these Almond
protected calls. Recreate them on your own site with `protected_call_put`
after `action_endpoint_put` (key `typesafe`, template
`https://api.typesafe.ai/v1/systemone`) and `secret_put` (key
`typesafe_bearer`, value `Bearer <your TypeSafe API key>`).

Common parts of every contract:

```json
"requestTemplate": {
  "headers": [{ "name": "Authorization", "value": "{{secret.typesafe_bearer}}" }],
  "body": { "model": "jev-latest", "state": "{{input.state}}", "questions": { "q": { ... } } }
}
```

| Key | Inputs | Question `q` | Response fields |
| --- | --- | --- | --- |
| `jev_noul` | `state`, `instructions` | `{type: noul, instructions}` | `noul` |
| `jev_noul_described` | + `yes_means`, `no_means` | `criteria: {true, false}` | `noul` |
| `jev_score_N` (N = 2..5) | + `l1..lN` | `{type: score, criteria: [l1..lN]}` | `score`, `confidence` |
| `jev_choice_N` (N = 2..6) | + `l1,d1..lN,dN` | `criteria: {option_k: {name: lk, meaning: dk}}` | `choice`, `confidence` |

Input string limits: `state` 4096, `instructions` 2000, labels 200,
descriptions and levels 500. Limits used by the demo (Almond's backend quota tier): 60 per minute, 5000
per day, 8 concurrent, 15 s timeout, per call key. Every block is one call, so a Run of the
bundled example uses four.

The page calls `POST https://almond.build/api/invoke/<site-slug>/<key>` with
`{"input": {...}}` and receives `{"ok": true, "output": {...}}`. Almond only
accepts these requests from that site's own pages.
